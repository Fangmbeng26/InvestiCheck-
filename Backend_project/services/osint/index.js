import config from "../../config/env.js";
import { assertSafeUrl, normalizeUrl, normalizeDomain, RejectionReason } from "../urlGuard.js";
import { lookupDomain } from "./rdap.js";
import { lookupDns } from "./dnsLookup.js";
import { checkTls } from "./tlsCheck.js";
import { checkAvailability } from "./availability.js";


const cache = new Map();

const cacheKey = (domain) => `osint:${domain}`;

const readCache = (domain) => {
  const entry = cache.get(cacheKey(domain));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey(domain));
    return null;
  }
  return entry.value;
};

const writeCache = (domain, value) => {
  if (config.OSINT_CACHE_TTL_SECONDS <= 0) return;
  cache.set(cacheKey(domain), {
    value,
    expiresAt: Date.now() + config.OSINT_CACHE_TTL_SECONDS * 1000,
  });
};

export const clearOsintCache = () => cache.clear();

/**
 * Normalises a settled promise into { status, data | reason }.
 * `status` is one of: ok | not_found | timeout | unavailable.
 */
const settle = (outcome) => {
  if (outcome.status === "rejected") {
    return { status: "unavailable", data: null, error: String(outcome.reason?.message ?? outcome.reason) };
  }
  const value = outcome.value;
  if (value?.ok) return { status: "ok", data: value.data };
  return { status: value?.reason ?? "unavailable", data: null };
};

/**
 * Runs the full OSINT pass for one website.
 *
 * @param {string} websiteUrl - raw user input; validated here
 * @param {{skipCache?: boolean}} options
 * @returns {Promise<{ok: boolean, data?: object, reason?: string, message?: string}>}
 */
export const collectOsint = async (websiteUrl, { skipCache = false } = {}) => {
  // Validate and resolve before any probe runs. This is the SSRF gate; it also
  // gives us the canonical hostname the probes should use.
  const checked = await assertSafeUrl(websiteUrl);

  // A domain that does not resolve is a *finding*, not a reason to refuse the
  // request. Registration data is still available (the registry answers
  // independently of whether the name resolves), and NFR 11.4 requires the
  // user to be able to complete the assessment regardless. Every other
  // rejection reason is a genuine SSRF or input refusal and stays fatal.
  const unresolvable = !checked.ok && checked.reason === RejectionReason.DNS_FAILED;

  if (!checked.ok && !unresolvable) {
    return { ok: false, reason: checked.reason, message: checked.message };
  }

  const parsed = checked.ok ? checked : normalizeUrl(websiteUrl);
  if (!parsed.ok) {
    return { ok: false, reason: parsed.reason, message: parsed.message };
  }

  const { hostname, url } = parsed;
  const domain = normalizeDomain(hostname);

  if (!skipCache) {
    const cached = readCache(domain);
    if (cached) return { ok: true, data: { ...cached, cached: true } };
  }

  const timeoutMs = config.OSINT_TIMEOUT_MS;
  const startedAt = Date.now();

  // A ceiling on the whole pass, independent of the per-probe timeouts, so one
  // pathological host cannot hold the request open.
  const budget = new Promise((resolve) =>
    setTimeout(() => resolve("budget_exhausted"), config.OSINT_TOTAL_BUDGET_MS)
  );

  // When the name does not resolve there is nothing to connect to, so the two
  // network probes are skipped and reported as findings rather than errors.
  // RDAP still runs: the registry answers whether or not the name resolves,
  // and "registered last week but does not resolve" is a strong combination.
  const unreachableResult = {
    ok: true,
    data: {
      reachable: false,
      inconclusive: false,
      statusCode: null,
      finalUrl: null,
      redirects: [],
      redirectCount: 0,
      responseTimeMs: 0,
      error: "dns_not_found",
    },
  };

  const probes = Promise.allSettled([
    unresolvable ? Promise.resolve(unreachableResult) : checkAvailability(url.toString(), { timeoutMs }),
    lookupDomain(domain, { timeoutMs }),
    lookupDns(hostname, { timeoutMs }),
    unresolvable
      ? Promise.resolve({ ok: true, data: { httpsAvailable: false, certValid: false, reason: "dns_not_found" } })
      : checkTls(hostname, { timeoutMs }),
  ]);

  const outcome = await Promise.race([probes, budget]);

  // Budget blown: return an all-unknown result rather than hanging. Coverage
  // will reflect how little was learned.
  const [availability, domainInfo, dnsInfo, tlsInfo] =
    outcome === "budget_exhausted"
      ? Array(4).fill({ status: "timeout", data: null })
      : outcome.map(settle);

  const data = {
    domain,
    website: url.toString(),
    availability,
    domain_registration: domainInfo,
    dns: dnsInfo,
    tls: tlsInfo,
    durationMs: Date.now() - startedAt,
    budgetExhausted: outcome === "budget_exhausted",
    cached: false,
    collectedAt: new Date(),
  };

  writeCache(domain, data);

  return { ok: true, data };
};

