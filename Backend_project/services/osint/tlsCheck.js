import tls from "node:tls";
import config from "../../config/env.js";

// FR-07: "The system shall check whether the website uses HTTPS."
//
// Both the SRS's example output and the original frontend treated this as
// "does the string start with https://", which reads the user's typing rather
// than checking anything. A real check means completing a TLS handshake and
// inspecting the certificate the server actually presents.
//
// That also yields far more than a boolean: whether the chain validates,
// whether the certificate is expired or hostname-mismatched, who issued it,
// and how long it runs for.
//
// FR-07 also requires telling users that HTTPS does not prove legitimacy —
// free DV certificates are trivial to obtain and most scam sites have valid
// HTTPS. That disclaimer is attached to the result here so it cannot be
// dropped by a caller.

export const HTTPS_DISCLAIMER =
  "A valid HTTPS certificate only means traffic to this site is encrypted. " +
  "It does not verify who runs the site, and it does not mean the platform is legitimate.";

const DEFAULT_PORT = 443;

/**
 * Completes a TLS handshake and reports on the presented certificate.
 *
 * `rejectUnauthorized: false` is deliberate: we want to *inspect* invalid
 * certificates rather than refuse them, since an invalid certificate is
 * exactly the signal we are looking for. The validation verdict is read from
 * socket.authorized instead.
 *
 * @returns {Promise<{ok: true, data: object} | {ok: false, reason: string}>}
 */
export const checkTls = (hostname, { timeoutMs = config.OSINT_TIMEOUT_MS, port = DEFAULT_PORT } = {}) =>
  new Promise((resolve) => {
    const target = String(hostname || "").toLowerCase().trim();
    if (!target) {
      resolve({ ok: false, reason: "unavailable" });
      return;
    }

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const socket = tls.connect(
      {
        host: target,
        port,
        servername: target, // SNI — required or shared hosts serve the wrong cert
        rejectUnauthorized: false,
        timeout: timeoutMs,
      },
      () => {
        const certificate = socket.getPeerCertificate();
        const authorized = socket.authorized;
        const authorizationError = socket.authorizationError;
        const protocol = socket.getProtocol();

        socket.end();

        // An empty object means the peer presented no certificate at all.
        if (!certificate || Object.keys(certificate).length === 0) {
          finish({
            ok: true,
            data: {
              httpsAvailable: false,
              certValid: false,
              reason: "no_certificate",
              disclaimer: HTTPS_DISCLAIMER,
            },
          });
          return;
        }

        const validFrom = certificate.valid_from ? new Date(certificate.valid_from) : null;
        const validTo = certificate.valid_to ? new Date(certificate.valid_to) : null;
        const now = new Date();

        const expired = validTo ? validTo < now : false;
        const notYetValid = validFrom ? validFrom > now : false;

        const errorText = String(authorizationError ?? "");
        const selfSigned = /SELF_SIGNED|DEPTH_ZERO/i.test(errorText);
        const hostnameMismatch = /HOSTNAME|ALT_NAME|does not match/i.test(errorText);

        finish({
          ok: true,
          data: {
            httpsAvailable: true,
            certValid: authorized === true,
            validationError: authorized ? null : errorText || null,
            expired,
            notYetValid,
            selfSigned,
            hostnameMismatch,
            issuer: certificate.issuer?.O ?? certificate.issuer?.CN ?? null,
            issuerCN: certificate.issuer?.CN ?? null,
            subjectCN: certificate.subject?.CN ?? null,
            validFrom,
            validTo,
            // A certificate issued days ago on a 90-day free DV term reads
            // differently from a multi-year OV certificate.
            validityDays:
              validFrom && validTo
                ? Math.round((validTo - validFrom) / (1000 * 60 * 60 * 24))
                : null,
            daysUntilExpiry: validTo
              ? Math.floor((validTo - now) / (1000 * 60 * 60 * 24))
              : null,
            altNameCount: (certificate.subjectaltname ?? "").split(",").filter(Boolean).length,
            protocol,
            disclaimer: HTTPS_DISCLAIMER,
          },
        });
      }
    );

    socket.on("timeout", () => {
      socket.destroy();
      finish({ ok: false, reason: "timeout" });
    });

    socket.on("error", (error) => {
      socket.destroy();

      // The host does not exist — evidence about the domain.
      if (error?.code === "ENOTFOUND") {
        finish({ ok: false, reason: "not_found" });
        return;
      }

      // Reachable but nothing listening on 443, or it does not speak TLS:
      // that is a real "no HTTPS" finding, not a failed lookup.
      if (["ECONNREFUSED", "ECONNRESET", "EPROTO", "ERR_SSL_WRONG_VERSION_NUMBER"].includes(error?.code)) {
        finish({
          ok: true,
          data: {
            httpsAvailable: false,
            certValid: false,
            reason: error.code,
            disclaimer: HTTPS_DISCLAIMER,
          },
        });
        return;
      }

      finish({ ok: false, reason: "unavailable" });
    });
  });

export default { checkTls, HTTPS_DISCLAIMER };
