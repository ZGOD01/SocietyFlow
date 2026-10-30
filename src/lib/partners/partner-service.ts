import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import {
  ChannelPartner,
  IChannelPartner,
  PartnerReferral,
  IPartnerReferral,
  Society,
  User,
  AuditEvent,
} from "@/models";
import { dispatchNotification } from "@/lib/notifications/notification-engine";

/**
 * Get or create Channel Partner record for an authorized partner user
 */
export async function getOrCreatePartnerProfile(user: {
  id: string;
  name: string;
  email: string;
  phone?: string;
}) {
  await connectDB();

  const userObjectId = new Types.ObjectId(user.id);
  let partner = await ChannelPartner.findOne({ userId: userObjectId });

  if (!partner) {
    // Generate clean unique referral code
    const count = await ChannelPartner.countDocuments();
    const sequenceNum = String(count + 1).padStart(3, "0");
    const referralCode = `SOCIETYFLOW-PARTNER-${sequenceNum}`;

    partner = await ChannelPartner.create({
      userId: userObjectId,
      partnerName: user.name,
      partnerEmail: user.email.toLowerCase(),
      partnerPhone: user.phone,
      referralCode,
      partnerType: "CHARTERED_ACCOUNTANT",
      status: "ACTIVE",
      commissionModel: {
        type: "FIXED",
        rate: 5000,
        description: "Illustrative simulation reward (₹5,000 per onboarded society)",
      },
      stats: {
        totalReferrals: 0,
        activeSocieties: 0,
        pendingVerifications: 0,
        illustrativeEarned: 0,
      },
    });

    // Mark user isPartner: true
    await User.findByIdAndUpdate(userObjectId, { isPartner: true });
  }

  // Update dynamic stats from real PartnerReferral records
  const referrals = await PartnerReferral.find({ partnerId: partner._id }).lean();
  const totalReferrals = referrals.length;
  const activeSocieties = referrals.filter((r) => r.status === "ACTIVATED").length;
  const pendingVerifications = referrals.filter(
    (r) => r.status === "PENDING_VERIFICATION" || r.status === "REGISTRATION_STARTED"
  ).length;
  const illustrativeEarned = activeSocieties * (partner.commissionModel?.rate || 5000);

  partner.stats = {
    totalReferrals,
    activeSocieties,
    pendingVerifications,
    illustrativeEarned,
  };
  await partner.save();

  return partner;
}

/**
 * Get partner referrals with privacy boundary (Section 13)
 * Partners can see society name, city, referral date, and status.
 * They CANNOT view resident documents, approval details, identity records, or private society data.
 */
export async function getPartnerReferrals(partnerId: string) {
  await connectDB();
  const referrals = await PartnerReferral.find({
    partnerId: new Types.ObjectId(partnerId),
  })
    .sort({ createdAt: -1 })
    .lean();

  return referrals.map((r) => ({
    id: r._id.toString(),
    referralCode: r.referralCode,
    societyName: r.societyName,
    societyCity: r.societyCity,
    contactPerson: r.contactPerson,
    contactEmail: r.contactEmail,
    status: r.status,
    demoSubscriptionPlan: r.demoSubscriptionPlan,
    illustrativeCommission: r.illustrativeCommission,
    activatedAt: r.activatedAt,
    createdAt: r.createdAt,
    notes: r.notes,
  }));
}

/**
 * Submit a new referral from partner console
 */
export async function submitPartnerReferral(
  partner: IChannelPartner,
  data: {
    societyName: string;
    societyCity: string;
    contactPerson: string;
    contactEmail: string;
    contactPhone?: string;
    demoSubscriptionPlan?: string;
    notes?: string;
  }
) {
  await connectDB();

  // Prevent duplicate referral attribution for same contact email & code
  const existing = await PartnerReferral.findOne({
    contactEmail: data.contactEmail.toLowerCase().trim(),
    partnerId: partner._id,
  });

  if (existing) {
    throw new Error(
      `A referral for ${data.contactEmail} has already been registered by your partner account.`
    );
  }

  const referral = await PartnerReferral.create({
    partnerId: partner._id,
    partnerUserId: partner.userId,
    referralCode: partner.referralCode,
    societyName: data.societyName.trim(),
    societyCity: data.societyCity.trim(),
    contactPerson: data.contactPerson.trim(),
    contactEmail: data.contactEmail.toLowerCase().trim(),
    contactPhone: data.contactPhone?.trim(),
    demoSubscriptionPlan: data.demoSubscriptionPlan || "PROFESSIONAL",
    illustrativeCommission: partner.commissionModel?.rate || 5000,
    status: "REFERRED",
    notes: data.notes?.trim(),
  });

  // Audit
  await AuditEvent.create({
    userId: partner.userId,
    action: "PARTNER_REFERRAL_CREATED",
    details: {
      referralId: referral._id.toString(),
      societyName: data.societyName,
      referralCode: partner.referralCode,
    },
  });

  // Notify partner
  await dispatchNotification({
    recipients: [partner.userId.toString()],
    eventType: "PARTNER_REFERRAL_CREATED",
    category: "PARTNER",
    type: "info",
    title: "Society Referral Registered",
    message: `Referral registered for ${data.societyName} (${data.societyCity}). Tracking progress with code ${partner.referralCode}.`,
    actionUrl: "/partner/dashboard",
  });

  return referral;
}

