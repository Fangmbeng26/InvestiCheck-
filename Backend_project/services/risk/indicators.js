/** Answers are three-state. "unknown" is NOT "no" — see plan section 6.4. */
export const ANSWER = Object.freeze({
  YES: "yes",
  NO: "no",
  UNKNOWN: "unknown",
});

export const CATEGORY = Object.freeze({
  BEHAVIOURAL: "behavioural", // user-provided, self-reported
  TECHNICAL: "technical", // OSINT-derived, objectively measured
});


export const BEHAVIOURAL_INDICATORS = [
  {
    id: "guaranteedReturns",
    label: "Guaranteed or fixed returns promised",
    question: "Does the platform promise guaranteed returns or fixed daily profits?",
    help: "Genuine investments carry risk. A promise that returns are guaranteed, or that profits arrive at a fixed daily rate, is the most common single feature of a Ponzi scheme.",
    requirement: "FR-08",
    category: CATEGORY.BEHAVIOURAL,
    weightV2: 18,
    weightV1: 25, // SRS FR-12: "Guaranteed returns 25"
    source: "SEC red flags 1 and 2 (high returns with little or no risk; overly consistent returns)",
  },
  {
    id: "unusuallyHighReturns",
    label: "Unusually high advertised returns",
    question: "Does the platform advertise unusually high returns (roughly above 20% per year, or any fixed daily percentage)?",
    help: "Returns far above what regulated products offer indicate the money is coming from somewhere other than genuine investment activity.",
    requirement: "FR-08",
    category: CATEGORY.BEHAVIOURAL,
    weightV2: 12,
    weightV1: 25, // SRS FR-12: "Unusually high returns 25"
    source: "SEC red flag 1",
  },
  {
    id: "withdrawalProblems",
    label: "Withdrawal problems reported",
    question: "Have users reported being unable to withdraw, facing delays, having accounts blocked, or being asked to pay more before withdrawing?",
    help: "Difficulty getting money out is often the first visible sign that a scheme is failing.",
    requirement: "FR-11",
    category: CATEGORY.BEHAVIOURAL,
    weightV2: 18,
    weightV1: 25, // SRS FR-12: "Withdrawal complaints 25"
    source: "SEC red flag 7 (difficulty receiving payments)",
  },
  {
    id: "referralRewards",
    label: "Pays users for recruiting others",
    question: "Does the platform pay users for inviting other people, or do earnings increase by recruiting?",
    help: "When returns depend on bringing in new members, the money is coming from those members rather than from investment.",
    requirement: "FR-09",
    category: CATEGORY.BEHAVIOURAL,
    weightV2: 10,
    weightV1: 15, // SRS FR-12: "Referral rewards 15"
    source: "Pyramid structure; COSUMAF warnings on unlawful public fundraising",
  },
  {
    id: "multiLevelReferral",
    label: "Multi-level referral structure",
    question: "Does the platform use multiple referral levels (earning from people your invitees recruit)?",
    help: "Multiple earning levels are characteristic of pyramid structures. On its own this is weak — legitimate affiliate schemes exist — but it compounds the indicator above.",
    requirement: "FR-09",
    category: CATEGORY.BEHAVIOURAL,
    weightV2: 6,
    weightV1: 0, // not priced by the SRS — see plan section 6.2
    source: "Pyramid structure",
  },
  {
    id: "taskBasedEarning",
    label: "Task or click-based earning",
    question: "Does the platform pay for simple repeated tasks — clicking buttons, watching adverts, rating items, feeding virtual animals, or daily log-ins?",
    help: "Paying for trivial repeated tasks is the signature of the fastest-growing category of online job fraud.",
    requirement: "FR-10",
    category: CATEGORY.BEHAVIOURAL,
    weightV2: 8,
    weightV1: 15, // SRS FR-12: "Daily task-based earning 15"
    source: "FTC data on gamified job/task scams (reports rose from 0 in 2020 to ~20,000 in H1 2024)",
  },
  {
    id: "depositBeforeEarning",
    label: "Deposit required before earning",
    question: "Does the platform require users to deposit money before they can earn?",
    help: "Normal for genuine investing, so weak on its own. Combined with task-based earning it is the defining pattern of a task scam.",
    requirement: "FR-08",
    category: CATEGORY.BEHAVIOURAL,
    weightV2: 4,
    weightV1: 0, // collected by FR-08 but not priced by FR-12
    source: "FTC task-scam typology (pay-to-unlock-the-next-set-of-tasks)",
  },
];

/**
 * Technical indicators (FR-04 … FR-07). 24 points under v2.
 * Objective, but weakly diagnostic alone: competent scam platforms have valid
 * HTTPS and clean DNS. Weighting them higher would make it arithmetically
 * impossible for a real scheme to reach the High band.
 */
