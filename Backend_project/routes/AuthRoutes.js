import express from "express";
import { signup, login, me } from "../controllers/AuthController.js";
import validate from "../middleware/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import { signupSchema, loginSchema } from "../validation/schemas.js";


const router = express.Router();

router.post("/signup", authLimiter, validate({ body: signupSchema }), signup);
router.post("/login", authLimiter, validate({ body: loginSchema }), login);
router.get("/me", requireAuth, me);

export default router;
