import rateLimit from "express-rate-limit";


const common = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests — please try again later" },
};


export const globalLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 300,
});


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
