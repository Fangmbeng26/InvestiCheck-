import mongoose from "mongoose";

// SRS section 16.2 (Reports Collection), extended with the moderation fields
// that plan section 8.4 requires.
//
// FR-15 accepts anonymous free-text complaints about named third parties, and
// FR-18 surfaces "frequently reported platforms". Without moderation a
// competitor could bury a legitimate business, so only admin-reviewed reports
// count toward anything public-facing or toward the corroboration override.

/** Derived from the FR-11 examples of withdrawal problems. */
export const COMPLAINT_TYPES = [
  "unable_to_withdraw",
  "withdrawal_delays",
  "account_blocked",
  "extra_payment_demanded",
  "platform_shutdown",
  "misleading_promises",
  "other",
];

const reportSchema = new mongoose.Schema(
  {
    platformName: { type: String, required: true, trim: true, maxlength: 200 },
    website: { type: String, trim: true, maxlength: 2000 },
    normalizedDomain: { type: String, index: true },

    complaintType: {
      type: String,
      required: true,
      enum: COMPLAINT_TYPES,
      index: true,
    },

    description: { type: String, required: true, trim: true, maxlength: 5000 },

    status: {
      type: String,
      enum: ["pending", "reviewed", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    moderatorNote: { type: String, maxlength: 1000 },

    // Hashed, never the raw address: enough to spot flooding from one source
    // without retaining an identifier under Law No. 2024/017.
    submitterIpHash: { type: String, index: true },

    dateSubmitted: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Supports the FR-18 "frequently reported platforms" aggregation and the
// corroboration lookup, both of which filter on reviewed status.
reportSchema.index({ normalizedDomain: 1, status: 1 });

export default mongoose.model("Report", reportSchema);