/**
 * Flattens the orchestrator output into the shape stored on an Analysis
 * document (plan section 10.3), keeping only what the schema declares.
 */
export const toStoredShape = (osint) => ({
  availability: {
    reachable: osint.availability.data?.reachable ?? null,
    statusCode: osint.availability.data?.statusCode ?? null,
    finalUrl: osint.availability.data?.finalUrl ?? null,
    redirectCount: osint.availability.data?.redirectCount ?? null,
    responseTimeMs: osint.availability.data?.responseTimeMs ?? null,
    status: osint.availability.status,
  },
  domain: {
    registrationDate: osint.domain_registration.data?.registrationDate ?? null,
    expiryDate: osint.domain_registration.data?.expiryDate ?? null,
    registrar: osint.domain_registration.data?.registrar ?? null,
    ageDays: osint.domain_registration.data?.ageDays ?? null,
    daysUntilExpiry: osint.domain_registration.data?.daysUntilExpiry ?? null,
    source: osint.domain_registration.data?.source ?? "rdap",
    status: osint.domain_registration.status,
  },
  dns: {
    resolves: osint.dns.data?.resolves ?? null,
    a: osint.dns.data?.a ?? [],
    ns: osint.dns.data?.ns ?? [],
    mx: (osint.dns.data?.mx ?? []).map((record) => record.exchange),
    hasMx: osint.dns.data?.hasMx ?? null,
    nameserverCount: osint.dns.data?.nameserverCount ?? null,
    status: osint.dns.status,
  },
  tls: {
    httpsAvailable: osint.tls.data?.httpsAvailable ?? null,
    certValid: osint.tls.data?.certValid ?? null,
    issuer: osint.tls.data?.issuer ?? null,
    validFrom: osint.tls.data?.validFrom ?? null,
    validTo: osint.tls.data?.validTo ?? null,
    protocol: osint.tls.data?.protocol ?? null,
    status: osint.tls.status,
  },
});

/**
 * Rebuilds the collector's { status, data } shape from a stored document.
 *
 * Persistence flattens the evidence to keep the record compact, which left the
 * API describing the same field two different ways: one shape when an
 * assessment was created and another when it was fetched back. Callers had to
 * know which endpoint the data came from. This restores the single shape so a
 * stored assessment reads exactly like a fresh one.
 */
export const fromStoredShape = (stored) => {
  if (!stored) return null;

  // A probe that never completed was saved with a non-ok status and no values;
  // it must come back as unavailable rather than as an object full of nulls,
  // so that "we could not check" stays distinguishable from "we checked and
  // found nothing".
  const wrap = (status, data) => ({
    status: status ?? "unavailable",
    data: status === "ok" ? data : null,
  });

  return {
    availability: wrap(stored.availability?.status, {
      reachable: stored.availability?.reachable ?? null,
      statusCode: stored.availability?.statusCode ?? null,
      finalUrl: stored.availability?.finalUrl ?? null,
      redirectCount: stored.availability?.redirectCount ?? null,
      responseTimeMs: stored.availability?.responseTimeMs ?? null,
      inconclusive: false,
    }),
    domain_registration: wrap(stored.domain?.status, {
      registrationDate: stored.domain?.registrationDate ?? null,
      expiryDate: stored.domain?.expiryDate ?? null,
      registrar: stored.domain?.registrar ?? null,
      ageDays: stored.domain?.ageDays ?? null,
      daysUntilExpiry: stored.domain?.daysUntilExpiry ?? null,
      source: stored.domain?.source ?? "rdap",
    }),
    dns: wrap(stored.dns?.status, {
      resolves: stored.dns?.resolves ?? null,
      a: stored.dns?.a ?? [],
      ns: stored.dns?.ns ?? [],
      mx: (stored.dns?.mx ?? []).map((exchange) => ({ exchange })),
      hasMx: stored.dns?.hasMx ?? null,
      nameserverCount: stored.dns?.nameserverCount ?? null,
    }),
    tls: wrap(stored.tls?.status, {
      httpsAvailable: stored.tls?.httpsAvailable ?? null,
      certValid: stored.tls?.certValid ?? null,
      issuer: stored.tls?.issuer ?? null,
      validFrom: stored.tls?.validFrom ?? null,
      validTo: stored.tls?.validTo ?? null,
      protocol: stored.tls?.protocol ?? null,
    }),
  };
};

export default { collectOsint, toStoredShape, fromStoredShape, clearOsintCache };
