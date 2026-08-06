import jwt from "jsonwebtoken";
import config from "../config/env.js";
import { AppError } from "./errorHandler.js";

// Plan FR-17 / D-22: no auth middleware existed at all, so "only authorized
// administrators shall be allowed to access the administration dashboard" was
// unenforceable. These two guards are what make the admin routes real.

/** Rejects the request unless it carries a valid, unexpired bearer token. */
export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization ?? "";

  if (!header.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required"));
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (error) {
    // Distinguish "log in again" from "this token is not valid", since the
    // frontend handles those differently.
    const message =
      error?.name === "TokenExpiredError" ? "Session expired" : "Invalid token";
    next(new AppError(401, message));
  }
};

/**
 * Rejects the request unless the authenticated user is an admin.
 * Always mount after requireAuth.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError(401, "Authentication required"));
  }

  // 403 rather than 401: the caller is authenticated, just not permitted.
  if (req.user.role !== "admin") {
    return next(new AppError(403, "Administrator access required"));
  }

  next();
};
