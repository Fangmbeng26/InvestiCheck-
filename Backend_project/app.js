import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";

import config from "./config/env.js";
import ConnectDB from "./dbConnect.js";
import openApiSpec from "./docs/openapi.js";

import AuthRoutes from "./routes/AuthRoutes.js";
import AnalysisRoutes from "./routes/AnalysisRoutes.js";
import ReportRoutes from "./routes/ReportRoutes.js";
import AdminRoutes from "./routes/AdminRoutes.js";

import { globalLimiter } from "./middleware/rateLimiters.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

// Tests import the app without a database; index.js connects before listening.
if (config.NODE_ENV !== "test") {
  ConnectDB();
}

// --- Security (NFR 11.3) ---------------------------------------------------

// contentSecurityPolicy is relaxed only for the Swagger UI assets, which are
// served from this origin; the API itself returns JSON and renders nothing.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:"],
      },
    },
  })
);

// Previously `cors()` with no arguments, which allowed every origin.
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));

// Rate limiters key on the client address, so Express has to be told it is
// behind a proxy in deployment or every request appears to come from one IP.
app.set("trust proxy", 1);
app.use(globalLimiter);

// --- API documentation -----------------------------------------------------

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "InvestiCheck API",
    swaggerOptions: {
      docExpansion: "list",
      defaultModelsExpandDepth: 1,
      tryItOutEnabled: true,
      persistAuthorization: true,
    },
  })
);

// The raw document, for client generation or import into Postman.
app.get("/api/docs.json", (req, res) => res.json(openApiSpec));

// --- Health ----------------------------------------------------------------

app.get("/api/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    database: states[mongoose.connection.readyState] ?? "unknown",
    uptimeSeconds: Math.round(process.uptime()),
  });
});

// --- Routes ----------------------------------------------------------------

app.use("/api/auth", AuthRoutes); // FR-17
app.use("/api/analysis", AnalysisRoutes); // FR-02 … FR-14
app.use("/api/reports", ReportRoutes); // FR-15, FR-16
app.use("/api/admin", AdminRoutes); // FR-18

// Point a bare visit at the documentation rather than a 404.
app.get("/", (req, res) => res.redirect("/api/docs"));

// --- Errors ----------------------------------------------------------------

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
