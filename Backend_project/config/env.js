import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const isTest = process.env.NODE_ENV === "test";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  PORT: z.coerce.number().int().positive().default(4000),

  MONGO_URI: isTest
    ? z.string().default("mongodb://127.0.0.1:27017/investicheck-test")
    : z.string().min(1, "MONGO_URI is required"),

  JWT_SECRET: isTest
    ? z.string().default("test-secret-not-used-outside-tests-0123456789")
    : z
        .string()
        .min(32, "JWT_SECRET must be at least 32 characters — generate one, do not invent one"),

  JWT_EXPIRES_IN: z.string().default("1h"),

  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),

  OSINT_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  OSINT_TOTAL_BUDGET_MS: z.coerce.number().int().positive().default(12000),
  OSINT_CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(86400),

  DEFAULT_RISK_MODEL: z.enum(["v1", "v2"]).default("v2"),

  REPORT_CORROBORATION_THRESHOLD: z.coerce.number().int().positive().default(3),

  SAFE_BROWSING_API_KEY: z.string().optional(),
  VIRUSTOTAL_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("\n  Invalid environment configuration:\n");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error("\n  Copy .env.example to .env and fill in the required values.\n");
  process.exit(1);
}

const config = Object.freeze(parsed.data);

export default config;
