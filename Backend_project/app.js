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

// Which browser origins may call this API.
//
// Development accepts any localhost port, because the dev server moves between
// ports and 127.0.0.1 and localhost are distinct origins to a browser — a
// fixed list turns that into a confusing CORS failure several times a day.
// It stays a rule rather than becoming "reflect whatever origin asked":
// combined with credentials, reflecting any origin would let any site on the
// internet make authenticated calls on a signed-in administrator's behalf.
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const buildCorsOrigin = () => {
  if (config.NODE_ENV === "production") return config.CORS_ORIGIN;

  return (origin, callback) => {
    // Same-origin and non-browser callers (curl, the Swagger page) send no
    // Origin header at all; there is nothing to check.
    if (!origin) return callback(null, true);
    callback(null, LOCAL_ORIGIN.test(origin) || config.CORS_ORIGIN.includes(origin));
  };
};

const app = express();

// Tests import the app without a database
if (config.NODE_ENV !== "test") {
  ConnectDB();
}

// Security 

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

app.use(
  cors({
    origin: buildCorsOrigin(),
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));

app.set("trust proxy", 1);
app.use(globalLimiter);

// API documentation 

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

// The raw document, for client generation 
app.get("/api/docs.json", (req, res) => res.json(openApiSpec));

//  Health

app.get("/api/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    database: states[mongoose.connection.readyState] ?? "unknown",
    uptimeSeconds: Math.round(process.uptime()),
  });
});

// Routes 

app.use("/api/auth", AuthRoutes); 
app.use("/api/analysis", AnalysisRoutes); 
app.use("/api/reports", ReportRoutes); 
app.use("/api/admin", AdminRoutes); 

app.get("/", (req, res) => res.redirect("/api/docs"));

// Errors 

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
