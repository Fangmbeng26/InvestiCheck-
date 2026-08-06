import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";
import config from "../config/env.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";

// The generic-401 and no-hash-in-response fixes were already applied here.
// This keeps that behaviour and moves the plumbing onto the shared pieces:
// zod handles the required-field checks at the route, config/env.js supplies a
// secret that was validated at boot (D-05), and asyncHandler + errorHandler
// replace the per-function try/catch.

const BCRYPT_ROUNDS = 10;

// A real bcrypt hash of a value nobody can supply. Comparing against this when
// the email is unknown keeps both failure paths roughly the same duration, so
// response timing does not reveal which emails are registered.
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8e1F3zP7iVGZ1p8m4YQ0Bx8gK0h5qO";

const issueToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });

/** POST /api/auth/signup */
export const signup = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, country } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(409, "An account with that email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    country,
  });

  res.status(201).json({
    message: "Account created successfully",
    user: user.toPublicJSON(),
    token: issueToken(user),
  });
});

/**
 * POST /api/auth/login
 * One generic 401 covers both "no such account" and "wrong password" so the
 * endpoint cannot be used to enumerate registered addresses.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // `password` is select:false on the schema, so ask for it explicitly.
  const user = await User.findOne({ email }).select("+password");

  const validPassword = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

  if (!user || !validPassword) {
    throw new AppError(401, "Invalid email or password");
  }

  res.status(200).json({
    message: "Logged in successfully",
    user: user.toPublicJSON(),
    token: issueToken(user),
  });
});

/** GET /api/auth/me — resolves the current bearer token to its account. */
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError(401, "Account no longer exists");
  }
  res.status(200).json({ user: user.toPublicJSON() });
});
