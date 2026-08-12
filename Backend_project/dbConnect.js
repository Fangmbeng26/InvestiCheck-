import mongoose from "mongoose";
import config from "./config/env.js";


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
