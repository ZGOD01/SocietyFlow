import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import {
  SubscriptionPlan,
  ISubscriptionPlan,
  PlanCode,
  SocietySubscription,
  ISocietySubscription,
  Society,
  Flat,
  DocumentModel as Document,
  SocietyMembership,
  AuditEvent,
} from "@/models";
import { dispatchNotification } from "@/lib/notifications/notification-engine";

export const DEFAULT_PLANS: Array<Partial<ISubscriptionPlan>> = [
  {
    code: "DEMO",
    name: "Free / Demonstration",
    tagline: "Full-feature sandbox for society evaluation and sponsor demonstration",
    priceMonthly: 0,
    priceAnnual: 0,
    maxFlats: 25,
    storageAllowanceGb: 1,
    maxManagementAccounts: 2,
    allowedWorkflowTypes: ["STANDARD_NOC", "MAINTENANCE"],
    notificationChannels: ["IN_APP"],
    reportingFeatures: ["SUMMARY_METRICS"],
    supportLevel: "COMMUNITY",
    isPopular: false,
    isDemonstrationOnly: true,
    isActive: true,
  },
  {
    code: "STARTER",
    name: "Cooperative Starter",
    tagline: "Essential digital governance for single-building societies",
    priceMonthly: 999,
    priceAnnual: 9990,
    maxFlats: 100,
    storageAllowanceGb: 5,
    maxManagementAccounts: 5,
    allowedWorkflowTypes: ["STANDARD_NOC", "MAINTENANCE", "RENOVATION_APPROVAL"],
    notificationChannels: ["IN_APP", "EMAIL"],
    reportingFeatures: ["BASIC_REPORTS", "AUDIT_SUMMARY"],
    supportLevel: "STANDARD_EMAIL",
    isPopular: false,
    isDemonstrationOnly: true,
    isActive: true,
  },
  {
    code: "PROFESSIONAL",
    name: "Gated Community Pro",
    tagline: "Multi-wing governance with multi-signatory SLAs and remote approvals",
    priceMonthly: 2499,
    priceAnnual: 24990,
    maxFlats: 350,
    storageAllowanceGb: 25,
    maxManagementAccounts: 12,
    allowedWorkflowTypes: [
      "STANDARD_NOC",
      "MAINTENANCE",
      "RENOVATION_APPROVAL",
      "TENANCY_NOC",
      "SALE_NOC",
      "EMERGENCY_PASS",
    ],
    notificationChannels: ["IN_APP", "EMAIL", "WHATSAPP"],
    reportingFeatures: ["ADVANCED_ANALYTICS", "SLA_TRACKING", "STATUTORY_REGISTERS"],
    supportLevel: "PRIORITY",
    isPopular: true,
    isDemonstrationOnly: true,
    isActive: true,
  },
  {
    code: "ENTERPRISE",
    name: "Large Township & Apex",
    tagline: "Multi-society cluster administration with custom workflows and dedicated support",
    priceMonthly: 5999,
    priceAnnual: 59990,
    maxFlats: 2000,
    storageAllowanceGb: 100,
    maxManagementAccounts: 50,
    allowedWorkflowTypes: [
      "STANDARD_NOC",
      "MAINTENANCE",
      "RENOVATION_APPROVAL",
      "TENANCY_NOC",
      "SALE_NOC",
      "EMERGENCY_PASS",
      "CUSTOM_WORKFLOWS",
    ],
    notificationChannels: ["IN_APP", "EMAIL", "WHATSAPP"],
    reportingFeatures: ["FULL_COMPLIANCE_SUITE", "EXPORT_API", "AUDIT_LEDGER"],
    supportLevel: "DEDICATED",
    isPopular: false,
    isDemonstrationOnly: true,
    isActive: true,
  },
];

/**
 * Ensure default plans exist in MongoDB
 */
export async function seedSubscriptionPlans() {
  await connectDB();
  for (const plan of DEFAULT_PLANS) {
    await SubscriptionPlan.findOneAndUpdate(
      { code: plan.code },
      { $setOnInsert: plan },
      { upsert: true, new: true }
    );
  }
}

/**
 * Get all available plans
 */
export async function getAllSubscriptionPlans() {
  await connectDB();
  await seedSubscriptionPlans();
  return SubscriptionPlan.find({ isActive: true }).sort({ priceMonthly: 1 }).lean();
}

/**
 * Get active subscription and real usage metrics for a society
 */
