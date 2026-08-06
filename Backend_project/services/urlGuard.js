import dns from "node:dns/promises";
import net from "node:net";

// Plan section 8.1. The core function of this system is "take a URL from an
// anonymous stranger and have the server connect to it", which is the textbook
// SSRF setup. Every outbound request in the OSINT module goes through here.
//
// The frontend's original check was a bare `new URL()` in a try/catch, which
// accepted javascript:, file:///etc/passwd, http://127.0.0.1 and
// http://169.254.169.254/ (cloud instance metadata) while rejecting
// "example.com" — the most common way a non-technical user types an address.
//
// Controls implemented, per the OWASP SSRF Prevention Cheat Sheet:
//   - strict scheme allowlist (http/https only)
//   - scheme normalisation so bare hostnames are usable
//   - private / reserved / link-local IP blocking for both IPv4 and IPv6
//   - resolve-then-validate, returning the pinned IPs so the caller connects
//     to an address that was actually checked (DNS rebinding)
//   - explicit redirect handling, re-validated per hop, capped

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export const MAX_REDIRECTS = 3;

/** Reasons a URL can be refused. Stable strings — tests and callers match on these. */
export const RejectionReason = {
  EMPTY: "empty",
  MALFORMED: "malformed",
  BAD_SCHEME: "disallowed_scheme",
  HAS_CREDENTIALS: "embedded_credentials",
  BAD_PORT: "disallowed_port",
  NO_HOSTNAME: "missing_hostname",
  PRIVATE_IP: "private_or_reserved_address",
  DNS_FAILED: "dns_resolution_failed",
  TOO_MANY_REDIRECTS: "too_many_redirects",
};

// Ports other than the web ports are almost always an attempt to reach an
// internal service rather than a real investment platform's website.
const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

/** IPv4 ranges that must never be reachable from a user-supplied URL. */
const BLOCKED_V4 = [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // RFC1918 private
  ["100.64.0.0", 10], // RFC6598 carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local — includes 169.254.169.254 cloud metadata
  ["172.16.0.0", 12], // RFC1918 private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.168.0.0", 16], // RFC1918 private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, includes 255.255.255.255
];

const ipv4ToInt = (ip) =>
  ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;

const inV4Cidr = (ip, base, bits) => {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
};

/** Expands an IPv6 address to its eight full hextets. */
const expandV6 = (address) => {
  let ip = address.toLowerCase().replace(/^\[|\]$/g, "");

  // An embedded IPv4 tail (::ffff:127.0.0.1) has to become hex before parsing.
  const v4Tail = ip.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (v4Tail) {
    const n = ipv4ToInt(v4Tail[1]);
    const high = (n >>> 16).toString(16);
    const low = (n & 0xffff).toString(16);
    ip = ip.slice(0, v4Tail.index) + `${high}:${low}`;
  }

  const [head, tail] = ip.split("::");
  const headParts = head ? head.split(":").filter(Boolean) : [];
  const tailParts = tail ? tail.split(":").filter(Boolean) : [];
  const missing = 8 - headParts.length - tailParts.length;

  const parts = ip.includes("::")
    ? [...headParts, ...Array(Math.max(0, missing)).fill("0"), ...tailParts]
    : ip.split(":");

  return parts.map((part) => parseInt(part || "0", 16));
};

