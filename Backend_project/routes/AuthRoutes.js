import express from "express";
import { signup, login } from '../controllers/AuthController.js';
import {analyzeRisk} from '../controllers/RiskAnalysisController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/analyze-risk', analyzeRisk);

export default router;
