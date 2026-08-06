import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import config from "../config/env.js";
import User from "../models/userSchema.js";

// FR-17 needs at least one administrator to exist, and there must be no public
// endpoint that can create one. This script is the only route to an admin
// account — run it once, from the server, with:  npm run seed:admin
//
// Credentials are prompted for rather than passed as arguments, so they do not
// end up in shell history.

const prompt = async () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const email = (await rl.question("Admin email: ")).trim().toLowerCase();
    const username = (await rl.question("Admin username: ")).trim();
    const firstName = (await rl.question("First name: ")).trim();
    const lastName = (await rl.question("Last name: ")).trim();
    const password = (await rl.question("Password (min 12 characters): ")).trim();
    return { email, username, firstName, lastName, password };
  } finally {
    rl.close();
  }
};

const run = async () => {
  const details = await prompt();

  if (!details.email || !details.password) {
    console.error("Email and password are required.");
    process.exit(1);
  }

  if (details.password.length < 12) {
    console.error("Choose a password of at least 12 characters for an admin account.");
    process.exit(1);
  }

  await mongoose.connect(config.MONGO_URI);

  const existing = await User.findOne({ email: details.email });
  if (existing) {
    if (existing.role === "admin") {
      console.log(`${details.email} is already an administrator.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    existing.role = "admin";
    await existing.save();
    console.log(`Promoted the existing account ${details.email} to administrator.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  await User.create({
    firstName: details.firstName || "Admin",
    lastName: details.lastName || "User",
    username: details.username || undefined,
    email: details.email,
    password: await bcrypt.hash(details.password, 12),
    role: "admin",
  });

  console.log(`Administrator created: ${details.email}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (error) => {
  console.error("Seeding failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
