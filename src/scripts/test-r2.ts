import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import fs from "fs";

// Load .env.local if present
if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  }
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "societyflow-vault-docs";

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error("Missing R2 credentials in .env.local");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function main() {
  console.log("Testing connection to Cloudflare R2 bucket:", bucketName);
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
    })
  );
  console.log("SUCCESS: Cloudflare R2 connection verified from .env.local!");
  console.log("Connected to bucket:", bucketName);
  console.log("Current objects stored:", response.KeyCount ?? 0);
}

main().catch((err) => {
  console.error("Connection failed:", err.message);
  process.exit(1);
});
