import { INDICATOR_BY_ID } from "./indicators.js";

// FR-14: "The system shall display the indicators that contributed to the
// final risk score."
//
// SRS section 6 and section 14 constrain the wording. The system must not
// declare a platform fraudulent — it reports that indicators associated with
// high-risk schemes are present. Every string here is phrased accordingly:
// "shows indicators associated with", never "is a scam".

export const LEGAL_DISCLAIMER =
  "This assessment is based on selected risk indicators and publicly available " +
  "information. It does not constitute legal confirmation that the platform is " +
  "fraudulent, and it is not financial advice.";

const LEVEL_SUMMARY = {
  low: "This platform shows few of the warning signs commonly associated with fraudulent investment schemes. That is not a guarantee of legitimacy — verify the operator independently before investing.",
  medium:
    "This platform shows some of the warning signs commonly associated with fraudulent investment schemes. Treat it with caution and verify the operator independently before investing any money.",
  high: "This platform shows multiple warning signs commonly associated with fraudulent investment schemes. Users should conduct further investigation and exercise caution before investing money in the platform.",
  insufficient_data:
    "There was not enough information to assess this platform reliably. The result below is provisional — answering the remaining questions will make it more accurate.",
};

const LEVEL_RECOMMENDATIONS = {
  low: [
    "Verify the company's registration with an official regulator before investing.",
    "Start with an amount you could afford to lose entirely.",
    "Keep records of all communication and transactions with the platform.",
  ],
  medium: [
    "Independently verify the company's registration and physical address.",
    "Be cautious of any pressure to invest quickly or to recruit other people.",
    "Never invest more than you can afford to lose.",
  ],
  high: [
    "Do not invest until the operator can be independently verified with a regulator.",
    "Treat guaranteed or unusually high returns as a serious warning sign.",
    "If you have already invested, stop sending further payments — schemes often demand extra fees before releasing withdrawals.",
    "Report the platform to the Ministry of Finance (MINFI) or COSUMAF if you believe it is operating unlawfully.",
  ],
  insufficient_data: [
    "Answer the remaining questions to improve the accuracy of this assessment.",
    "Treat the platform with caution until more is known about it.",
  ],
};

/** Human-readable sentence for one detected indicator. */
const describeIndicator = (detected) => {
  const definition = INDICATOR_BY_ID.get(detected.id);
  return {
    id: detected.id,
    label: detected.label,
    points: detected.points,
    category: detected.category,
    explanation: definition?.help ?? null,
    source: detected.source ?? definition?.source ?? null,
  };
};

/**
 * Builds the FR-14 explanation for an assessment result.
 *
 * @param {object} assessment - output of engine.assess()
 * @param {object} [osint] - collectOsint() output, for the technical facts
 */
export const explain = (assessment, osint = null) => {
  const { riskLevel, detectedIndicators, unknownIndicators, overrides, coverage } = assessment;

  const indicators = detectedIndicators.map(describeIndicator);

  // A single sentence naming the contributing indicators, in the style of the
  // SRS section 14 example output.
  const named = indicators.map((i) => i.label.toLowerCase());
  const narrative =
    named.length > 0
      ? `The platform shows indicators associated with high-risk online investment schemes, including ${listToProse(named)}.`
      : "No individual risk indicators were detected from the information provided.";

  const notes = [];

  if (assessment.insufficientData) {
    notes.push(
      "Too little was known about this platform to rule out risk, so it has not been reported as low risk."
    );
  }

  if (coverage !== null && coverage < 1 && unknownIndicators?.length) {
    notes.push(
      `${unknownIndicators.length} indicator(s) could not be assessed: ${unknownIndicators
        .map((u) => u.label.toLowerCase())
        .join(", ")}.`
    );
  }

  // NFR 11.4: say so plainly when a source was unavailable, rather than
  // presenting a partial assessment as a complete one.
  const degraded = [];
  if (osint) {
    if (osint.domain_registration?.status !== "ok") degraded.push("domain registration records");
    if (osint.dns?.status !== "ok") degraded.push("DNS records");
    if (osint.tls?.status !== "ok") degraded.push("the HTTPS certificate");
    if (osint.availability?.status !== "ok") degraded.push("website availability");
  }
  if (degraded.length) {
    notes.push(
      `Some checks could not be completed (${degraded.join(", ")}), so this assessment relies more heavily on the answers provided.`
    );
  }

  if (osint?.tls?.data?.httpsAvailable && osint.tls.data.certValid) {
    // FR-07 requires this specific caveat wherever HTTPS is reported as present.
    notes.push(
      "This site uses valid HTTPS, which only means traffic to it is encrypted. It does not verify who runs the site."
    );
  }

  return {
    summary: LEVEL_SUMMARY[riskLevel] ?? LEVEL_SUMMARY.medium,
    narrative,
    indicators,
    recommendations: LEVEL_RECOMMENDATIONS[riskLevel] ?? LEVEL_RECOMMENDATIONS.medium,
    overrides: (overrides ?? []).map((override) => ({
      ...override,
      // Attribution matters: a watchlist hit is a regulator's published
      // statement, not InvestiCheck's accusation.
      attributed: override.type === "watchlist" || override.type === "threat_intelligence",
    })),
    notes,
    disclaimer: LEGAL_DISCLAIMER,
  };
};

/** "a, b and c" */
const listToProse = (items) => {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
};

export default { explain, LEGAL_DISCLAIMER };
