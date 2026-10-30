import "server-only";
import mongoose from "mongoose";

/**
 * Global cache interface for Mongoose in Next.js Server Runtime.
 * Prevents multiple connections during Fast Refresh in development.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export function formatDBError(err: unknown): string {
  if (!err) return "An unexpected database error occurred.";
  const msg = err instanceof Error ? err.message : String(err);

  if (
    msg.includes("ENOTFOUND") ||
    msg.includes("getaddrinfo") ||
    msg.includes("EAI_AGAIN") ||
    msg.includes("ERR_INTERNET_DISCONNECTED")
  ) {
    return "Database connection failed: The database host could not be reached. If you are using MongoDB Atlas, check your internet connection or switch to local MongoDB.";
  }
  if (
    msg.includes("tlsv1 alert internal error") ||
    msg.includes("SSL alert number 80") ||
    msg.includes("ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR")
  ) {
    return "MongoDB Atlas rejected the connection: Your current IP address is not whitelisted in MongoDB Atlas Network Access. Please whitelist your IP in Atlas or switch MONGODB_URI to local MongoDB in .env.local.";
  }
  if (msg.includes("ECONNREFUSED")) {
    return "Local MongoDB is not running or unreachable on port 27017. Please ensure your MongoDB service is started.";
  }
  if (msg.includes("serverSelectionTimeoutMS") || msg.includes("ETIMEDOUT")) {
    return "Database connection timed out. Please check your network connection and database server status.";
  }
  if (msg.includes("Authentication failed") || msg.includes("auth failed")) {
    return "Database authentication failed: Invalid username or password in your MONGODB_URI.";
  }

  return msg;
}

import fs from "fs";
import path from "path";

/**
 * Get active MongoDB URI with support for hot-reloading .env.local during local development.
 */
function getActiveMongoUri(): string | undefined {
  if (process.env.NODE_ENV !== "production") {
    try {
      const envPath = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.startsWith("MONGODB_URI=")) {
            const rawVal = trimmed.replace("MONGODB_URI=", "").trim();
            const cleanVal = rawVal.replace(/^["']|["']$/g, "");
            if (cleanVal) return cleanVal;
          }
        }
      }
    } catch {
      // Fallback to process.env
    }
  }
  return process.env.MONGODB_URI;
}

/**
 * Connect to MongoDB with connection caching for Next.js server environment.
 */
export async function connectDB(): Promise<typeof mongoose> {
  const uri = getActiveMongoUri() || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "[MongoDB Configuration Error] MONGODB_URI is not defined. Please set MONGODB_URI in .env.local or your production environment."
    );
  }

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return mongoose;
  }

  if (cached.conn && (mongoose.connection.readyState as number) !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      dbName: process.env.MONGODB_DB_NAME || "societyflow",
    };

    cached.promise = (async () => {
      try {
        const instance = await mongoose.connect(uri, opts);
        if (process.env.NODE_ENV !== "production") {
          console.log(
            `[MongoDB] Connected successfully to database: ${instance.connection.name}`
          );
        }
        return instance;
      } catch (err: unknown) {
        const formatted = formatDBError(err);
        console.error("[MongoDB Connection Error]", formatted);

        // In development, if primary URI failed and is not already local, attempt fallback to local MongoDB
        if (
          process.env.NODE_ENV !== "production" &&
          !uri.includes("127.0.0.1") &&
          !uri.includes("localhost")
        ) {
          const localUri =
            process.env.MONGODB_LOCAL_URI ||
            "mongodb://127.0.0.1:27017/societyflow";
          console.warn(
            `[MongoDB Development Fallback] Primary DB failed. Attempting fallback to local instance at ${localUri}...`
          );
          try {
            await mongoose.disconnect().catch(() => {});
            const localInstance = await mongoose.connect(localUri, {
              ...opts,
              serverSelectionTimeoutMS: 2000,
              connectTimeoutMS: 2000,
            });
            console.log(
              `[MongoDB Development Fallback] Connected to local fallback database: ${localInstance.connection.name}`
            );
            return localInstance;
          } catch (localErr) {
            console.error(
              "[MongoDB Development Fallback] Local fallback also failed:",
              (localErr as Error).message
            );
          }
        }

        cached.promise = null;
        throw new Error(formatted);
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Check if the database connection is currently active.
 */
export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export default connectDB;
