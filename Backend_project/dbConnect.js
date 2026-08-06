import mongoose from "mongoose";
import config from "./config/env.js";

// Plan D-09: the previous version logged a connection failure and carried on,
// so the server would start and then hang on every request that touched the
// database. Failing fast makes the problem obvious at boot instead.

async function ConnectDB() {
  try {
    await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log("  Database connected");
  } catch (error) {
    console.error("  Could not connect to MongoDB:", error.message);
    console.error("  Check MONGO_URI in your .env file and that MongoDB is running.");
    process.exit(1);
  }
}

export default ConnectDB;
