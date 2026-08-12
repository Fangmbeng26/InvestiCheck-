import Report, { COMPLAINT_TYPES } from "../models/reportSchema.js";
import { normalizeUrl } from "../services/urlGuard.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { hashIp } from "./AnalysisController.js";


export const getComplaintTypes = asyncHandler(async (req, res) => {
  const labels = {
    unable_to_withdraw: "Unable to withdraw money",
    withdrawal_delays: "Withdrawal delays",
    account_blocked: "Account was blocked",
    extra_payment_demanded: "Asked to pay more before withdrawing",
    platform_shutdown: "Platform suddenly shut down",
    misleading_promises: "Misleading promises about returns",
    other: "Something else",
  };

  res.json({
    complaintTypes: COMPLAINT_TYPES.map((value) => ({ value, label: labels[value] ?? value })),
  });
});

/** POST /api/reports — anonymous submission. */
export const createReport = asyncHandler(async (req, res) => {
  const { platformName, website, complaintType, description } = req.body;

  // The website is optional here; when given, normalise it so reports join to
  // analyses on the same key. An unparseable URL is not worth rejecting the
  // whole report over.
  let normalizedDomain;
  let storedWebsite = website;
  if (website) {
    const parsed = normalizeUrl(website);
    if (parsed.ok) {
      normalizedDomain = parsed.normalizedDomain;
      storedWebsite = parsed.url.toString();
    }
  }

  const report = await Report.create({
    platformName,
    website: storedWebsite,
    normalizedDomain,
    complaintType,
    description,
    status: "pending",
    submitterIpHash: hashIp(req.ip),
  });

  res.status(201).json({
    message:
      "Thank you. Your report has been submitted and will be reviewed by an administrator.",
    report: {
      id: report._id,
      platformName: report.platformName,
      complaintType: report.complaintType,
      status: report.status,
      dateSubmitted: report.dateSubmitted,
    },
  });
});
