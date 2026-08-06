import config from "../config/env.js";

// Plan D-02: the original controllers did `res.json({ message, error })`, which
// serialises the raw error and can leak stack traces, driver internals and
// connection strings to the client. Errors are logged server-side here and the
// client gets a message that says what went wrong without saying how.

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

// Express identifies error middleware by arity, so `next` must stay in the
// signature even though it is unused.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err?.expected) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Mongoose duplicate key — the only driver error worth translating, because
  // "email already registered" is genuinely useful to the caller.
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? "field";
    return res.status(409).json({ error: `That ${field} is already registered` });
  }

  // Mongoose schema validation. Name the offending paths — a bare "Validation
  // failed" with nothing logged is undebuggable.
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

/**
 * Wraps an async handler so a rejected promise reaches errorHandler.
 * Express 5 forwards rejections automatically, but being explicit keeps the
 * behaviour obvious at each call site.
 */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
