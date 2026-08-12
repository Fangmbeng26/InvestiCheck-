import {
  ANSWER,
  ALL_INDICATORS,
  INDICATOR_BY_ID,
  classify,
  severityForDomainAge,
  MIN_COVERAGE_FOR_LOW_RISK,
} from "./indicators.js";


export const deriveTechnicalSeverities = (osint) => {
  const severities = {};

  // domainAge — graduated bands
  const domainData = osint?.domain_registration;
  if (domainData?.status === "ok" && domainData.data?.ageDays !== null) {
    severities.domainAge = severityForDomainAge(domainData.data.ageDays)?.severity ?? null;
  } else if (domainData?.status === "not_found") {
  
    severities.domainAge = 1;
  } else {
    severities.domainAge = null;
  }

  // websiteUnreachable
  const availability = osint?.availability;
  if (availability?.status === "ok") {
    const data = availability.data;
    if (data.reachable) severities.websiteUnreachable = 0;
    // A CAPTCHA wall or a provider blocking our server IP looks identical to a
    // dead site from here, so an ambiguous status scores half rather than full.
    else severities.websiteUnreachable = data.inconclusive ? 0.5 : 1;
  } else {
    severities.websiteUnreachable = null;
  }

  // noHttps
  const tls = osint?.tls;
  if (tls?.status === "ok") {
    const data = tls.data;
    if (!data.httpsAvailable) severities.noHttps = 1;
    else if (data.certValid) severities.noHttps = 0;
    else if (data.expired) severities.noHttps = 0.5;
    else severities.noHttps = 0.75; // self-signed or hostname mismatch
  } else {
    severities.noHttps = null;
  }

  // weakDns — two half-signals that add
  const dns = osint?.dns;
  if (dns?.status === "ok") {
    const data = dns.data;
    if (data.resolves === false) {
      severities.weakDns = 1;
    } else {
      let score = 0;
      if (data.hasMx === false) score += 0.5;
      if ((data.nameserverCount ?? 0) < 2) score += 0.5;
      severities.weakDns = Math.min(1, score);
    }
  } else {
    severities.weakDns = null;
  }

  // shortRegistration
  if (domainData?.status === "ok" && domainData.data?.daysUntilExpiry !== null) {
    severities.shortRegistration = domainData.data.daysUntilExpiry <= 365 ? 1 : 0;
  } else {
    severities.shortRegistration = null;
  }

  return severities;
};

/** Maps a three-state answer to a severity, or null when unknown. */
const severityFromAnswer = (answer) => {
  if (answer === ANSWER.YES) return 1;
  if (answer === ANSWER.NO) return 0;
  return null; // unknown, or absent
};

/**
 * Builds the per-indicator evidence table shared by both models.
 * @returns {Array<{indicator, severity: number|null, known: boolean}>}
 */
const buildEvidence = (answers = {}, osint = null) => {
  const technical = osint ? deriveTechnicalSeverities(osint) : {};

  return ALL_INDICATORS.map((indicator) => {
    const severity =
      indicator.category === "behavioural"
        ? severityFromAnswer(answers[indicator.id])
        : (technical[indicator.id] ?? null);

    return { indicator, severity, known: severity !== null };
  });
};

/** v1 — the SRS model verbatim. Only the six FR-12 indicators score. */
const scoreV1 = (evidence) => {
  let score = 0;
  const detected = [];

  for (const { indicator, severity } of evidence) {
    if (!indicator.weightV1) continue;

    // The SRS model is binary: an indicator is present or it is not. A
    // graduated severity is thresholded so v1 stays faithful to the spec.
    const present = (severity ?? 0) >= 0.5;
    if (!present) continue;

    score += indicator.weightV1;
    detected.push({
      id: indicator.id,
      label: indicator.label,
      weight: indicator.weightV1,
      severity: 1,
      points: indicator.weightV1,
      category: indicator.category,
      source: indicator.source,
    });
  }

  return { rawScore: score, detected };
};