export async function getSocietySubscriptionData(societyId: string) {
  await connectDB();
  await seedSubscriptionPlans();

  const socObjectId = new Types.ObjectId(societyId);

  // Fetch or initialize society subscription
  let sub = await SocietySubscription.findOne({ societyId: socObjectId })
    .populate("planId")
    .lean();

  if (!sub) {
    // Default to Professional (Demo)
    const defaultPlan = await SubscriptionPlan.findOne({ code: "PROFESSIONAL" }).lean();
    if (defaultPlan) {
      const created = await SocietySubscription.create({
        societyId: socObjectId,
        planId: defaultPlan._id,
        status: "ACTIVE",
        billingInterval: "ANNUAL",
        startDate: new Date(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isDemo: true,
      });
      sub = await SocietySubscription.findById(created._id).populate("planId").lean();
    }
  }

  // Calculate real usage metrics from MongoDB
  const [flatCount, documents, committeeCount] = await Promise.all([
    Flat.countDocuments({ societyId: socObjectId }),
    Document.find({ societyId: socObjectId }, "size").lean(),
    SocietyMembership.countDocuments({
      societyId: socObjectId,
      role: { $in: ["SECRETARY", "CHAIRMAN", "TREASURER", "SOCIETY_MANAGER"] },
      status: "VERIFIED",
    }),
  ]);

  const totalStorageBytes = documents.reduce((sum, d) => sum + (d.size || 0), 0);
  const totalStorageMb = Math.round((totalStorageBytes / (1024 * 1024)) * 10) / 10;
  const totalStorageGb = Math.round((totalStorageBytes / (1024 * 1024 * 1024)) * 100) / 100;

  const plan = sub?.planId as unknown as ISubscriptionPlan | null;
  const maxFlats = sub?.customFlatLimit || plan?.maxFlats || 100;
  const storageLimitGb = sub?.customStorageLimitGb || plan?.storageAllowanceGb || 5;
  const maxAccounts = plan?.maxManagementAccounts || 5;

  return {
    subscription: sub,
    plan: plan || {
      code: "DEMO",
      name: "Free / Demonstration",
      tagline: "Demonstration Sandbox",
      priceMonthly: 0,
      priceAnnual: 0,
      maxFlats: 50,
      storageAllowanceGb: 2,
      maxManagementAccounts: 3,
      isDemonstrationOnly: true,
    },
    usage: {
      flats: {
        current: flatCount,
        limit: maxFlats,
        percentage: Math.min(100, Math.round((flatCount / maxFlats) * 100)),
      },
      storage: {
        currentBytes: totalStorageBytes,
        currentMb: totalStorageMb,
        currentGb: totalStorageGb,
        limitGb: storageLimitGb,
        percentage: Math.min(100, Math.round((totalStorageGb / storageLimitGb) * 100)),
      },
      managementAccounts: {
        current: committeeCount,
        limit: maxAccounts,
        percentage: Math.min(100, Math.round((committeeCount / maxAccounts) * 100)),
      },
    },
  };
}

/**
 * Assign or update a society's demo subscription plan
 */
export async function assignSocietySubscriptionPlan(
  societyId: string,
  planCode: PlanCode,
  assignedByUser: { id: string; name: string },
  notes?: string
) {
  await connectDB();
  await seedSubscriptionPlans();

  const plan = await SubscriptionPlan.findOne({ code: planCode });
  if (!plan) {
    throw new Error(`Plan '${planCode}' not found.`);
  }

  const socObjectId = new Types.ObjectId(societyId);

  const existingSub = await SocietySubscription.findOne({ societyId: socObjectId });

  const updatedSub = await SocietySubscription.findOneAndUpdate(
    { societyId: socObjectId },
    {
      $set: {
        planId: plan._id,
        status: "ACTIVE",
        assignedBy: new Types.ObjectId(assignedByUser.id),
        assignedByName: assignedByUser.name,
        notes: notes || `Plan set to ${plan.name} by ${assignedByUser.name}`,
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    },
    { upsert: true, new: true }
  ).populate("planId");

  // Audit
  await AuditEvent.create({
    societyId: socObjectId,
    userId: new Types.ObjectId(assignedByUser.id),
    action: "SOCIETY_SUBSCRIPTION_PLAN_ASSIGNED",
    details: {
      planCode,
      planName: plan.name,
      previousSub: existingSub ? existingSub._id.toString() : "NONE",
      notes,
    },
  });

  // Notify Society Committee
  const committee = await SocietyMembership.find({
    societyId: socObjectId,
    role: { $in: ["SECRETARY", "CHAIRMAN", "SOCIETY_MANAGER"] },
    status: "VERIFIED",
  }).lean();

  for (const cm of committee) {
    await dispatchNotification({
      recipients: [cm.userId.toString()],
      societyId,
      eventType: "SOCIETY_PLAN_CHANGED",
      category: "SUBSCRIPTION",
      type: "info",
      title: "Society Subscription Plan Updated",
      message: `Your society plan has been upgraded/updated to ${plan.name} (${planCode}). All tier allowances are active.`,
      actionUrl: "/management/subscription",
    });
  }

  return updatedSub;
}

/**
 * Super Admin: List all societies with subscription status
 */
export async function listAllSocietiesWithSubscriptions() {
  await connectDB();
  await seedSubscriptionPlans();

  const societies = await Society.find().sort({ createdAt: -1 }).lean();

  const results = await Promise.all(
    societies.map(async (soc) => {
      const sub = await SocietySubscription.findOne({ societyId: soc._id })
        .populate("planId")
        .lean();

      const flatCount = await Flat.countDocuments({ societyId: soc._id });

      return {
        id: soc._id.toString(),
        name: soc.name,
        code: soc.code,
        city: soc.city,
        state: soc.state,
        totalFlats: flatCount || soc.totalFlats || 0,
        subscription: sub
          ? {
              id: sub._id.toString(),
              status: sub.status,
              billingInterval: sub.billingInterval,
              startDate: sub.startDate,
              renewalDate: sub.renewalDate,
              isDemo: sub.isDemo,
              plan: sub.planId as unknown as ISubscriptionPlan | null,
            }
          : null,
      };
    })
  );

  return results;
}
