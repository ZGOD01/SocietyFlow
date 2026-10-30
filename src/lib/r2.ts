import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per Prompt 5 spec

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  isConfigured: boolean;
}

// In-memory fallback buffer storage for local testing when R2 credentials are not set
const localDevStorage = new Map<string, { buffer: Buffer; mimeType: string }>();

export function getR2Config(): R2Config {
  const accountId =
    process.env.R2_ACCOUNT_ID ||
    process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
    "";
  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID ||
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    "";
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    "";
  const bucketName =
    process.env.R2_BUCKET_NAME ||
    process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    "societyflow-vault-docs";

  const isConfigured = Boolean(
    accountId &&
      accessKeyId &&
      secretAccessKey &&
      !accountId.includes("replace_with") &&
      !accessKeyId.includes("replace_with")
  );

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    isConfigured,
  };
}

export function isR2Configured(): boolean {
  return getR2Config().isConfigured;
}

export function getR2Client(): S3Client | null {
  const config = getR2Config();
  if (!config.isConfigured) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/**
 * Validate file metadata according to Prompt 5 specifications.
 */
export function validateFileMetadata(
  mimeType: string,
  sizeBytes: number,
  originalFilename?: string
): { valid: boolean; error?: string } {
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(sizeBytes / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed 10 MB limit.`,
    };
  }

  const normalizedMime = mimeType.toLowerCase();
  const isAllowedMime = ALLOWED_MIME_TYPES.some((allowed) =>
    normalizedMime.includes(allowed.replace("image/jpg", "image/jpeg")) ||
    normalizedMime === allowed
  );

  if (!isAllowedMime) {
    return {
      valid: false,
      error: `Unsupported file format (${mimeType}). Supported formats are PDF, JPG, and PNG.`,
    };
  }

  if (originalFilename) {
    const ext = originalFilename.split(".").pop()?.toLowerCase();
    const allowedExts = ["pdf", "jpg", "jpeg", "png"];
    if (!ext || !allowedExts.includes(ext)) {
      return {
        valid: false,
        error: `File extension .${ext} is not allowed. Only .pdf, .jpg, and .png files are accepted.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Generates an opaque, secure, non-guessable R2 storage object key.
 */
export function generateR2ObjectKey({
  societyId,
  scope,
  documentId,
  originalFilename,
}: {
  societyId?: string;
  scope: string;
  documentId: string;
  originalFilename: string;
}): string {
  const ext = originalFilename.split(".").pop()?.toLowerCase() || "bin";
  const safeRandom = crypto.randomBytes(8).toString("hex");
  const cleanScope = scope.toLowerCase();
  const socPrefix = societyId ? `soc-${societyId}` : "global";
  return `vault/${socPrefix}/${cleanScope}/${documentId}/${safeRandom}.${ext}`;
}

/**
 * Generate a short-lived presigned upload URL (PUT).
 */
export async function generatePresignedUploadUrl({
  r2ObjectKey,
  mimeType,
  expiresInSeconds = 900, // 15 mins
}: {
  r2ObjectKey: string;
  mimeType: string;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; directUploadNeeded: boolean }> {
  const config = getR2Config();
  const client = getR2Client();

  if (!client || !config.isConfigured) {
    // R2 not configured: instruct client to upload through server-side fallback
    return {
      uploadUrl: `/api/documents/upload-fallback?key=${encodeURIComponent(r2ObjectKey)}`,
      directUploadNeeded: true,
    };
  }

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: r2ObjectKey,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  return { uploadUrl, directUploadNeeded: false };
}

/**
 * Generate a short-lived presigned download/view URL (GET).
 */
export async function generatePresignedDownloadUrl({
  r2ObjectKey,
  displayName,
  expiresInSeconds = 900,
  disposition = "inline",
}: {
  r2ObjectKey: string;
  displayName: string;
  expiresInSeconds?: number;
  disposition?: "inline" | "attachment";
}): Promise<{ downloadUrl: string; isFallback: boolean }> {
  const config = getR2Config();
  const client = getR2Client();

  const fallbackUrl = `/api/documents/download-stream?key=${encodeURIComponent(r2ObjectKey)}&filename=${encodeURIComponent(displayName)}&disp=${disposition}`;

  if (!client || !config.isConfigured) {
    return {
      downloadUrl: fallbackUrl,
      isFallback: true,
    };
  }

  try {
    const safeFilename = displayName.replace(/[^\w.-]/g, "_");
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: r2ObjectKey,
      ResponseContentDisposition: `${disposition}; filename="${safeFilename}"`,
    });

    const downloadUrl = await getSignedUrl(client, command, {
      expiresIn: expiresInSeconds,
    });

    return { downloadUrl, isFallback: false };
  } catch (err) {
    console.warn("[R2 Presign Warning] Could not generate presigned R2 URL, using stream fallback:", err);
    return { downloadUrl: fallbackUrl, isFallback: true };
  }
}

/**
 * Direct server upload (multipart / server-side buffer).
 */
export async function uploadObjectDirect({
  r2ObjectKey,
  buffer,
  mimeType,
}: {
  r2ObjectKey: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<{ success: boolean; storage: "R2_CLOUD" | "DEV_LOCAL" }> {
  const config = getR2Config();
  const client = getR2Client();

  if (!client || !config.isConfigured) {
    // Store in dev memory buffer
    localDevStorage.set(r2ObjectKey, { buffer, mimeType });
    return { success: true, storage: "DEV_LOCAL" };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: r2ObjectKey,
      Body: buffer,
      ContentType: mimeType,
    });

    await client.send(command);
    return { success: true, storage: "R2_CLOUD" };
  } catch (err) {
    console.warn("[R2 Direct Upload Warning] Cloudflare upload failed, fallback to local memory buffer:", err);
    localDevStorage.set(r2ObjectKey, { buffer, mimeType });
    return { success: true, storage: "DEV_LOCAL" };
  }
}

/**
 * Retrieve object buffer (for streaming / fallback downloads).
 */
export async function getObjectDirect(r2ObjectKey: string): Promise<{
  buffer: Buffer | Uint8Array;
  mimeType: string;
} | null> {
  const config = getR2Config();
  const client = getR2Client();

  if (!client || !config.isConfigured) {
    const item = localDevStorage.get(r2ObjectKey);
    if (!item) return null;
    return item;
  }

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: r2ObjectKey,
  });

  const response = await client.send(command);
  if (!response.Body) return null;

  const byteArray = await response.Body.transformToByteArray();
  return {
    buffer: Buffer.from(byteArray),
    mimeType: response.ContentType || "application/octet-stream",
  };
}

/**
 * Delete object from R2.
 */
export async function deleteObjectDirect(r2ObjectKey: string): Promise<boolean> {
  const config = getR2Config();
  const client = getR2Client();

  if (!client || !config.isConfigured) {
    localDevStorage.delete(r2ObjectKey);
    return true;
  }

  const command = new DeleteObjectCommand({
    Bucket: config.bucketName,
    Key: r2ObjectKey,
  });

  await client.send(command);
  return true;
}

/**
 * Check if object exists and verify its size and mimeType.
 */
export async function verifyObjectExists(
  r2ObjectKey: string
): Promise<{ exists: boolean; size?: number; mimeType?: string }> {
  const config = getR2Config();
  const client = getR2Client();

  if (!client || !config.isConfigured) {
    const item = localDevStorage.get(r2ObjectKey);
    if (!item) return { exists: false };
    return { exists: true, size: item.buffer.length, mimeType: item.mimeType };
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucketName,
      Key: r2ObjectKey,
    });
    const res = await client.send(command);
    return {
      exists: true,
      size: res.ContentLength,
      mimeType: res.ContentType,
    };
  } catch {
    return { exists: false };
  }
}
