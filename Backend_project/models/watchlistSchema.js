import mongoose from "mongoose";

// Plan section 7.6 — the Cameroon-specific layer.
//
// COSUMAF (the single CEMAC securities regulator since the 2019 merger with
// Cameroon's CMF) and MINFI both publish named entities that collect funds
// from the public without authorisation. Those lists are the most
// authoritative evidence available to this system.
//
// Curated manually rather than scraped: minfi.gov.cm was unreachable and
// cosumaf.org returns 403 to non-browser clients, so a live scraper would be
// unreliable and silently stale. Every entry therefore carries the source it
// came from, which is also what lets the UI attribute a match to the regulator
// instead of presenting it as InvestiCheck's own accusation.

const watchlistSchema = new mongoose.Schema(
  {
    entityName: { type: String, required: true, trim: true, index: true },

    // Schemes rebrand constantly — Liyeplimal became LimoCoin SWAP, and its
    // parent Global Investment Trading became Simtrex Commercial Brokers.
    aliases: { type: [String], default: [] },

    domains: { type: [String], default: [], index: true },

    regulator: {
      type: String,
      required: true,
      enum: ["COSUMAF", "MINFI", "BEAC", "other"],
    },

    // Mandatory: an entry without a citable source cannot be shown to users.
    sourceUrl: { type: String, required: true, trim: true },
    noticeDate: Date,
    notes: { type: String, maxlength: 2000 },

    active: { type: Boolean, default: true, index: true },

    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

/**
 * Finds an active watchlist entry matching a domain or a platform name.
 * Domain match is exact on the normalised form; name match is a
 * case-insensitive substring, since users rarely type the registered name.
 */
watchlistSchema.statics.findMatch = async function findMatch(normalizedDomain, platformName) {
  const conditions = [];

  if (normalizedDomain) {
    conditions.push({ domains: normalizedDomain });
  }

  if (platformName && platformName.trim().length >= 3) {
    // Escape regex metacharacters — the value comes from user input.
    const escaped = platformName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, "i");
    conditions.push({ entityName: pattern }, { aliases: pattern });
  }

  if (conditions.length === 0) return null;

  return this.findOne({ active: true, $or: conditions });
};

export default mongoose.model("Watchlist", watchlistSchema);
