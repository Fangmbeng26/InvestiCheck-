import crypto from "node:crypto";
import Analysis from "../models/analysisSchema.js";
import Report from "../models/reportSchema.js";
import Watchlist from "../models/watchlistSchema.js";
import config from "../config/env.js";
import { collectOsint, toStoredShape, fromStoredShape } from "../services/osint/index.js";
import { assess } from "../services/risk/engine.js";
import { explain } from "../services/risk/explain.js";
import { ALL_INDICATORS, BEHAVIOURAL_INDICATORS, RISK_BANDS } from "../services/risk/indicators.js";
import { normalizeUrl, normalizeDomain } from "../services/urlGuard.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";


export const getIndicators = asyncHandler(async (req, res) => {
  res.json({
    questions: BEHAVIOURAL_INDICATORS.map((indicator) => ({
      id: indicator.id,
      label: indicator.label,
      question: indicator.question,
      help: indicator.help,
      requirement: indicator.requirement,
      weight: indicator.weightV2,
      answers: ["yes", "no", "unknown"],
    })),
    technicalIndicators: ALL_INDICATORS.filter((i) => i.category === "technical").map((i) => ({
      id: i.id,
      label: i.label,
      help: i.help,
      requirement: i.requirement,
      weight: i.weightV2,
    })),
    bands: RISK_BANDS,
  });
});


 // Lets the UI show the technical findings  while the user works through the questions.
export const runOsintOnly = asyncHandler(async (req, res) => {
  const { website } = req.body;

  const osint = await collectOsint(website);
  if (!osint.ok) {
    throw new AppError(400, osint.message ?? "That website address cannot be analysed");
  }

  res.json({ osint: osint.data });
});

// The full assessment: OSINT + user answers -> score, level, explanation.
 
export const createAnalysis = asyncHandler(async (req, res) => {
  const { platformName, website, answers, model } = req.body;

  //  validate the URL before anything else touches it.
  const parsed = normalizeUrl(website);
  if (!parsed.ok) {
    throw new AppError(400, parsed.message);
  }

  const modelVersion = model ?? config.DEFAULT_RISK_MODEL;
  const normalizedDomain = parsed.normalizedDomain;

  //an OSINT failure must not block the assessment.
  const osintResult = await collectOsint(parsed.url.toString());
  const osint = osintResult.ok ? osintResult.data : null;

  const [watchlistMatch, corroboratingReports] = await Promise.all([
    Watchlist.findMatch(normalizedDomain, platformName).catch(() => null),
    Report.countDocuments({
      normalizedDomain,
      status: "reviewed",
      complaintType: {
        $in: ["unable_to_withdraw", "withdrawal_delays", "extra_payment_demanded"],
      },
    }).catch(() => 0),
  ]);

  const corroborated =
    corroboratingReports >= config.REPORT_CORROBORATION_THRESHOLD ? corroboratingReports : null;

  const assessment = assess({
    answers,
    osint,
    model: modelVersion,
    context: {
      watchlistMatch: watchlistMatch
        ? { regulator: watchlistMatch.regulator, sourceUrl: watchlistMatch.sourceUrl }
        : null,
      corroboratedWithdrawalReports: corroborated,
    },
  });

  const explanation = explain(assessment, osint);

  const analysis = await Analysis.create({
    platformName,
    website: parsed.url.toString(),
    normalizedDomain,
    osint: osint ? toStoredShape(osint) : undefined,
    answers,
    riskScore: assessment.riskScore,
    riskLevel: assessment.riskLevel,
    coverage: assessment.coverage,
    insufficientData: assessment.insufficientData,
    detectedIndicators: assessment.detectedIndicators,
    overrides: assessment.overrides,
    modelVersion: assessment.modelVersion,
  });

  res.status(201).json({
    id: analysis._id,
    platformName,
    website: analysis.website,
    ...assessment,
    explanation,
    osint: osint ?? null,
    osintUnavailable: !osintResult.ok,
    dateAnalyzed: analysis.dateAnalyzed,
  });
});


export const getAnalysis = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findById(req.params.id).lean();
  if (!analysis) {
    throw new AppError(404, "Analysis not found");
  }


  // Present the stored evidence in the same shape a fresh assessment returns,
  // so a saved or shared result renders identically to the original.
  const osint = fromStoredShape(analysis.osint);

  // The wording is rebuilt rather than stored, so improvements to how results
  // are explained apply to past assessments too.
  const explanation = explain(
    {
      riskLevel: analysis.riskLevel,
      detectedIndicators: analysis.detectedIndicators ?? [],
      unknownIndicators: [],
      overrides: analysis.overrides ?? [],
      coverage: analysis.coverage,
      insufficientData: analysis.insufficientData,
    },
    osint
  );

  res.json({ ...analysis, id: analysis._id, osint, explanation });
});


export const hashIp = (ip) =>
  crypto.createHash("sha256").update(String(ip ?? "") + config.JWT_SECRET).digest("hex").slice(0, 32);

export const _normalizeDomain = normalizeDomain;
