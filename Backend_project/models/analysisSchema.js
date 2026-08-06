import mongoose from "mongoose";

// Declared as explicit sub-schemas rather than inline object literals.
// `overrides` has a field genuinely named `type`, and inline Mongoose treats
// `type:` as the type declaration for the whole subdocument — so the array
// silently became [String] and every insert failed with a CastError.
const detectedIndicatorSchema = new mongoose.Schema(
  {
    id: String,
    label: String,
    weight: Number,
    severity: Number,
    points: Number,
    category: String,
    source: String,
  },
  { _id: false }
);

const overrideSchema = new mongoose.Schema(
  {
    type: { type: String },
    reason: { type: String },
    sourceUrl: { type: String },
  },
  { _id: false }
);

// SRS section 16.1 (Analysis Collection), extended with the fields the v2
// model needs: coverage, modelVersion and the override channel.
//
// `normalizedDomain` is indexed because every admin aggregation (FR-18) and
// the report-corroboration rule join on it.

const analysisSchema = new mongoose.Schema(
  {
    platformName: { type: String, required: true, trim: true },
    website: { type: String, required: true, trim: true },
    normalizedDomain: { type: String, required: true, index: true },

    osint: {
      availability: {
        reachable: Boolean,
        statusCode: Number,
        finalUrl: String,
        redirectCount: Number,
        responseTimeMs: Number,
        status: String, // ok | not_found | timeout | unavailable
      },
      domain: {
        registrationDate: Date,
        expiryDate: Date,
        registrar: String,
        ageDays: Number,
        daysUntilExpiry: Number,
        source: String,
        status: String,
      },
      dns: {
        resolves: Boolean,
        a: [String],
        ns: [String],
        mx: [String],
        hasMx: Boolean,
        nameserverCount: Number,
        status: String,
      },
      tls: {
        httpsAvailable: Boolean,
        certValid: Boolean,
        issuer: String,
        validFrom: Date,
        validTo: Date,
        protocol: String,
        status: String,
      },
    },

    // indicatorId -> 'yes' | 'no' | 'unknown'
    answers: { type: Map, of: String, default: {} },

    riskScore: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "insufficient_data"],
      index: true,
    },
    // Proportion of weighted indicators that were actually known (v2 only).
    coverage: { type: Number, min: 0, max: 1, default: null },
    insufficientData: { type: Boolean, default: false },

    detectedIndicators: [detectedIndicatorSchema],

    // Non-additive verdicts (watchlist, threat intel, pattern floors) kept
    // separate from the weighted score so FR-14 can explain why.
    overrides: [overrideSchema],

    modelVersion: { type: String, enum: ["v1", "v2"], required: true, index: true },

    dateAnalyzed: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Supports "most recent analysis for this domain" without a full scan.
analysisSchema.index({ normalizedDomain: 1, dateAnalyzed: -1 });

export default mongoose.model("Analysis", analysisSchema);
