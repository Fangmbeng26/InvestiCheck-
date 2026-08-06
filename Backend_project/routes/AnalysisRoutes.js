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

// FR-02 … FR-14. Deliberately unauthenticated: the SRS describes the general
// user as someone who simply opens the application and requests an assessment,
// and requiring an account would put a barrier in front of exactly the users
// this is meant to protect. It also keeps personal data collection to nil,
// which is the right default under Law No. 2024/017.

const router = express.Router();

router.get("/indicators", getIndicators);
router.post("/osint", analysisLimiter, validate({ body: osintOnlySchema }), runOsintOnly);
router.post("/", analysisLimiter, validate({ body: analysisSchema }), createAnalysis);
router.get("/:id", validate({ params: objectIdSchema }), getAnalysis);

export default router;
