import app from "./app.js";
import config from "./config/env.js";

// config/env.js loads dotenv and validates everything at import time, exiting
// non-zero if anything required is missing — so by the time we reach here the
// process is known-good and PORT is already a validated number.

const server = app.listen(config.PORT, () => {
  console.log(`  InvestiCheck API listening on http://localhost:${config.PORT}`);
  console.log(`  API docs: http://localhost:${config.PORT}/api/docs`);
  console.log(`  Environment: ${config.NODE_ENV} | default risk model: ${config.DEFAULT_RISK_MODEL}`);
});

const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down`);
  server.close(() => process.exit(0));
  // Do not hang forever if a connection refuses to close.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
