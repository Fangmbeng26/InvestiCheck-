import express from "express";
import { createReport, getComplaintTypes } from "../controllers/ReportController.js";
import validate from "../middleware/validate.js";
import { reportLimiter } from "../middleware/rateLimiters.js";
import { reportSchema } from "../validation/schemas.js";

// FR-15 and FR-16.

const router = express.Router();

router.get("/complaint-types", getComplaintTypes);
router.post("/", reportLimiter, validate({ body: reportSchema }), createReport);

export default router;
