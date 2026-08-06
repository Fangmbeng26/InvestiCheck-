import config from "../../config/env.js";
import { assertSafeUrl, normalizeUrl, normalizeDomain, RejectionReason } from "../urlGuard.js";
import { lookupDomain } from "./rdap.js";
import { lookupDns } from "./dnsLookup.js";
import { checkTls } from "./tlsCheck.js";
import { checkAvailability } from "./availability.js";

// Orchestrates the four probes. Two non-functional requirements shape this:
//
// NFR 11.2 (performance): the probes run concurrently via Promise.allSettled,
// so wall-clock is the slowest single probe rather than the sum of all four.
//
// NFR 11.4 (reliability): "the system should remain functional even when one
// external OSINT service is unavailable ... the system should still allow the
// user to perform the manual risk assessment". No probe is allowed to throw
// into the request. Each returns a discriminated result and a failure becomes
// `unknown`, which lowers the coverage figure instead of the risk score.

/** In-process cache. A single-node deployment does not need Redis for this. */
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

export default { collectOsint, toStoredShape, clearOsintCache };