const isBlockedV6 = (address) => {
  const h = expandV6(address);
  if (h.length !== 8 || h.some(Number.isNaN)) return true; // unparseable, refuse

  const allZero = h.every((x) => x === 0);
  if (allZero) return true; // ::  unspecified
  if (h.slice(0, 7).every((x) => x === 0) && h[7] === 1) return true; // ::1 loopback

  if ((h[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique-local
  if ((h[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if (h[0] === 0xff00 || (h[0] & 0xff00) === 0xff00) return true; // ff00::/8 multicast

  // IPv4-mapped (::ffff:0:0/96) — check the embedded v4 address on its merits.
  if (h.slice(0, 5).every((x) => x === 0) && h[5] === 0xffff) {
    const v4 = [h[6] >> 8, h[6] & 0xff, h[7] >> 8, h[7] & 0xff].join(".");
    return isBlockedIp(v4);
  }

  return false;
};

/** True if this literal IP address must not be contacted. */
export const isBlockedIp = (ip) => {
  if (net.isIPv4(ip)) {
    return BLOCKED_V4.some(([base, bits]) => inV4Cidr(ip, base, bits));
  }
  if (net.isIPv6(ip)) {
    return isBlockedV6(ip);
  }
  return true; // not an IP at all — caller should not have passed it
};

const reject = (reason, message) => ({ ok: false, reason, message });

/**
 * Parses and normalises a user-supplied website address without touching the
 * network. Adds https:// when the user omitted a scheme, so "example.com"
 * works — the usability half of the problem.
 *
 * @returns {{ok: true, url: URL, hostname: string, normalizedDomain: string}
 *          | {ok: false, reason: string, message: string}}
 */
export const normalizeUrl = (input) => {
  if (typeof input !== "string" || !input.trim()) {
    return reject(RejectionReason.EMPTY, "Enter a website address");
  }

  const raw = input.trim();

  // Only prepend a scheme when there is no scheme at all. Doing this blindly
  // would turn "javascript:alert(1)" into a valid https URL and defeat the
  // allowlist below.
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  const candidate = hasScheme ? raw : `https://${raw}`;

  let url;
  try {
    url = new URL(candidate);
  } catch {
    return reject(RejectionReason.MALFORMED, "Enter a valid website address");
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return reject(
      RejectionReason.BAD_SCHEME,
      "Only http:// and https:// addresses can be analysed"
    );
  }

  // user:pass@host would send those credentials to the target on our behalf.
  if (url.username || url.password) {
    return reject(
      RejectionReason.HAS_CREDENTIALS,
      "Remove the username and password from the address"
    );
  }

  if (!url.hostname) {
    return reject(RejectionReason.NO_HOSTNAME, "Enter a valid website address");
  }

  if (!ALLOWED_PORTS.has(url.port)) {
    return reject(RejectionReason.BAD_PORT, "That port cannot be analysed");
  }

  // A literal IP in the URL skips DNS entirely, so check it here too.
  const bare = url.hostname.replace(/^\[|\]$/g, "");
  if ((net.isIP(bare) && isBlockedIp(bare)) || url.hostname === "localhost") {
    return reject(
      RejectionReason.PRIVATE_IP,
      "That address points to a private or reserved network"
    );
  }

  return {
    ok: true,
    url,
    hostname: url.hostname,
    normalizedDomain: normalizeDomain(url.hostname),
  };
};

/**
 * Lowercased, www-stripped hostname. This is the key that Analysis, Report and
 * Watchlist records are matched on, so it has to be derived one way only.
 */
export const normalizeDomain = (hostname) =>
  String(hostname || "")
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/^www\./, "")
    .replace(/\.$/, "");

/**
 * Full check: normalise, resolve, and validate every address the hostname
 * resolves to. Returns the resolved IPs so the caller can pin the connection
 * to an address that was actually inspected rather than re-resolving (which is
 * the window a DNS rebinding attack needs).
 */
export const assertSafeUrl = async (input, { timeoutMs = 5000 } = {}) => {
  const normalized = normalizeUrl(input);
  if (!normalized.ok) return normalized;

  const { hostname } = normalized;

  // A literal IP was already validated by normalizeUrl; no lookup needed.
  const bare = hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(bare)) {
    return { ...normalized, addresses: [bare] };
  }

  let records;
  try {
    records = await Promise.race([
      dns.lookup(hostname, { all: true, verbatim: true }),
      new Promise((_, rejectPromise) =>
        setTimeout(() => rejectPromise(new Error("timeout")), timeoutMs)
      ),
    ]);
  } catch (error) {
    return reject(
      RejectionReason.DNS_FAILED,
      error?.code === "ENOTFOUND"
        ? "That domain does not exist"
        : "Could not resolve that domain"
    );
  }

  if (!records?.length) {
    return reject(RejectionReason.DNS_FAILED, "Could not resolve that domain");
  }

  // Every resolved address must pass. One private address is enough to refuse:
  // a hostname resolving to both a public and a private IP is a rebinding
  // pattern, not a legitimate configuration.
  const blocked = records.find((record) => isBlockedIp(record.address));
  if (blocked) {
    return reject(
      RejectionReason.PRIVATE_IP,
      "That address resolves to a private or reserved network"
    );
  }

  return { ...normalized, addresses: records.map((record) => record.address) };
};

/**
 * fetch() with SSRF checks applied to the initial URL and to every redirect
 * hop. Redirects are followed manually so each Location can be re-validated —
 * a target that redirects to 127.0.0.1 is the standard bypass.
 */
export const safeFetch = async (input, { method = "HEAD", timeoutMs = 8000 } = {}) => {
  let current = input;
  const chain = [];

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const checked = await assertSafeUrl(current, { timeoutMs });
    if (!checked.ok) return checked;

    let response;
    try {
      response = await fetch(checked.url, {
        method,
        redirect: "manual", // we validate each hop ourselves
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "User-Agent": "InvestiCheck/1.0 (+risk-assessment-research)" },
      });
    } catch (error) {
      return {
        ok: false,
        reason: error?.name === "TimeoutError" ? "timeout" : "unreachable",
        message: "Could not reach that website",
        chain,
      };
    }

    const isRedirect = response.status >= 300 && response.status < 400;
    const location = response.headers.get("location");

    if (!isRedirect || !location) {
      return { ok: true, response, finalUrl: checked.url.toString(), chain };
    }

    chain.push({ from: checked.url.toString(), status: response.status, to: location });
    current = new URL(location, checked.url).toString();
  }

  return reject(
    RejectionReason.TOO_MANY_REDIRECTS,
    `That website redirected more than ${MAX_REDIRECTS} times`
  );
};

export default { normalizeUrl, normalizeDomain, assertSafeUrl, safeFetch, isBlockedIp };
