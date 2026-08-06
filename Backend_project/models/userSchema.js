import mongoose from "mongoose";

// Plan D-03/D-04. `country` and `role` are kept as added; this adds the rest:
// `username` (SRS 16.3), `password: { select: false }` so the hash cannot leak
// (D-01), and Mongoose `timestamps` in place of the manual `timestamp` field —
// the admin dashboard aggregations need a real `createdAt` to group by.

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // general users need no username; admins have one
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      // Never returned unless a query explicitly asks via .select('+password').
      // This is what stops the signup response from leaking the hash again.
      select: false,
    },
    country: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

/** The only shape of a user that should ever reach a client. */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    username: this.username,
    email: this.email,
    country: this.country,
    role: this.role,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("User", userSchema);
