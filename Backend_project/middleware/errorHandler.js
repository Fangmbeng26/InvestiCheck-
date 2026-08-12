import config from "../config/env.js";


/** An error we raised deliberately and whose message is safe to show. */
export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.details = details;
    this.expected = true;
  }
}

export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
};

export const errorHandler = (err, req, res, next) => {
  if (err?.expected) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }


  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? "field";
    return res.status(409).json({ error: `That ${field} is already registered` });
  }

  if (err?.name === "ValidationError") {
    const details = Object.values(err.errors ?? {}).map((issue) => ({
      field: issue.path,
      message: issue.message,
    }));
    console.error("[mongoose validation]", details);
    return res.status(400).json({ error: "Validation failed", details });
  }

  console.error("[unhandled]", err);

  res.status(500).json({
    error: "Internal server error",
    // Never in production. Useful locally, where the stack is already visible.
    ...(config.NODE_ENV === "development" ? { message: err?.message } : {}),
  });
};


export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
