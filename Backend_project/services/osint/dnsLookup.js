import dns from "node:dns/promises";
import config from "../../config/env.js";

// FR-06: "The system shall perform basic DNS analysis of the submitted domain"
// — IP address records, nameserver records, mail exchange records.
//
// Node's built-in resolver covers all of this with no dependency and no key.
//
// The important distinction, and the reason each record type is handled
// separately: ENOTFOUND/NXDOMAIN means the registry says this name does not
// exist, which is evidence *about the domain*. A timeout or SERVFAIL means our
// resolver had a problem, which says nothing about the domain and must become
// "unknown" rather than a risk signal.

const NOT_FOUND_CODES = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN"]);

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => {
        const error = new Error("dns timeout");
        error.code = "ETIMEOUT";
        reject(error);
      }, timeoutMs)
    ),
  ]);

/**
 * Runs one record-type query and normalises its failure modes.
 * ENODATA (name exists, no record of this type) is a legitimate empty result,
 * not an error — plenty of real domains have no MX or no AAAA.
 */
const queryRecord = async (fn, timeoutMs) => {
  try {
    return { ok: true, records: await withTimeout(fn(), timeoutMs) };
  } catch (error) {
    const code = error?.code ?? "UNKNOWN";
    if (NOT_FOUND_CODES.has(code)) {
      return { ok: true, records: [], code };
    }
    return { ok: false, code };
  }
};

/**
 * @returns {Promise<{ok: true, data: object} | {ok: false, reason: string}>}
 */
export const lookupDns = async (hostname, { timeoutMs = config.OSINT_TIMEOUT_MS } = {}) => {
  const target = String(hostname || "").toLowerCase().trim();
  if (!target) return { ok: false, reason: "unavailable" };

  const [a, aaaa, ns, mx, txt] = await Promise.all([
    queryRecord(() => dns.resolve4(target), timeoutMs),
    queryRecord(() => dns.resolve6(target), timeoutMs),
    queryRecord(() => dns.resolveNs(target), timeoutMs),
    queryRecord(() => dns.resolveMx(target), timeoutMs),
    queryRecord(() => dns.resolveTxt(target), timeoutMs),
  ]);

  // If the address lookup itself failed outright, we learned nothing.
  if (!a.ok && !aaaa.ok) {
    return { ok: false, reason: a.code === "ETIMEOUT" ? "timeout" : "unavailable" };
  }

  const addresses = [...(a.records ?? []), ...(aaaa.records ?? [])];

  // No address records at all, and the resolver answered cleanly: the name
  // does not resolve. That is a real signal.
  if (addresses.length === 0 && a.code && NOT_FOUND_CODES.has(a.code)) {
    return {
      ok: true,
      data: {
        resolves: false,
        a: [],
        aaaa: [],
        ns: [],
        mx: [],
        hasMx: false,
        nameserverCount: 0,
        txtCount: 0,
      },
    };
  }

  const mxRecords = (mx.records ?? []).map((record) => ({
    exchange: record.exchange,
    priority: record.priority,
  }));

  const nsRecords = (ns.records ?? []).map((record) => record.toLowerCase());

  return {
    ok: true,
    data: {
      resolves: addresses.length > 0,
      a: a.records ?? [],
      aaaa: aaaa.records ?? [],
      ns: nsRecords,
      mx: mxRecords,
      // A business handling other people's money almost always has email on
      // its own domain; the absence is a weak but real signal (indicator T4).
      hasMx: mxRecords.length > 0,
      nameserverCount: nsRecords.length,
      txtCount: (txt.records ?? []).length,
    },
  };
};

export default { lookupDns };
