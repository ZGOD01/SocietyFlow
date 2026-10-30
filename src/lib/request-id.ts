import { ServiceRequest } from "@/models/ServiceRequest";

/**
 * Generates an immutable, sequential, human-friendly request reference
 * Format: SF-YYYY-XXXXXX (e.g., SF-2026-000101)
 */
export async function generateNextRequestId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `SF-${currentYear}-`;

  // Find the highest request ID for the current year
  const latestRequest = await ServiceRequest.findOne({
    requestId: new RegExp(`^${prefix}`),
  })
    .sort({ requestId: -1 })
    .select("requestId")
    .lean();

  let nextSequence = 101; // Start at 000101

  if (latestRequest && latestRequest.requestId) {
    const parts = latestRequest.requestId.split("-");
    if (parts.length === 3) {
      const parsedSeq = parseInt(parts[2], 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSequence).padStart(6, "0");
  return `${prefix}${paddedSeq}`;
}

export function formatRequestId(sequence: number, year: number = new Date().getFullYear()): string {
  const paddedSeq = String(sequence).padStart(6, "0");
  return `SF-${year}-${paddedSeq}`;
}

