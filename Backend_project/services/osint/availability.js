import config from "../../config/env.js";
import { safeFetch } from "../urlGuard.js";

// Every request goes through safeFetch, so the SSRF controls apply to the
// initial URL and to each redirect hop.

// Interpretation caution, carried into the result as `inconclusive`: a
// non-2xx response is weakly diagnostic. Legitimate sites go down, hosting
// providers block unfamiliar server IPs, and CAPTCHA walls return 403. Only a
// clean connection failure is treated as "unavailable"; ambiguous HTTP
// statuses are reported as inconclusive so the risk engine can score them at
// half weight rather than asserting the site is dead.

/**
 * @returns {Promise<{ok: true, data: object} | {ok: false, reason: string}>}
 */
export const checkAvailability = async (url, { timeoutMs = config.OSINT_TIMEOUT_MS } = {}) => {
  const startedAt = Date.now();

  // HEAD first: cheaper, and we only need headers. Many servers reject it
  // though, so a 405/501 falls back to GET.
  let result = await safeFetch(url, { method: "HEAD", timeoutMs });

  if (result.ok && [405, 501, 403].includes(result.response.status)) {
    const viaGet = await safeFetch(url, { method: "GET", timeoutMs });
    if (viaGet.ok) result = viaGet;
  }

  const responseTimeMs = Date.now() - startedAt;

  if (!result.ok) {
    // urlGuard refused it — a validation failure, not a reachability finding.
    if (result.reason && !["timeout", "unreachable"].includes(result.reason)) {
      return { ok: false, reason: "blocked", detail: result.message };
    }

    return {
      ok: true,
      data: {
        reachable: false,
        inconclusive: result.reason === "timeout",
        statusCode: null,
        finalUrl: null,
        redirects: [],
        responseTimeMs,
        error: result.reason,
      },
    };
  }

  const { response, finalUrl, chain } = result;
  const status = response.status;

  // 2xx and 3xx are alive. 4xx/5xx mean something answered, but we cannot tell
  // a dead platform from a bot-blocking CDN, so we decline to call it either.
  const reachable = status >= 200 && status < 400;
  const inconclusive = !reachable;

  return {
    ok: true,
    data: {
      reachable,
      inconclusive,
      statusCode: status,
      finalUrl,
      // A chain that leaves the original domain is worth surfacing.
      redirects: chain.map((hop) => ({ from: hop.from, to: hop.to, status: hop.status })),
      redirectCount: chain.length,
      responseTimeMs,
      server: response.headers.get("server"),
      error: null,
    },
  };
};

export default { checkAvailability };
