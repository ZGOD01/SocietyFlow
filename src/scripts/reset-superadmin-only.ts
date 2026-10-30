import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load environment variables from .env.local if present
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...rest] = trimmed.split("=");
      const val = rest.join("=").trim().replace(/^["']|["']$/g, "");
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/societyflow";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "societyflow";

const ADMIN_EMAIL = "admin@societyflow.com";
const ADMIN_PASSWORD = "SocietyFlow@2026";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: String,
    status: { type: String, default: "ACTIVE" },
    isSuperAdmin: { type: Boolean, default: false },
    isPartner: { type: Boolean, default: false },
    onboardingStatus: { type: String, default: "COMPLETED" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export async function resetDatabaseSuperAdminOnly() {
  console.log("==================================================================");
  console.log(" SocietyFlow — Database Reset (Super Admin Only Retained)");
  console.log("==================================================================");
  console.log(`Connecting to: ${MONGODB_URI.replace(/:([^@]+)@/, ":****@")} ...`);

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      dbName: MONGODB_DB_NAME,
    });
    console.log("Connected successfully to MongoDB.");
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Connection failed:", error.message);
    return;
  }

  const db = mongoose.connection.db;
  if (!db) {
    console.error("No MongoDB database connection found.");
    return;
  }

  const collections = await db.collections();
  console.log(`\nFound ${collections.length} database collection(s).`);

  // 1. Clear all non-admin collections
  for (const collection of collections) {
    const name = collection.collectionName;
    if (name === "users") {
      const deleteResult = await User.deleteMany({ email: { $ne: ADMIN_EMAIL } });
      console.log(`[users] Deleted ${deleteResult.deletedCount} non-admin user(s).`);
    } else {
      const deleteResult = await collection.deleteMany({});
      console.log(`[${name}] Wiped ${deleteResult.deletedCount} document(s).`);
    }
  }

  // 2. Ensure Super Admin account exists with correct credentials
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const superAdmin = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        name: "Platform Super Admin",
        email: ADMIN_EMAIL,
        password: passwordHash,
        phone: "9999999999",
        status: "ACTIVE",
        isSuperAdmin: true,
        isPartner: false,
        onboardingStatus: "COMPLETED",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("\n==================================================================");
  console.log(" DATABASE RESET COMPLETE!");
  console.log(" All societies, wings, flats, requests, documents, and other users wiped.");
  console.log(" ONLY Super Admin is retained in the database:");
  console.log(`   Email:    ${superAdmin.email}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Role:     Super Admin (isSuperAdmin = true)`);
  console.log("==================================================================");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

if (process.argv[1]?.includes("reset-superadmin-only")) {
  resetDatabaseSuperAdminOnly().catch((err) => {
    console.error("Reset failed:", err);
    process.exit(1);
  });
}

