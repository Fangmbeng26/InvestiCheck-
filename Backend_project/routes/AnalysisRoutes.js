import express from "express";
import {
  createAnalysis,
  getAnalysis,
  getIndicators,
  runOsintOnly,
} from "../controllers/AnalysisController.js";
import validate from "../middleware/validate.js";
import { analysisLimiter } from "../middleware/rateLimiters.js";
import { analysisSchema, osintOnlySchema, objectIdSchema } from "../validation/schemas.js";


const router = express.Router();

router.get("/indicators", getIndicators);
router.post("/osint", analysisLimiter, validate({ body: osintOnlySchema }), runOsintOnly);
router.post("/", analysisLimiter, validate({ body: analysisSchema }), createAnalysis);
router.get("/:id", validate({ params: objectIdSchema }), getAnalysis);

export default router;
