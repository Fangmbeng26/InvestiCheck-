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
   
    const maxRetries = 5;
    const initialDelayMs = 3000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const delay = Math.min(30000, initialDelayMs * Math.pow(2, attempt - 1));
      console.log(`  Retry ${attempt}/${maxRetries} in ${Math.round(delay / 1000)}s...`);
      await new Promise((res) => setTimeout(res, delay));
      try {
        await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
        console.log("  Database connected");
        return;
      } catch (err) {
        console.error(`  Retry ${attempt} failed:`, err.message);
      }
    }

    console.error(`  Could not connect after ${maxRetries} attempts.`);
    process.exit(1);
  }
}

export default ConnectDB;
