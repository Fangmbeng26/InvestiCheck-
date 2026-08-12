import jwt from "jsonwebtoken";
import config from "../config/env.js";
import { AppError } from "./errorHandler.js";

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
    
    const message =
      error?.name === "TokenExpiredError" ? "Session expired" : "Invalid token";
    next(new AppError(401, message));
  }
};


export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError(401, "Authentication required"));
  }

  
  if (req.user.role !== "admin") {
    return next(new AppError(403, "Administrator access required"));
  }

  next();
};