/** v2 — normalised over a fixed total of 100, with coverage. */
const scoreV2 = (evidence) => {
  let weighted = 0;
  let knownWeight = 0;
  let totalWeight = 0;
  const detected = [];
  const unknown = [];

  for (const { indicator, severity, known } of evidence) {
    totalWeight += indicator.weightV2;

    if (!known) {
      unknown.push({ id: indicator.id, label: indicator.label, weight: indicator.weightV2 });
      continue;
    }

    knownWeight += indicator.weightV2;

    const points = indicator.weightV2 * severity;
    weighted += points;

    if (points > 0) {
      detected.push({
        id: indicator.id,
        label: indicator.label,
        weight: indicator.weightV2,
        severity,
        points: Math.round(points * 10) / 10,
        category: indicator.category,
        source: indicator.source,
      });
    }
  }

  return {
    rawScore: (weighted / totalWeight) * 100,
    coverage: totalWeight === 0 ? 0 : knownWeight / totalWeight,
    detected,
    unknown,
  };
};

/**
 * Applies the override channels from plan section 9.5. These are deliberately
 * not additive: a published regulator warning is categorically stronger
 * evidence than any weighted indicator and must not be diluted by averaging.
 */
const applyOverrides = (score, evidence, context = {}) => {
  const applied = [];
  let floor = 0;

  if (context.watchlistMatch) {
    floor = Math.max(floor, 85);
    applied.push({
      type: "watchlist",
      reason: `Named in a published warning by ${context.watchlistMatch.regulator}`,
      sourceUrl: context.watchlistMatch.sourceUrl ?? null,
    });
  }

  if (context.threatIntelFlag) {
    floor = Math.max(floor, 80);
    applied.push({
      type: "threat_intelligence",
      reason: `Flagged as malicious by ${context.threatIntelFlag.source}`,
      sourceUrl: context.threatIntelFlag.url ?? null,
    });
  }

  // The FTC task-scam signature: pay a deposit to unlock the next set of
  // tasks. Individually these are 8 and 4 points; together they are decisive.
  const byId = Object.fromEntries(evidence.map((e) => [e.indicator.id, e]));
  if (byId.taskBasedEarning?.severity === 1 && byId.depositBeforeEarning?.severity === 1) {
    floor = Math.max(floor, 61);
    applied.push({
      type: "task_scam_pattern",
      reason:
        "Requires a deposit before earning from repeated tasks — the defining pattern of task-based job scams",
      sourceUrl: null,
    });
  }

  if (context.corroboratedWithdrawalReports) {
    floor = Math.max(floor, 61);
    applied.push({
      type: "corroborated_reports",
      reason: `${context.corroboratedWithdrawalReports} reviewed user reports describe withdrawal problems`,
      sourceUrl: null,
    });
  }

  return { score: Math.max(score, floor), overrides: applied, floorApplied: floor > score };
};

/**
 * Runs an assessment.
 *
 * @param {object} params
 * @param {object} params.answers - indicatorId -> 'yes' | 'no' | 'unknown'
 * @param {object} [params.osint] - collectOsint() output
 * @param {'v1'|'v2'} [params.model]
 * @param {object} [params.context] - override inputs
 */
export const assess = ({ answers = {}, osint = null, model = "v2", context = {} }) => {
  const evidence = buildEvidence(answers, osint);

  const result = model === "v1" ? scoreV1(evidence) : scoreV2(evidence);

  // v1 can exceed 100 (its six weights sum to 120). Cap so FR-13's bands
  // remain applicable, and report the fact rather than hiding it.
  const uncapped = Math.round(result.rawScore);
  const capped = Math.min(100, Math.max(0, uncapped));

  const withOverrides = applyOverrides(capped, evidence, context);
  const finalScore = Math.min(100, withOverrides.score);

  const coverage = model === "v2" ? result.coverage : null;

  let band = classify(finalScore);
  let insufficientData = false;

  // Plan section 9.4: never report reassurance we have not earned.
  if (model === "v2" && coverage < MIN_COVERAGE_FOR_LOW_RISK && band.level === "low") {
    insufficientData = true;
    band = { level: "insufficient_data", label: "Insufficient Data" };
  }

  return {
    modelVersion: model,
    riskScore: finalScore,
    riskLevel: band.level,
    riskLabel: band.label,
    coverage: coverage === null ? null : Math.round(coverage * 100) / 100,
    insufficientData,
    scoreExceededScale: uncapped > 100, // only ever true for v1
    uncappedScore: uncapped,
    detectedIndicators: result.detected.sort((a, b) => b.points - a.points),
    unknownIndicators: result.unknown ?? [],
    overrides: withOverrides.overrides,
  };
};

export default { assess, deriveTechnicalSeverities };
