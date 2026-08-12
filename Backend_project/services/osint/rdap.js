import config from "../../config/env.js";



const BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";

const FALLBACK_RESOLVER = "https://rdap.org";

const BOOTSTRAP_TTL_MS = 24 * 60 * 60 * 1000;

/** Cached IANA bootstrap: { tld -> base URL }. */
let bootstrapCache = null;
let bootstrapFetchedAt = 0;

const fail = (reason, detail) => ({ ok: false, reason, detail });


const loadBootstrap = async (timeoutMs) => {
  const fresh = bootstrapCache && Date.now() - bootstrapFetchedAt < BOOTSTRAP_TTL_MS;
  if (fresh) return bootstrapCache;

  const response = await fetch(BOOTSTRAP_URL, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`bootstrap returned HTTP ${response.status}`);
  }

  const body = await response.json();
  const index = new Map();

  for (const [tlds, urls] of body.services ?? []) {
    if (!urls?.length) continue;
    // Prefer an https base URL; some ccTLD entries still list http.
    const base = urls.find((url) => url.startsWith("https://")) ?? urls[0];
    for (const tld of tlds) {
      index.set(tld.toLowerCase(), base.endsWith("/") ? base : `${base}/`);
    }
  }

  bootstrapCache = index;
  bootstrapFetchedAt = Date.now();
  return index;
};

/** Picks the RDAP base URL for a domain, longest TLD match first. */
const resolveBaseUrl = async (domain, timeoutMs) => {
  const index = await loadBootstrap(timeoutMs);
  const labels = domain.split(".");

  // Try the longest suffix first so multi-label TLDs win over their parent.
  for (let i = 1; i < labels.length; i += 1) {
    const suffix = labels.slice(i).join(".");
    const base = index.get(suffix);
    if (base) return base;
  }

  return null;
};

/** Pulls a named event date out of an RDAP response. */
const eventDate = (events, action) => {
  const match = (events ?? []).find(
    (event) => event.eventAction?.toLowerCase() === action
  );
  return match?.eventDate ? new Date(match.eventDate) : null;
};

/**
 * Registrar name from the entities array. RDAP encodes these as jCard
 * (vcardArray), where the "fn" property holds the display name.
 */
const registrarName = (entities) => {
  const registrar = (entities ?? []).find((entity) =>
    (entity.roles ?? []).includes("registrar")
  );
  if (!registrar) return null;

  const properties = registrar.vcardArray?.[1] ?? [];
  const fn = properties.find((property) => property[0] === "fn");
  return fn?.[3] ?? null;
};

const daysBetween = (from, to) => Math.floor((to - from) / (1000 * 60 * 60 * 24));

/**
 * Looks up registration data for a domain.
 *
 * @returns {Promise<{ok: true, data: object} | {ok: false, reason: string}>}
 *   reason is 'not_found' (the domain genuinely has no registration — evidence
 *   about the domain), or 'timeout' / 'unavailable' / 'unsupported_tld'
 *   (our lookup failed — NOT evidence about the domain, must map to unknown).
 */
export const lookupDomain = async (domain, { timeoutMs = config.OSINT_TIMEOUT_MS } = {}) => {
  const target = String(domain || "").toLowerCase().trim();
  if (!target || !target.includes(".")) {
    return fail("unavailable", "not a domain name");
  }

  let base;
  try {
    base = await resolveBaseUrl(target, timeoutMs);
  } catch (error) {
    // Bootstrap unreachable — fall through to the public resolver.
    base = null;
  }

  const endpoints = base
    ? [`${base}domain/${encodeURIComponent(target)}`]
    : [`${FALLBACK_RESOLVER}/domain/${encodeURIComponent(target)}`];

  let lastReason = "unavailable";

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Accept: "application/rdap+json, application/json" },
        redirect: "follow", // rdap.org 302s to the authoritative registry
      });

      // 404 is meaningful: the registry answered and has no such registration.
      if (response.status === 404) {
        return { ok: false, reason: "not_found" };
      }

      if (!response.ok) {
        lastReason = "unavailable";
        continue;
      }

      const body = await response.json();

      const registrationDate = eventDate(body.events, "registration");
      const expiryDate = eventDate(body.events, "expiration");
      const lastChanged = eventDate(body.events, "last changed");

      const now = new Date();

      return {
        ok: true,
        data: {
          ldhName: body.ldhName ?? target,
          registrationDate,
          expiryDate,
          lastChanged,
          registrar: registrarName(body.entities),
          status: body.status ?? [],
          nameservers: (body.nameservers ?? [])
            .map((ns) => ns.ldhName?.toLowerCase())
            .filter(Boolean),
          ageDays: registrationDate ? daysBetween(registrationDate, now) : null,
          // Negative when already expired; drives the T5 short-window indicator.
          daysUntilExpiry: expiryDate ? daysBetween(now, expiryDate) : null,
          source: "rdap",
          endpoint,
        },
      };
    } catch (error) {
      lastReason = error?.name === "TimeoutError" ? "timeout" : "unavailable";
    }
  }

  return fail(lastReason, `no RDAP data for ${target}`);
};

/** Exposed so tests can reset the module-level bootstrap cache. */
export const _resetBootstrapCache = () => {
  bootstrapCache = null;
  bootstrapFetchedAt = 0;
};

export default { lookupDomain };