export const TECHNICAL_INDICATORS = [
  {
    id: "domainAge",
    label: "Recently created domain",
    question: null, // derived from OSINT, never asked
    help: "Fraudulent platforms are usually built on domains registered shortly before the campaign starts. A new domain is not proof of anything on its own.",
    requirement: "FR-05",
    category: CATEGORY.TECHNICAL,
    weightV2: 12,
    weightV1: 15, // SRS FR-12: "Recently created domain 15"
    graduated: true,
    source: "Phishing-detection literature (UCI Phishing Websites dataset, Mohammad & McCluskey 2012)",
  },
  {
    id: "websiteUnreachable",
    label: "Website unreachable",
    question: null,
    help: "A platform whose website cannot be reached may have shut down. Legitimate sites also go down, so this carries little weight alone.",
    requirement: "FR-04",
    category: CATEGORY.TECHNICAL,
    weightV2: 4,
    weightV1: 0, // in SRS scope section 5 but not priced by FR-12
    source: "SRS section 5 (website availability)",
  },
  {
    id: "noHttps",
    label: "No HTTPS, or an invalid certificate",
    question: null,
    help: "A missing or invalid certificate is a bad sign. A valid one proves very little, since free certificates are trivial to obtain.",
    requirement: "FR-07",
    category: CATEGORY.TECHNICAL,
    weightV2: 4,
    weightV1: 0, // in SRS scope but not priced
    source: "SRS section 5 (HTTPS availability); UCI dataset sslfinal_state feature",
  },
  {
    id: "weakDns",
    label: "Weak DNS footprint",
    question: null,
    help: "An established business almost always has email on its own domain and more than one nameserver.",
    requirement: "FR-06",
    category: CATEGORY.TECHNICAL,
    weightV2: 2,
    weightV1: 0, // in SRS scope but not priced
    source: "SRS section 5 (DNS information)",
  },
  {
    id: "shortRegistration",
    label: "Short registration window",
    question: null,
    help: "Legitimate operators usually register domains years in advance. A registration about to lapse suggests no long-term intent.",
    requirement: "FR-05",
    category: CATEGORY.TECHNICAL,
    weightV2: 2,
    weightV1: 0,
    source: "Phishing-detection literature (domain_registration_length feature)",
  },
];

export const ALL_INDICATORS = [...BEHAVIOURAL_INDICATORS, ...TECHNICAL_INDICATORS];

export const INDICATOR_BY_ID = new Map(ALL_INDICATORS.map((i) => [i.id, i]));

/** The indicator ids a client is expected to answer. */
export const QUESTION_IDS = BEHAVIOURAL_INDICATORS.map((i) => i.id);

/**
 * Domain-age bands. Graduated rather than the SRS's single "< 6 months" cliff,
 * so a 5-month and a 7-month domain are not treated as opposites.
 */
export const DOMAIN_AGE_BANDS = [
  { maxDays: 30, severity: 1.0, label: "less than 30 days old" },
  { maxDays: 90, severity: 0.8, label: "30 to 90 days old" },
  { maxDays: 180, severity: 0.5, label: "3 to 6 months old" },
  { maxDays: 365, severity: 0.25, label: "6 to 12 months old" },
  { maxDays: Infinity, severity: 0, label: "more than a year old" },
];

export const severityForDomainAge = (ageDays) => {
  if (ageDays === null || ageDays === undefined) return null;
  return DOMAIN_AGE_BANDS.find((band) => ageDays < band.maxDays) ?? DOMAIN_AGE_BANDS.at(-1);
};

/** FR-13 bands, unchanged from the SRS. */
export const RISK_BANDS = [
  { max: 30, level: "low", label: "Low Risk" },
  { max: 60, level: "medium", label: "Medium Risk" },
  { max: 100, level: "high", label: "High Risk" },
];

export const classify = (score) =>
  RISK_BANDS.find((band) => score <= band.max) ?? RISK_BANDS.at(-1);

/** Below this, the system refuses to report "Low Risk" — plan section 9.4. */
export const MIN_COVERAGE_FOR_LOW_RISK = 0.6;

export const TOTAL_WEIGHT_V2 = ALL_INDICATORS.reduce((sum, i) => sum + i.weightV2, 0);

export default {
  ANSWER,
  CATEGORY,
  ALL_INDICATORS,
  BEHAVIOURAL_INDICATORS,
  TECHNICAL_INDICATORS,
  INDICATOR_BY_ID,
  QUESTION_IDS,
  classify,
  severityForDomainAge,
  TOTAL_WEIGHT_V2,
  MIN_COVERAGE_FOR_LOW_RISK,
};
