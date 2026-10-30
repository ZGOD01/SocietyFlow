import { Types } from "mongoose";
import { ServiceDefinition } from "@/models/ServiceDefinition";
import { DEFAULT_SERVICE_TEMPLATES } from "@/lib/default-services";

/**
 * Ensures a society has its own independent configurable service definitions.
 * If none exist for this society, initializes them from default templates.
 */
export async function ensureSocietyServices(societyId: Types.ObjectId | string): Promise<void> {
  const socId = typeof societyId === "string" ? new Types.ObjectId(societyId) : societyId;

  const count = await ServiceDefinition.countDocuments({ societyId: socId });
  if (count === 0) {
    const toInsert = DEFAULT_SERVICE_TEMPLATES.map((tmpl) => ({
      ...tmpl,
      societyId: socId,
      version: 1,
    }));
    await ServiceDefinition.insertMany(toInsert);
  }
}

/**
 * Returns active services accessible by the resident based on their verified role (OWNER or TENANT).
 */
export async function getResidentServices(
  societyId: Types.ObjectId | string,
  role: "OWNER" | "TENANT"
) {
  const socId = typeof societyId === "string" ? new Types.ObjectId(societyId) : societyId;
  await ensureSocietyServices(socId);

  const filter: Record<string, unknown> = {
    societyId: socId,
    isActive: true,
  };

  if (role === "OWNER") {
    filter.eligibility = { $in: ["OWNER", "BOTH"] };
  } else if (role === "TENANT") {
    filter.eligibility = { $in: ["TENANT", "BOTH"] };
  }

  return ServiceDefinition.find(filter)
    .sort({ category: 1, title: 1 })
    .lean();
}
