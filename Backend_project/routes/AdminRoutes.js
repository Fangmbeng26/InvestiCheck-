import express from "express";
import {
  getStats,
  listReports,
  moderateReport,
  listAnalyses,
  listWatchlist,
  createWatchlistEntry,
  deleteWatchlistEntry,
} from "../controllers/AdminController.js";
import validate from "../middleware/validate.js";
import { requireAuth, requireAdmin } from "../middleware/requireAuth.js";
import {
  paginationSchema,
  moderateReportSchema,
  objectIdSchema,
  watchlistCreateSchema,
} from "../validation/schemas.js";

// FR-17 and FR-18. Both guards are applied to the whole router, so no admin
// route can be added later without inheriting them.

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", getStats);

router.get("/reports", validate({ query: paginationSchema }), listReports);
router.patch(
  "/reports/:id",
  validate({ params: objectIdSchema, body: moderateReportSchema }),
  moderateReport
);

router.get("/analyses", validate({ query: paginationSchema }), listAnalyses);

router.get("/watchlist", listWatchlist);
router.post("/watchlist", validate({ body: watchlistCreateSchema }), createWatchlistEntry);
router.delete("/watchlist/:id", validate({ params: objectIdSchema }), deleteWatchlistEntry);

export default router;
