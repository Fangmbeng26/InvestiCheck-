import rateLimit from "express-rate-limit";

// Plan D-08 / section 8.4: login had no throttle (unlimited credential
// stuffing) and report submission had none either, which would let one actor
// bury a legitimate business under fabricated complaints.

const common = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests — please try again later" },
};

/** Broad ceiling for the whole API. Generous; catches runaway clients. */
export const globalLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 300,
});

/** Tight limit on credential endpoints. */
export const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true, // only failed attempts count toward the limit
  message: { error: "Too many authentication attempts — please try again later" },
});

/** Analysis makes outbound network calls, so it is more expensive than most. */
export const analysisLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { error: "Too many analysis requests — please try again later" },
});

/** Abuse control for anonymous complaints about named third parties. */
export const reportLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { error: "Too many reports submitted — please try again later" },
});
