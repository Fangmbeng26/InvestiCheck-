import test from "node:test";
import assert from "node:assert/strict";
import { assess } from "../services/risk/engine.js";
import {
  ANSWER,
  ALL_INDICATORS,
  TOTAL_WEIGHT_V2,
  classify,
} from "../services/risk/indicators.js";


const srsExampleOsint = {
  availability: { status: "ok", data: { reachable: true, inconclusive: false } },
  domain_registration: {
    status: "ok",
    
    data: { ageDays: 120, daysUntilExpiry: null },
  },
  dns: { status: "ok", data: { resolves: true, hasMx: true, nameserverCount: 2 } },
  tls: { status: "ok", data: { httpsAvailable: true, certValid: true } },
};

const srsExampleAnswers = {
  guaranteedReturns: ANSWER.YES,
  referralRewards: ANSWER.YES,
  taskBasedEarning: ANSWER.YES,
  depositBeforeEarning: ANSWER.YES,
  withdrawalProblems: ANSWER.YES,
  // SRS section 14 does not state these two.
  unusuallyHighReturns: ANSWER.UNKNOWN,
  multiLevelReferral: ANSWER.UNKNOWN,
};

test("SRS section 14 example reproduces exactly under v1", () => {
  const result = assess({ answers: srsExampleAnswers, osint: srsExampleOsint, model: "v1" });

  // 25 guaranteed + 15 referral + 15 daily tasks + 25 withdrawal + 15 domain = 95
  assert.equal(result.riskScore, 95);
  assert.equal(result.riskLevel, "high");
  assert.equal(result.riskLabel, "High Risk");
});

test("SRS section 14 example scores 64 under v2 and still lands on High Risk", () => {
  const result = assess({ answers: srsExampleAnswers, osint: srsExampleOsint, model: "v2" });

  // 18 + 18 + 10 + 8 + 4 + (0.5 x 12) = 64
  assert.equal(result.riskScore, 64);
  assert.equal(result.riskLevel, "high");
  assert.equal(result.coverage, 0.8); // 80% — only 3 indicators unknown
  assert.equal(result.insufficientData, false);
});

test("v1 can exceed its own 0-100 scale; the overflow is reported not hidden", () => {
  // All six FR-12 indicators present: 25+25+15+15+25+15 = 120.
  const allSix = assess({
    answers: {
      guaranteedReturns: ANSWER.YES,
      unusuallyHighReturns: ANSWER.YES,
      withdrawalProblems: ANSWER.YES,
      referralRewards: ANSWER.YES,
      taskBasedEarning: ANSWER.YES,
    },
    osint: srsExampleOsint,
    model: "v1",
  });

  assert.equal(allSix.uncappedScore, 120);
  assert.equal(allSix.riskScore, 100, "must be capped to keep FR-13 bands applicable");
  assert.equal(allSix.scoreExceededScale, true);
});

test("v2 never exceeds 100 for any combination of answers", () => {
  const everythingYes = Object.fromEntries(ALL_INDICATORS.map((i) => [i.id, ANSWER.YES]));
  const worstOsint = {
    availability: { status: "ok", data: { reachable: false, inconclusive: false } },
    domain_registration: { status: "ok", data: { ageDays: 1, daysUntilExpiry: 30 } },
    dns: { status: "ok", data: { resolves: true, hasMx: false, nameserverCount: 1 } },
    tls: { status: "ok", data: { httpsAvailable: false, certValid: false } },
  };

  const result = assess({ answers: everythingYes, osint: worstOsint, model: "v2" });
  assert.equal(result.riskScore, 100);
  assert.equal(result.coverage, 1);
  assert.equal(TOTAL_WEIGHT_V2, 100);
});

test("a clean platform scores 0 and is Low Risk", () => {
  const allNo = Object.fromEntries(ALL_INDICATORS.map((i) => [i.id, ANSWER.NO]));
  const cleanOsint = {
    availability: { status: "ok", data: { reachable: true, inconclusive: false } },
    domain_registration: { status: "ok", data: { ageDays: 3650, daysUntilExpiry: 900 } },
    dns: { status: "ok", data: { resolves: true, hasMx: true, nameserverCount: 4 } },
    tls: { status: "ok", data: { httpsAvailable: true, certValid: true } },
  };

  const result = assess({ answers: allNo, osint: cleanOsint, model: "v2" });
  assert.equal(result.riskScore, 0);
  assert.equal(result.riskLevel, "low");
  assert.equal(result.coverage, 1);
});

test("unknown answers never reduce the score below what is actually known", () => {
  // The core methodological fix: "I don't know" must not read as "no".
  const known = assess({
    answers: { guaranteedReturns: ANSWER.YES, withdrawalProblems: ANSWER.NO },
    model: "v2",
  });
  const unknown = assess({
    answers: { guaranteedReturns: ANSWER.YES, withdrawalProblems: ANSWER.UNKNOWN },
    model: "v2",
  });

  assert.equal(known.riskScore, unknown.riskScore, "score is unchanged");
  assert.ok(unknown.coverage < known.coverage, "but coverage must drop");
});

test("low coverage cannot be reported as Low Risk", () => {
  // Almost nothing known: the honest answer is "we don't know", not "safe".
  const result = assess({
    answers: { guaranteedReturns: ANSWER.NO },
    model: "v2",
  });

  assert.ok(result.coverage < 0.6);
  assert.equal(result.insufficientData, true);
  assert.equal(result.riskLevel, "insufficient_data");
});

test("watchlist match forces High Risk regardless of the weighted score", () => {
  const result = assess({
    answers: { guaranteedReturns: ANSWER.NO, withdrawalProblems: ANSWER.NO },
    model: "v2",
    context: {
      watchlistMatch: { regulator: "COSUMAF", sourceUrl: "https://www.cosumaf.org/" },
    },
  });

  assert.ok(result.riskScore >= 85);
  assert.equal(result.riskLevel, "high");
  assert.equal(result.overrides[0].type, "watchlist");
  assert.match(result.overrides[0].reason, /COSUMAF/);
});

test("deposit + task-based earning together force High Risk", () => {
  // Individually 4 + 8 = 12 points, which alone would read as Low Risk.
  const result = assess({
    answers: {
      taskBasedEarning: ANSWER.YES,
      depositBeforeEarning: ANSWER.YES,
      guaranteedReturns: ANSWER.NO,
      withdrawalProblems: ANSWER.NO,
      referralRewards: ANSWER.NO,
      unusuallyHighReturns: ANSWER.NO,
      multiLevelReferral: ANSWER.NO,
    },
    osint: srsExampleOsint,
    model: "v2",
  });

  assert.equal(result.riskLevel, "high");
  assert.ok(result.overrides.some((o) => o.type === "task_scam_pattern"));
});

test("FR-13 band boundaries match the SRS exactly", () => {
 
  assert.equal(classify(0).level, "low");
  assert.equal(classify(30).level, "low");
  assert.equal(classify(31).level, "medium");
  assert.equal(classify(60).level, "medium");
  assert.equal(classify(61).level, "high");
  assert.equal(classify(100).level, "high");
});