/**
 * Attribute a referral code when a society is created/onboarded (Section 12)
 */
export async function attributeReferralCodeToSociety(
  referralCode: string,
  societyId: string,
  societyName: string
) {
  await connectDB();

  const code = referralCode.trim().toUpperCase();
  const partner = await ChannelPartner.findOne({ referralCode: code });
  if (!partner) {
    return null; // Not a partner code or code invalid
  }

  const socObjectId = new Types.ObjectId(societyId);

  // Check if referral record exists; if so, update status to ACTIVATED
  let referral = await PartnerReferral.findOne({
    referralCode: code,
    $or: [{ societyId: socObjectId }, { societyName: new RegExp(`^${societyName}$`, "i") }],
  });

  if (referral) {
    referral.societyId = socObjectId;
    referral.status = "ACTIVATED";
    referral.activatedAt = new Date();
    await referral.save();
  } else {
    // Create attribution record directly
    referral = await PartnerReferral.create({
      partnerId: partner._id,
      partnerUserId: partner.userId,
      referralCode: code,
      societyName,
      societyCity: "Pune",
      contactPerson: "Managing Committee",
      contactEmail: "committee@societyflow.com",
      societyId: socObjectId,
      status: "ACTIVATED",
      activatedAt: new Date(),
      illustrativeCommission: partner.commissionModel?.rate || 5000,
      notes: "Attributed automatically during society onboarding signup.",
    });
  }

  // Update partner stats
  partner.stats.activeSocieties = await PartnerReferral.countDocuments({
    partnerId: partner._id,
    status: "ACTIVATED",
  });
  partner.stats.illustrativeEarned =
    partner.stats.activeSocieties * (partner.commissionModel?.rate || 5000);
  await partner.save();

  // Audit
  await AuditEvent.create({
    societyId: socObjectId,
    userId: partner.userId,
    action: "PARTNER_REFERRAL_ACTIVATED",
    details: {
      referralId: referral._id.toString(),
      societyId,
      partnerId: partner._id.toString(),
      referralCode: code,
    },
  });

  // Notify partner
  await dispatchNotification({
    recipients: [partner.userId.toString()],
    societyId,
    eventType: "PARTNER_REFERRAL_ACTIVATED",
    category: "PARTNER",
    type: "success",
    title: "Referred Society Activated!",
    message: `${societyName} has successfully registered using your referral code ${code}. Illustrative commission credited to dashboard.`,
    actionUrl: "/partner/dashboard",
  });

  return referral;
}

/**
 * Super Admin: List all partners
 */
export async function listAllPartnersForAdmin() {
  await connectDB();
  const partners = await ChannelPartner.find().sort({ createdAt: -1 }).lean();

  return Promise.all(
    partners.map(async (p) => {
      const referralCount = await PartnerReferral.countDocuments({ partnerId: p._id });
      const activatedCount = await PartnerReferral.countDocuments({
        partnerId: p._id,
        status: "ACTIVATED",
      });

      return {
        id: p._id.toString(),
        userId: p.userId.toString(),
        name: p.partnerName,
        email: p.partnerEmail,
        phone: p.partnerPhone,
        organization: p.organizationName || "Independent Practice",
        referralCode: p.referralCode,
        partnerType: p.partnerType,
        status: p.status,
        commissionModel: p.commissionModel,
        stats: {
          totalReferrals: referralCount,
          activeSocieties: activatedCount,
          illustrativeEarned: activatedCount * (p.commissionModel?.rate || 5000),
        },
        createdAt: p.createdAt,
      };
    })
  );
}

/**
 * Super Admin: Update partner status and commission model
 */
export async function updatePartnerStatus(
  partnerId: string,
  updates: {
    status?: "ACTIVE" | "PENDING" | "SUSPENDED";
    commissionType?: "FIXED" | "PERCENTAGE" | "RECURRING";
    commissionRate?: number;
    notes?: string;
  }
) {
  await connectDB();

  const partner = await ChannelPartner.findById(partnerId);
  if (!partner) {
    throw new Error("Channel partner not found.");
  }

  if (updates.status) partner.status = updates.status;
  if (updates.commissionType) partner.commissionModel.type = updates.commissionType;
  if (updates.commissionRate !== undefined) partner.commissionModel.rate = updates.commissionRate;
  if (updates.notes) partner.notes = updates.notes;

  await partner.save();
  return partner;
}
