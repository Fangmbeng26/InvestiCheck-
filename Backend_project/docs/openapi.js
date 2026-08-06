import { BEHAVIOURAL_INDICATORS, RISK_BANDS } from "../services/risk/indicators.js";
import { COMPLAINT_TYPES } from "../models/reportSchema.js";

// Hand-authored OpenAPI 3.0 document, served by swagger-ui-express at
// /api/docs. Written as a module rather than annotations so the whole contract
// is readable in one place, and so the indicator list and complaint types are
// generated from the same definitions the engine uses — the docs cannot drift
// from the implementation.

const answerExample = Object.fromEntries(
  BEHAVIOURAL_INDICATORS.map((indicator, index) => [
    indicator.id,
    index % 3 === 2 ? "unknown" : "yes",
  ])
);

const errorResponse = (description) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
});

const openApiSpec = {
  openapi: "3.0.3",

  info: {
    title: "InvestiCheck API",
    version: "1.0.0",
    description: `
REST API for **InvestiCheck** — an OSINT-based framework for assessing the risk of
online investment fraud in Cameroon.

### What this API does

It combines two kinds of evidence about an online investment platform:

1. **Technical evidence (OSINT)** gathered automatically — domain registration data
   via RDAP, DNS records, the TLS certificate, and whether the site is reachable.
2. **Behavioural evidence** supplied by the user — answers about guaranteed returns,
   referral rewards, task-based earning and withdrawal problems.

A rule-based engine turns those into a 0–100 risk score, a Low/Medium/High
classification, and a plain-English explanation of which indicators contributed.

### Two risk models

| Model | Description |
|-------|-------------|
| \`v1\` | The SRS model exactly as specified. Its six weights sum to 120 on a 0–100 scale, so it can overflow; the response reports this via \`scoreExceededScale\`. |
| \`v2\` | Normalised. Weights sum to exactly 100, every collected indicator is scored, and answers are three-state so "unknown" is distinct from "no". |

Pass \`model\` on \`POST /api/analysis\` to choose. \`v2\` is the default.

### Coverage

\`v2\` returns a **coverage** figure (0–1): the proportion of weighted indicators
that were actually known. When coverage falls below 0.6 the API will not report
"Low Risk" — it returns \`insufficient_data\` instead, because a low score derived
from mostly-unknown evidence is not reassurance.

### Important limitation

This API identifies *risk indicators*. It does not determine that a platform is
fraudulent, and it is not financial or legal advice. Every assessment response
carries a \`disclaimer\` field that must be shown to the user.
    `.trim(),
    contact: { name: "InvestiCheck" },
    license: { name: "ISC" },
  },

  servers: [
    { url: "/", description: "This server" },
    { url: "http://localhost:4000", description: "Local development" },
  ],

  tags: [
    { name: "Analysis", description: "Risk assessment of investment platforms (FR-02 … FR-14)" },
    { name: "Reports", description: "User-submitted complaints about suspicious platforms (FR-15, FR-16)" },
    { name: "Auth", description: "Account creation and sign-in (FR-17)" },
    { name: "Admin", description: "Administrator dashboard and moderation (FR-17, FR-18). Requires an admin bearer token." },
    { name: "System", description: "Health and diagnostics" },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Obtain a token from `POST /api/auth/login`, then send it as `Authorization: Bearer <token>`.",
      },
    },

    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Validation failed" },
          details: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "website" },
                message: { type: "string", example: "Website URL is required" },
              },
            },
          },
        },
      },

      Answer: {
        type: "string",
        enum: ["yes", "no", "unknown"],
        description:
          "Three-state on purpose. `unknown` does not lower the risk score — it lowers coverage instead.",
      },

      DetectedIndicator: {
        type: "object",
        properties: {
          id: { type: "string", example: "guaranteedReturns" },
          label: { type: "string", example: "Guaranteed or fixed returns promised" },
          weight: { type: "number", example: 18 },
          severity: { type: "number", example: 1, description: "0–1. Graduated for domain age." },
          points: { type: "number", example: 18 },
          category: { type: "string", enum: ["behavioural", "technical"] },
          source: {
            type: "string",
            example: "SEC red flags 1 and 2 (high returns with little or no risk)",
          },
        },
      },

      Override: {
        type: "object",
        description:
          "Non-additive verdicts that set a score floor. Kept separate from the weighted score so the reason can be shown and attributed.",
        properties: {
          type: {
            type: "string",
            enum: ["watchlist", "threat_intelligence", "task_scam_pattern", "corroborated_reports"],
          },
          reason: {
            type: "string",
            example: "Named in a published warning by COSUMAF",
          },
          sourceUrl: { type: "string", nullable: true, example: "https://www.cosumaf.org/" },
        },
      },

      OsintProbe: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["ok", "not_found", "timeout", "unavailable"],
            description:
              "`not_found` is evidence about the domain. `timeout` and `unavailable` mean our lookup failed and say nothing about the domain — they become `unknown`.",
          },
          data: { type: "object", nullable: true },
        },
      },

      OsintResult: {
        type: "object",
        properties: {
          domain: { type: "string", example: "example.com" },
          website: { type: "string", example: "https://example.com/" },
          availability: { $ref: "#/components/schemas/OsintProbe" },
          domain_registration: {
            allOf: [{ $ref: "#/components/schemas/OsintProbe" }],
            description: "RDAP registration data: creation date, expiry, registrar, domain age.",
          },
          dns: { $ref: "#/components/schemas/OsintProbe" },
          tls: { $ref: "#/components/schemas/OsintProbe" },
          durationMs: { type: "integer", example: 2042 },
          cached: { type: "boolean" },
          collectedAt: { type: "string", format: "date-time" },
        },
      },

      Explanation: {
        type: "object",
        description: "FR-14. Everything needed to tell the user why they got this result.",
        properties: {
          summary: { type: "string" },
          narrative: {
            type: "string",
            example:
              "The platform shows indicators associated with high-risk online investment schemes, including guaranteed or fixed returns promised, withdrawal problems reported and task or click-based earning.",
          },
          indicators: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                points: { type: "number" },
                category: { type: "string" },
                explanation: { type: "string" },
                source: { type: "string" },
              },
            },
          },
          recommendations: { type: "array", items: { type: "string" } },
          overrides: { type: "array", items: { $ref: "#/components/schemas/Override" } },
          notes: {
            type: "array",
            items: { type: "string" },
            description:
              "Caveats: which checks failed, which indicators were unknown, and the HTTPS caveat required by FR-07.",
          },
          disclaimer: { type: "string" },
        },
      },

      AnalysisResult: {
        type: "object",
        properties: {
          id: { type: "string", example: "665f1a2b3c4d5e6f7a8b9c0d" },
          platformName: { type: "string", example: "Example Investment Platform" },
          website: { type: "string", example: "https://example.com/" },
          modelVersion: { type: "string", enum: ["v1", "v2"] },
          riskScore: { type: "integer", minimum: 0, maximum: 100, example: 64 },
          riskLevel: {
            type: "string",
            enum: ["low", "medium", "high", "insufficient_data"],
            example: "high",
          },
          riskLabel: { type: "string", example: "High Risk" },
          coverage: {
            type: "number",
            nullable: true,
            minimum: 0,
            maximum: 1,
            example: 0.8,
            description: "v2 only. Proportion of weighted indicators that were known.",
          },
          insufficientData: {
            type: "boolean",
            description: "True when coverage was too low to responsibly report Low Risk.",
          },
          scoreExceededScale: {
            type: "boolean",
            description: "v1 only. True when the raw score exceeded 100 before capping.",
          },
          uncappedScore: { type: "integer", example: 64 },
          detectedIndicators: {
            type: "array",
            items: { $ref: "#/components/schemas/DetectedIndicator" },
          },
          unknownIndicators: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                weight: { type: "number" },
              },
            },
          },
          overrides: { type: "array", items: { $ref: "#/components/schemas/Override" } },
          explanation: { $ref: "#/components/schemas/Explanation" },
          osint: { allOf: [{ $ref: "#/components/schemas/OsintResult" }], nullable: true },
          osintUnavailable: {
            type: "boolean",
            description:
              "True when no OSINT could be collected. The assessment still runs on the answers alone (NFR 11.4).",
          },
          dateAnalyzed: { type: "string", format: "date-time" },
        },
      },

      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          firstName: { type: "string", example: "Amina" },
          lastName: { type: "string", example: "Ngo" },
          email: { type: "string", format: "email" },
          country: { type: "string", example: "Cameroon" },
          role: { type: "string", enum: ["user", "admin"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      AuthResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
          token: { type: "string", description: "JWT bearer token." },
        },
      },

      Report: {
        type: "object",
        properties: {
          id: { type: "string" },
          platformName: { type: "string" },
          website: { type: "string", nullable: true },
          complaintType: { type: "string", enum: COMPLAINT_TYPES },
          description: { type: "string" },
          status: {
            type: "string",
            enum: ["pending", "reviewed", "rejected"],
            description:
              "Reports start as `pending`. Only `reviewed` reports affect public statistics or the risk engine.",
          },
          dateSubmitted: { type: "string", format: "date-time" },
        },
      },

      AdminStats: {
        type: "object",
        description: "The seven metrics named in FR-18.",
        properties: {
          analyses: {
            type: "object",
            properties: {
              total: { type: "integer", example: 128 },
              high: { type: "integer", example: 54 },
              medium: { type: "integer", example: 41 },
              low: { type: "integer", example: 26 },
              insufficientData: { type: "integer", example: 7 },
            },
          },
          reports: {
            type: "object",
            properties: {
              total: { type: "integer" },
              pending: { type: "integer" },
              reviewed: { type: "integer" },
              rejected: { type: "integer" },
            },
          },
          frequentlyReportedPlatforms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                domain: { type: "string" },
                platformName: { type: "string" },
                reportCount: { type: "integer" },
                lastReported: { type: "string", format: "date-time" },
              },
            },
          },
          mostCommonIndicators: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                category: { type: "string" },
                occurrences: { type: "integer" },
              },
            },
          },
          recentAnalyses: { type: "array", items: { type: "object" } },
          watchlistEntries: { type: "integer" },
        },
      },

      WatchlistEntry: {
        type: "object",
        properties: {
          id: { type: "string" },
          entityName: { type: "string", example: "Global Investment Trading (Liyeplimal)" },
          aliases: {
            type: "array",
            items: { type: "string" },
            example: ["LimoCoin SWAP", "Simtrex Commercial Brokers LLC"],
          },
          domains: { type: "array", items: { type: "string" } },
          regulator: { type: "string", enum: ["COSUMAF", "MINFI", "BEAC", "other"] },
          sourceUrl: {
            type: "string",
            description:
              "Required. A match is a statement that this regulator published a warning, so it must be citable.",
          },
          noticeDate: { type: "string", format: "date", nullable: true },
          notes: { type: "string", nullable: true },
          active: { type: "boolean" },
        },
      },
    },
  },

  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Service health",
        description: "Reports API status and database connectivity. No authentication.",
        responses: {
          200: {
            description: "Service status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    database: { type: "string", example: "connected" },
                    uptimeSeconds: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/analysis/indicators": {
      get: {
        tags: ["Analysis"],
        summary: "List the questions to ask and the indicators that are scored",
        description: `
Returns the behavioural questions the client should present (FR-08 … FR-11), the
technical indicators derived automatically from OSINT (FR-04 … FR-07), and the
FR-13 band boundaries.

**Call this rather than hardcoding questions or weights.** The frontend previously
kept its own copy of both and they drifted from the specification — weights and
thresholds live only in the engine, and this endpoint is how they are published.
        `.trim(),
        responses: {
          200: {
            description: "Indicator definitions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    questions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          label: { type: "string" },
                          question: { type: "string" },
                          help: {
                            type: "string",
                            description: "Plain-language explanation for non-experts (NFR 11.1).",
                          },
                          requirement: { type: "string", example: "FR-08" },
                          weight: { type: "number" },
                          answers: { type: "array", items: { type: "string" } },
                        },
                      },
                    },
                    technicalIndicators: { type: "array", items: { type: "object" } },
                    bands: {
                      type: "array",
                      items: { type: "object" },
                      example: RISK_BANDS,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/analysis/osint": {
      post: {
        tags: ["Analysis"],
        summary: "Run the OSINT checks only (FR-04 … FR-07)",
        description: `
Performs the four technical checks without scoring anything: reachability,
RDAP registration data, DNS records and the TLS certificate.

Intended for the two-step flow — show these findings (about 2 seconds) while the
user works through the questions, then call \`POST /api/analysis\` to score.

All four probes run concurrently and each fails independently; a probe that times
out returns \`status: "timeout"\` rather than failing the request.
        `.trim(),
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["website"],
                properties: {
                  website: {
                    type: "string",
                    example: "example.com",
                    description:
                      "Accepts a bare hostname; `https://` is added when no scheme is given.",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "OSINT findings",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { osint: { $ref: "#/components/schemas/OsintResult" } },
                },
              },
            },
          },
          400: errorResponse(
            "The address was rejected — a non-http(s) scheme, a private or reserved network address, embedded credentials, or a non-web port."
          ),
          429: errorResponse("Rate limit exceeded"),
        },
      },
    },

    "/api/analysis": {
      post: {
        tags: ["Analysis"],
        summary: "Assess a platform (the main endpoint)",
        description: `
Runs the full assessment: collects OSINT, combines it with the supplied answers,
scores it, classifies it (FR-13) and explains it (FR-14). The result is stored.

**Answers are three-state.** Send \`"unknown"\` rather than guessing — an unknown
answer never lowers the score, it lowers \`coverage\`, and the response says which
indicators could not be assessed.

**Reliability:** if the OSINT sources are unreachable the assessment still runs on
the answers alone, with \`osintUnavailable: true\` and a reduced coverage figure
(NFR 11.4).
        `.trim(),
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["platformName", "website"],
                properties: {
                  platformName: { type: "string", example: "Example Investment Platform" },
                  website: { type: "string", example: "https://example.com" },
                  answers: {
                    type: "object",
                    additionalProperties: { $ref: "#/components/schemas/Answer" },
                    description: "Keyed by indicator id — see GET /api/analysis/indicators.",
                  },
                  model: {
                    type: "string",
                    enum: ["v1", "v2"],
                    description: "Defaults to v2.",
                  },
                },
              },
              examples: {
                srsWorkedExample: {
                  summary: "SRS section 14 worked example",
                  description:
                    "The example from the specification. Scores 95 under v1 and 64 (coverage 0.8) under v2 — both High Risk.",
                  value: {
                    platformName: "Example Investment Platform",
                    website: "https://example.com",
                    answers: {
                      guaranteedReturns: "yes",
                      referralRewards: "yes",
                      taskBasedEarning: "yes",
                      depositBeforeEarning: "yes",
                      withdrawalProblems: "yes",
                      unusuallyHighReturns: "unknown",
                      multiLevelReferral: "unknown",
                    },
                    model: "v2",
                  },
                },
                allAnswers: {
                  summary: "Every question answered",
                  value: {
                    platformName: "Test Platform",
                    website: "example.com",
                    answers: answerExample,
                  },
                },
                minimal: {
                  summary: "Minimum input (FR-02)",
                  description:
                    "Only name and URL. Coverage will be low, so the result will be `insufficient_data` rather than Low Risk.",
                  value: { platformName: "Unknown Platform", website: "example.com" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Assessment complete",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AnalysisResult" },
              },
            },
          },
          400: errorResponse("Invalid input, or the URL was rejected (FR-03)"),
          429: errorResponse("Rate limit exceeded"),
        },
      },
    },

    "/api/analysis/{id}": {
      get: {
        tags: ["Analysis"],
        summary: "Retrieve a stored assessment",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "The id returned by POST /api/analysis",
          },
        ],
        responses: {
          200: {
            description: "The stored assessment",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/AnalysisResult" } },
            },
          },
          400: errorResponse("Malformed id"),
          404: errorResponse("Not found"),
        },
      },
    },

    "/api/reports/complaint-types": {
      get: {
        tags: ["Reports"],
        summary: "List complaint categories",
        description: "Populates the report form's category dropdown. Derived from the FR-11 examples.",
        responses: {
          200: {
            description: "Complaint categories",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    complaintTypes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          value: { type: "string" },
                          label: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/reports": {
      post: {
        tags: ["Reports"],
        summary: "Submit a report about a suspicious platform (FR-15)",
        description: `
Anonymous — no account required.

Submissions are stored with \`status: "pending"\` and have **no effect** until an
administrator reviews them. Neither the FR-18 statistics nor the risk engine's
corroboration rule counts a pending report. This is deliberate: the endpoint
accepts anonymous claims about named third parties, so unmoderated reports would
make it trivially abusable.

Rate limited to 5 submissions per hour per address.
        `.trim(),
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["platformName", "complaintType", "description"],
                properties: {
                  platformName: { type: "string", example: "Example Investment Platform" },
                  website: { type: "string", example: "https://example.com" },
                  complaintType: { type: "string", enum: COMPLAINT_TYPES },
                  description: {
                    type: "string",
                    minLength: 10,
                    maxLength: 5000,
                    example:
                      "I deposited money and completed the daily tasks, but when I tried to withdraw I was told to pay a release fee first.",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Report submitted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    report: { $ref: "#/components/schemas/Report" },
                  },
                },
              },
            },
          },
          400: errorResponse("Validation failed"),
          429: errorResponse("Too many reports submitted"),
        },
      },
    },

    "/api/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create an account",
        description:
          "Optional — assessment and reporting both work anonymously. Accounts exist for administrators and for saved history.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["firstName", "lastName", "email", "password"],
                properties: {
                  firstName: { type: "string", example: "Amina" },
                  lastName: { type: "string", example: "Ngo" },
                  email: { type: "string", format: "email", example: "amina@example.com" },
                  password: { type: "string", minLength: 8, example: "correct-horse-battery" },
                  country: { type: "string", example: "Cameroon" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Account created",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } },
            },
          },
          400: errorResponse("Validation failed"),
          409: errorResponse("Email already registered"),
          429: errorResponse("Too many attempts"),
        },
      },
    },

    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Sign in",
        description:
          "Returns a JWT. Both 'no such account' and 'wrong password' return the same generic 401, so the endpoint cannot be used to discover which addresses are registered.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Signed in",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } },
            },
          },
          401: errorResponse("Invalid email or password"),
          429: errorResponse("Too many attempts"),
        },
      },
    },

    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current account",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "The authenticated account",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/User" } },
                },
              },
            },
          },
          401: errorResponse("Authentication required"),
        },
      },
    },

    "/api/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Dashboard statistics (FR-18)",
        description: "All seven metrics named in FR-18, computed from stored data.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Statistics",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/AdminStats" } },
            },
          },
          401: errorResponse("Authentication required"),
          403: errorResponse("Administrator access required"),
        },
      },
    },

    "/api/admin/reports": {
      get: {
        tags: ["Admin"],
        summary: "Moderation queue",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["pending", "reviewed", "rejected"] },
            description: "Filter by moderation status.",
          },
        ],
        responses: {
          200: {
            description: "Paginated reports",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: { type: "array", items: { $ref: "#/components/schemas/Report" } },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer" },
                    pages: { type: "integer" },
                  },
                },
              },
            },
          },
          401: errorResponse("Authentication required"),
          403: errorResponse("Administrator access required"),
        },
      },
    },

    "/api/admin/reports/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Approve or reject a report",
        description:
          "Marking a report `reviewed` is what allows it to count toward FR-18 statistics and toward the risk engine's corroboration override.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["reviewed", "rejected"] },
                  moderatorNote: { type: "string", maxLength: 1000 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Report updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    report: { $ref: "#/components/schemas/Report" },
                  },
                },
              },
            },
          },
          401: errorResponse("Authentication required"),
          403: errorResponse("Administrator access required"),
          404: errorResponse("Report not found"),
        },
      },
    },

    "/api/admin/analyses": {
      get: {
        tags: ["Admin"],
        summary: "List stored assessments",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: { description: "Paginated assessments" },
          401: errorResponse("Authentication required"),
          403: errorResponse("Administrator access required"),
        },
      },
    },

    "/api/admin/watchlist": {
      get: {
        tags: ["Admin"],
        summary: "List regulator watchlist entries",
        description: `
Entities named in published warnings by COSUMAF (the single CEMAC securities
regulator) or MINFI. A match forces a High Risk verdict with a score floor of 85.

Curated manually rather than scraped: minfi.gov.cm is intermittently unreachable
and cosumaf.org blocks non-browser clients, so a live scraper would be unreliable
and silently stale.
        `.trim(),
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Watchlist entries",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/WatchlistEntry" },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
          401: errorResponse("Authentication required"),
          403: errorResponse("Administrator access required"),
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Add a watchlist entry",
        description:
          "`sourceUrl` is required. A match is presented to users as *the regulator's* published warning, so every entry must be citable.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["entityName", "regulator", "sourceUrl"],
                properties: {
                  entityName: { type: "string" },
                  aliases: { type: "array", items: { type: "string" } },
                  domains: { type: "array", items: { type: "string" } },
                  regulator: { type: "string", enum: ["COSUMAF", "MINFI", "BEAC", "other"] },
                  sourceUrl: { type: "string", format: "uri" },
                  noticeDate: { type: "string", format: "date" },
                  notes: { type: "string" },
                },
              },
              example: {
                entityName: "Global Investment Trading (Liyeplimal)",
                aliases: ["LimoCoin SWAP", "Simtrex Commercial Brokers LLC"],
                domains: [],
                regulator: "COSUMAF",
                sourceUrl: "https://www.cosumaf.org/",
                notes: "Named in COSUMAF warnings on unlawful public fundraising.",
              },
            },
          },
        },
        responses: {
          201: { description: "Entry created" },
          400: errorResponse("Validation failed"),
          401: errorResponse("Authentication required"),
          403: errorResponse("Administrator access required"),
        },
      },
    },

    "/api/admin/watchlist/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Remove a watchlist entry",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Entry removed" },
          401: errorResponse("Authentication required"),
          403: errorResponse("Administrator access required"),
          404: errorResponse("Entry not found"),
        },
      },
    },
  },
};

export default openApiSpec;
