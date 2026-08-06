import Analysis from "../models/analysisSchema.js";
import Report from "../models/reportSchema.js";
import Watchlist from "../models/watchlistSchema.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";

// FR-18. The SRS names seven metrics the dashboard may display:
//   total analysed platforms, high/medium/low counts, number of submitted
//   reports, frequently reported platforms, most common risk indicators.
// All seven are produced here from real data via aggregation.

/** GET /api/admin/stats */
export const getStats = asyncHandler(async (req, res) => {
  const [byLevel, totalAnalyses, reportCounts, frequentlyReported, commonIndicators, recent] =
    await Promise.all([
      Analysis.aggregate([{ $group: { _id: "$riskLevel", count: { $sum: 1 } } }]),

      Analysis.countDocuments(),

      Report.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

      // "Frequently reported platforms" counts reviewed reports only —
      // pending ones have not been checked and could be malicious.
      Report.aggregate([
        { $match: { status: "reviewed" } },
        {
          $group: {
            _id: { $ifNull: ["$normalizedDomain", "$platformName"] },
            platformName: { $first: "$platformName" },
            reportCount: { $sum: 1 },
            lastReported: { $max: "$dateSubmitted" },
          },
        },
        { $sort: { reportCount: -1 } },
        { $limit: 10 },
      ]),

      // "Most common risk indicators" across all stored analyses.
      Analysis.aggregate([
        { $unwind: "$detectedIndicators" },
        {
          $group: {
            _id: "$detectedIndicators.id",
            label: { $first: "$detectedIndicators.label" },
            category: { $first: "$detectedIndicators.category" },
            occurrences: { $sum: 1 },
          },
        },
        { $sort: { occurrences: -1 } },
        { $limit: 10 },
      ]),

      Analysis.find()
        .sort({ dateAnalyzed: -1 })
        .limit(10)
        .select("platformName website riskScore riskLevel coverage dateAnalyzed")
        .lean(),
    ]);

  const levelCount = (level) => byLevel.find((row) => row._id === level)?.count ?? 0;
  const reportCount = (status) => reportCounts.find((row) => row._id === status)?.count ?? 0;

  res.json({
    analyses: {
      total: totalAnalyses,
      high: levelCount("high"),
      medium: levelCount("medium"),
      low: levelCount("low"),
      insufficientData: levelCount("insufficient_data"),
    },
    reports: {
      total: reportCount("pending") + reportCount("reviewed") + reportCount("rejected"),
      pending: reportCount("pending"),
      reviewed: reportCount("reviewed"),
      rejected: reportCount("rejected"),
    },
    frequentlyReportedPlatforms: frequentlyReported.map((row) => ({
      domain: row._id,
      platformName: row.platformName,
      reportCount: row.reportCount,
      lastReported: row.lastReported,
    })),
    mostCommonIndicators: commonIndicators.map((row) => ({
      id: row._id,
      label: row.label,
      category: row.category,
      occurrences: row.occurrences,
    })),
    recentAnalyses: recent,
    watchlistEntries: await Watchlist.countDocuments({ active: true }),
  });
});

/** GET /api/admin/reports — the moderation queue. */
export const listReports = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.validatedQuery;
  const filter = status ? { status } : {};

  const [items, total] = await Promise.all([
    Report.find(filter)
      .sort({ dateSubmitted: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Report.countDocuments(filter),
  ]);

  res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
});

/** PATCH /api/admin/reports/:id — approve or reject a submission. */
export const moderateReport = asyncHandler(async (req, res) => {
  const { status, moderatorNote } = req.body;

  const report = await Report.findByIdAndUpdate(
    req.params.id,
    {
      status,
      moderatorNote,
      reviewedAt: new Date(),
      reviewedBy: req.user.id,
    },
    { new: true }
  );

  if (!report) throw new AppError(404, "Report not found");

  res.json({ message: `Report marked as ${status}`, report });
});

/** GET /api/admin/analyses */
export const listAnalyses = asyncHandler(async (req, res) => {
  const { page, limit } = req.validatedQuery;

  const [items, total] = await Promise.all([
    Analysis.find()
      .sort({ dateAnalyzed: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("platformName website normalizedDomain riskScore riskLevel coverage modelVersion dateAnalyzed")
      .lean(),
    Analysis.countDocuments(),
  ]);

  res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
});

/** GET /api/admin/watchlist */
export const listWatchlist = asyncHandler(async (req, res) => {
  const items = await Watchlist.find().sort({ entityName: 1 }).lean();
  res.json({ items, total: items.length });
});

/** POST /api/admin/watchlist */
export const createWatchlistEntry = asyncHandler(async (req, res) => {
  const entry = await Watchlist.create({ ...req.body, addedBy: req.user.id });
  res.status(201).json({ message: "Watchlist entry created", entry });
});

/** DELETE /api/admin/watchlist/:id */
export const deleteWatchlistEntry = asyncHandler(async (req, res) => {
  const entry = await Watchlist.findByIdAndDelete(req.params.id);
  if (!entry) throw new AppError(404, "Watchlist entry not found");
  res.json({ message: "Watchlist entry removed" });
});
