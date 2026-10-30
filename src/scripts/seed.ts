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

if (process.env.NODE_ENV === "production") {
  console.error("FATAL: Seed script cannot be run in production!");
  process.exit(1);
}

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/societyflow";
const DEFAULT_PASSWORD = "SocietyFlow@2026";

// Schemas & Models
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: String,
    status: { type: String, default: "ACTIVE" },
    isSuperAdmin: { type: Boolean, default: false },
    isPartner: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const societySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    registrationNumber: { type: String, required: true },
    state: { type: String, default: "Maharashtra" },
    city: { type: String, required: true },
    pinCode: { type: String, required: true },
    totalFlats: { type: Number, default: 0 },
    totalWings: { type: Number, default: 1 },
    status: { type: String, default: "ACTIVE" },
  },
  { timestamps: true }
);

const wingSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    name: { type: String, required: true },
    totalFlats: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const flatSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    wingId: { type: mongoose.Schema.Types.ObjectId, ref: "Wing", required: true },
    flatNumber: { type: String, required: true },
    floor: { type: Number, required: true },
    carpetAreaSqFt: Number,
    defaultOccupancyType: { type: String, default: "VACANT" },
  },
  { timestamps: true }
);

const societyMembershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    role: { type: String, required: true },
    status: { type: String, default: "PENDING" },
    resolutionNumber: String,
    notes: String,
  },
  { timestamps: true }
);

const flatOccupancySchema = new mongoose.Schema(
  {
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    occupancyType: { type: String, required: true },
    status: { type: String, default: "PENDING" },
    ownershipType: { type: String, default: "SOLE_OWNER" },
    ownerName: String,
    ownerContact: String,
  },
  { timestamps: true }
);

const auditEventSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    details: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const buildingSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    name: { type: String, required: true },
    totalFloors: { type: Number, default: 1 },
    description: String,
  },
  { timestamps: true }
);

const societyInvitationSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    email: { type: String, required: true, lowercase: true },
    role: { type: String, required: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat" },
    token: { type: String, required: true, unique: true },
    inviterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, default: "PENDING" },
    expiresAt: { type: Date, required: true },
    acceptedAt: Date,
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const registrationRequestSchema = new mongoose.Schema(
  {
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    applicantPhone: String,
    role: { type: String, required: true },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    wingId: { type: mongoose.Schema.Types.ObjectId, ref: "Wing" },
    wingName: { type: String, required: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat" },
    flatNumber: { type: String, required: true },
    ownershipType: { type: String, default: "SOLE_OWNER" },
    leaseStartDate: Date,
    leaseEndDate: Date,
    ownerName: String,
    ownerContact: String,
    status: { type: String, default: "PENDING_APPROVAL" },
    ownerApproval: {
      status: { type: String, default: "NOT_REQUIRED" },
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      decidedAt: Date,
      comment: String,
    },
    societyApproval: {
      status: { type: String, default: "PENDING" },
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      decidedAt: Date,
      comment: String,
    },
    onboardingStatus: { type: String, default: "PENDING_REGISTRATION_APPROVAL" },
    timeline: [
      {
        action: String,
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        actorRole: String,
        actorName: String,
        timestamp: { type: Date, default: Date.now },
        statusTransition: String,
        comment: String,
      },
    ],
  },
  { timestamps: true }
);

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "info" },
    eventType: { type: String, default: "GENERAL" },
    actionUrl: String,
    read: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Society = mongoose.models.Society || mongoose.model("Society", societySchema);
const Building = mongoose.models.Building || mongoose.model("Building", buildingSchema);
const Wing = mongoose.models.Wing || mongoose.model("Wing", wingSchema);
const Flat = mongoose.models.Flat || mongoose.model("Flat", flatSchema);
const SocietyMembership =
  mongoose.models.SocietyMembership ||
  mongoose.model("SocietyMembership", societyMembershipSchema);
const FlatOccupancy =
  mongoose.models.FlatOccupancy ||
  mongoose.model("FlatOccupancy", flatOccupancySchema);
const SocietyInvitation =
  mongoose.models.SocietyInvitation ||
  mongoose.model("SocietyInvitation", societyInvitationSchema);
const AuditEvent =
  mongoose.models.AuditEvent || mongoose.model("AuditEvent", auditEventSchema);
const RegistrationRequest =
  mongoose.models.RegistrationRequest ||
  mongoose.model("RegistrationRequest", registrationRequestSchema);
const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export async function runSeed() {
  console.log("==================================================================");
  console.log(" SocietyFlow — Multi-Tenant Statutory Database Seeder (Development)");
  console.log("==================================================================");
  console.log(`Connecting to: ${MONGODB_URI.replace(/:([^@]+)@/, ":****@")} ...`);

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      dbName: process.env.MONGODB_DB_NAME || "societyflow",
    });
    console.log("Connected successfully to MongoDB.");
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Connection failed:", error.message);
    console.log("\n[TIP] Make sure your MongoDB Atlas cluster or local MongoDB daemon is running.");
    console.log("Configure MONGODB_URI in your .env.local file.\n");
    return;
  }

  console.log("Clearing existing development data...");
  await Promise.all([
    User.deleteMany({}),
    Society.deleteMany({}),
    Building.deleteMany({}),
    Wing.deleteMany({}),
    Flat.deleteMany({}),
    SocietyMembership.deleteMany({}),
    FlatOccupancy.deleteMany({}),
    SocietyInvitation.deleteMany({}),
    AuditEvent.deleteMany({}),
    RegistrationRequest.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // 1. Create Fictional Society 1: Greenwood Estates CHS (Pune)
  console.log("Seeding Society 1: Greenwood Estates CHS (GREENWOOD-PUNE)...");
  const society1 = await Society.create({
    name: "Greenwood Estates CHS Ltd.",
    code: "GREENWOOD-PUNE",
    registrationNumber: "PNA/HSG/14902/2019",
    state: "Maharashtra",
    city: "Pune",
    pinCode: "411045",
    totalFlats: 120,
    totalWings: 3,
    status: "ACTIVE",
  });

  const building1 = await Building.create({
    societyId: society1._id,
    name: "Greenwood Residency",
    totalFloors: 14,
    description: "Main residential multi-wing tower complex",
  });

  const wingA = await Wing.create({
    societyId: society1._id,
    name: "Wing A",
    totalFlats: 40,
  });

  const wingB = await Wing.create({
    societyId: society1._id,
    name: "Wing B",
    totalFlats: 40,
  });

  const wingC = await Wing.create({
    societyId: society1._id,
    name: "Wing C",
    totalFlats: 40,
  });

  const flatC402 = await Flat.create({
    societyId: society1._id,
    wingId: wingC._id,
    buildingId: building1._id,
    flatNumber: "402",
    floor: 4,
    carpetAreaSqFt: 1250,
    defaultOccupancyType: "OWNER_OCCUPIED",
  });

  const flatB201 = await Flat.create({
    societyId: society1._id,
    wingId: wingB._id,
    buildingId: building1._id,
    flatNumber: "201",
    floor: 2,
    carpetAreaSqFt: 980,
    defaultOccupancyType: "TENANT_OCCUPIED",
  });

  const flatA101 = await Flat.create({
    societyId: society1._id,
    wingId: wingA._id,
    buildingId: building1._id,
    flatNumber: "101",
    floor: 1,
    carpetAreaSqFt: 1100,
    defaultOccupancyType: "OWNER_OCCUPIED",
  });

  // 2. Create Fictional Society 2: Palmgrove Heights CHS (Mumbai)
  console.log("Seeding Society 2: Palmgrove Heights CHS (PALMGROVE-MUMBAI)...");
  const society2 = await Society.create({
    name: "Palmgrove Heights CHS Ltd.",
    code: "PALMGROVE-MUMBAI",
    registrationNumber: "BOM/HSG/8821/2021",
    state: "Maharashtra",
    city: "Mumbai",
    pinCode: "400050",
    totalFlats: 96,
    totalWings: 2,
    status: "ACTIVE",
  });

  const building2 = await Building.create({
    societyId: society2._id,
    name: "Palmgrove Ocean Heights",
    totalFloors: 24,
    description: "Sea-facing highrise residential tower",
  });

  const tower1 = await Wing.create({
    societyId: society2._id,
    name: "Tower 1",
    totalFlats: 48,
  });

  const flatTower1001 = await Flat.create({
    societyId: society2._id,
    wingId: tower1._id,
    buildingId: building2._id,
    flatNumber: "1001",
    floor: 10,
    carpetAreaSqFt: 1450,
    defaultOccupancyType: "OWNER_OCCUPIED",
  });

  // 3. Create Seed Users
  console.log("Creating role-based users...");

  // Society 1 Committee
  const secretary = await User.create({
    name: "Ramesh Kulkarni",
    email: "secretary@greenwood.in",
    password: passwordHash,
    phone: "9822011111",
    status: "ACTIVE",
  });
  await SocietyMembership.create({
    userId: secretary._id,
    societyId: society1._id,
    role: "SECRETARY",
    status: "VERIFIED",
    resolutionNumber: "AGM-2023-RES-01",
    notes: "Elected Honorary Secretary",
  });

  const chairman = await User.create({
    name: "Sunil Deshmukh",
    email: "chairman@greenwood.in",
    password: passwordHash,
    phone: "9822022222",
    status: "ACTIVE",
  });
  await SocietyMembership.create({
    userId: chairman._id,
    societyId: society1._id,
    role: "CHAIRMAN",
    status: "VERIFIED",
    resolutionNumber: "AGM-2023-RES-02",
  });

  const treasurer = await User.create({
    name: "Anand Patwardhan",
    email: "treasurer@greenwood.in",
    password: passwordHash,
    phone: "9822033333",
    status: "ACTIVE",
  });
  await SocietyMembership.create({
    userId: treasurer._id,
    societyId: society1._id,
    role: "TREASURER",
    status: "VERIFIED",
    resolutionNumber: "AGM-2023-RES-03",
  });

  const manager = await User.create({
    name: "Vikas Shinde",
    email: "manager@greenwood.in",
    password: passwordHash,
    phone: "9822044444",
    status: "ACTIVE",
  });
  await SocietyMembership.create({
    userId: manager._id,
    societyId: society1._id,
    role: "SOCIETY_MANAGER",
    status: "VERIFIED",
  });

  // Society 1 Residents
  const owner = await User.create({
    name: "Meera Sharma",
    email: "owner@greenwood.in",
    password: passwordHash,
    phone: "9822055555",
    status: "ACTIVE",
  });
  await SocietyMembership.create({
    userId: owner._id,
    societyId: society1._id,
    role: "OWNER",
    status: "VERIFIED",
  });
  await FlatOccupancy.create({
    flatId: flatC402._id,
    userId: owner._id,
    societyId: society1._id,
    occupancyType: "OWNER",
    status: "APPROVED",
    ownershipType: "SOLE_OWNER",
  });

  const owner2 = await User.create({
    name: "Rajesh S. Joshi",
    email: "owner2@greenwood.in",
    password: passwordHash,
    phone: "9822066666",
    status: "ACTIVE",
  });
  await SocietyMembership.create({
    userId: owner2._id,
    societyId: society1._id,
    role: "OWNER",
    status: "VERIFIED",
  });
  await FlatOccupancy.create({
    flatId: flatB201._id,
    userId: owner2._id,
    societyId: society1._id,
    occupancyType: "OWNER",
    status: "APPROVED",
  });

  const tenant = await User.create({
    name: "Amit Verma",
    email: "tenant@greenwood.in",
    password: passwordHash,
    phone: "9822077777",
    status: "ACTIVE",
  });
  await SocietyMembership.create({
    userId: tenant._id,
    societyId: society1._id,
    role: "TENANT",
    status: "VERIFIED",
  });
  await FlatOccupancy.create({
    flatId: flatB201._id,
    userId: tenant._id,
    societyId: society1._id,
    occupancyType: "TENANT",
    status: "APPROVED",
    ownerName: "Rajesh S. Joshi",
    ownerContact: "owner2@greenwood.in",
  });

  // Pending Owner Resident
  const pendingUser = await User.create({
    name: "Kavita Patil",
    email: "pending.owner@greenwood.in",
    password: passwordHash,
    phone: "9822088888",
    status: "ACTIVE",
    onboardingStatus: "PENDING_REGISTRATION_APPROVAL",
  });
  await SocietyMembership.create({
    userId: pendingUser._id,
    societyId: society1._id,
    role: "OWNER",
    status: "PENDING",
    notes: "Title deed submitted, pending committee review.",
  });
  await FlatOccupancy.create({
    flatId: flatA101._id,
    userId: pendingUser._id,
    societyId: society1._id,
    occupancyType: "OWNER",
    status: "PENDING",
  });
  await RegistrationRequest.create({
    applicantId: pendingUser._id,
    applicantName: pendingUser.name,
    applicantEmail: pendingUser.email,
    applicantPhone: pendingUser.phone,
    role: "OWNER",
    societyId: society1._id,
    wingId: wingA._id,
    wingName: "Wing A",
    flatId: flatA101._id,
    flatNumber: "101",
    ownershipType: "SOLE_OWNER",
    status: "PENDING_APPROVAL",
    ownerApproval: { status: "NOT_REQUIRED" },
    societyApproval: { status: "PENDING" },
    onboardingStatus: "PENDING_REGISTRATION_APPROVAL",
    timeline: [
      {
        action: "REGISTRATION_CREATED",
        actorId: pendingUser._id,
        actorRole: "OWNER",
        actorName: pendingUser.name,
        timestamp: new Date(Date.now() - 3600000 * 4),
        statusTransition: "PENDING_APPROVAL",
        comment: "Owner registration submitted. Awaiting society management review.",
      },
    ],
  });

  // Pending Tenant Resident (for Owner2's Flat B201)
  const pendingTenant = await User.create({
    name: "Rohan Deshmukh",
    email: "pending.tenant@greenwood.in",
    password: passwordHash,
    phone: "9822088889",
    status: "ACTIVE",
    onboardingStatus: "PENDING_REGISTRATION_APPROVAL",
  });
  await SocietyMembership.create({
    userId: pendingTenant._id,
    societyId: society1._id,
    role: "TENANT",
    status: "PENDING",
    notes: "Leave & license agreement submitted. Awaiting dual approvals.",
  });
  await FlatOccupancy.create({
    flatId: flatB201._id,
    userId: pendingTenant._id,
    societyId: society1._id,
    occupancyType: "TENANT",
    status: "PENDING",
    ownerName: "Rajesh S. Joshi",
    ownerContact: "owner2@greenwood.in",
  });
  await RegistrationRequest.create({
    applicantId: pendingTenant._id,
    applicantName: pendingTenant.name,
    applicantEmail: pendingTenant.email,
    applicantPhone: pendingTenant.phone,
    role: "TENANT",
    societyId: society1._id,
    wingId: wingB._id,
    wingName: "Wing B",
    flatId: flatB201._id,
    flatNumber: "201",
    ownerName: "Rajesh S. Joshi",
    ownerContact: "owner2@greenwood.in",
    status: "PENDING_APPROVAL",
    ownerApproval: { status: "PENDING" },
    societyApproval: { status: "PENDING" },
    onboardingStatus: "PENDING_REGISTRATION_APPROVAL",
    timeline: [
      {
        action: "REGISTRATION_CREATED",
        actorId: pendingTenant._id,
        actorRole: "TENANT",
        actorName: pendingTenant.name,
        timestamp: new Date(Date.now() - 3600000 * 2),
        statusTransition: "PENDING_APPROVAL",
        comment: "Tenant registration submitted. Awaiting independent approvals from Property Owner and Society Management.",
      },
    ],
  });

  // Notifications for Secretary and Owner2
  await Notification.create({
    userId: secretary._id,
    societyId: society1._id,
    title: "New Owner Registration Request",
    message: "Kavita Patil registered for Wing A - Flat #101. Society approval required.",
    type: "action_required",
    eventType: "REGISTRATION_SUBMITTED",
    actionUrl: "/management/dashboard",
  });

  await Notification.create({
    userId: secretary._id,
    societyId: society1._id,
    title: "New Tenant Registration Request",
    message: "Rohan Deshmukh registered as tenant for Wing B - Flat #201. Society approval required.",
    type: "action_required",
    eventType: "REGISTRATION_SUBMITTED",
    actionUrl: "/management/dashboard",
  });

  await Notification.create({
    userId: owner2._id,
    societyId: society1._id,
    title: "Tenant Authorization Required",
    message: "Rohan Deshmukh has submitted a tenant registration for your Flat Wing B - #201. Please authorize or reject.",
    type: "action_required",
    eventType: "TENANT_APPROVAL_REQUESTED",
    actionUrl: "/dashboard",
  });

  // Society 2 User
  const palmgroveOwner = await User.create({
    name: "Deepak Shah",
    email: "owner@palmgrove.in",
    password: passwordHash,
    phone: "9822099999",
    status: "ACTIVE",
  });
  await SocietyMembership.create({
    userId: palmgroveOwner._id,
    societyId: society2._id,
    role: "OWNER",
    status: "VERIFIED",
  });
  await FlatOccupancy.create({
    flatId: flatTower1001._id,
    userId: palmgroveOwner._id,
    societyId: society2._id,
    occupancyType: "OWNER",
    status: "APPROVED",
  });

  // Super Admin
  const admin = await User.create({
    name: "Platform Super Admin",
    email: "admin@societyflow.com",
    password: passwordHash,
    phone: "9999999999",
    status: "ACTIVE",
    isSuperAdmin: true,
  });
  await SocietyMembership.create({
    userId: admin._id,
    societyId: society1._id,
    role: "SUPER_ADMIN",
    status: "VERIFIED",
  });

  // Partner / Legal Auditor
  const auditor = await User.create({
    name: "Adv. Sanjay Rao (Chartered Auditor)",
    email: "auditor@legaldesk.in",
    password: passwordHash,
    phone: "9888888888",
    status: "ACTIVE",
    isPartner: true,
  });
  await SocietyMembership.create({
    userId: auditor._id,
    societyId: society1._id,
    role: "PARTNER",
    status: "VERIFIED",
  });

  // Multi-society Resident
  const multiUser = await User.create({
    name: "Vikram Sethi",
    email: "multi.user@societyflow.com",
    password: passwordHash,
    phone: "9777777777",
    status: "ACTIVE",
  });
  await SocietyMembership.create({
    userId: multiUser._id,
    societyId: society1._id,
    role: "OWNER",
    status: "VERIFIED",
  });
  await SocietyMembership.create({
    userId: multiUser._id,
    societyId: society2._id,
    role: "OWNER",
    status: "VERIFIED",
  });

  // 4. Create Controlled Society Invitations
  await SocietyInvitation.create({
    societyId: society1._id,
    email: "incoming.manager@greenwood.in",
    role: "SOCIETY_MANAGER",
    token: "INV-GW-MGR-2026-X892",
    inviterId: secretary._id,
    status: "PENDING",
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });

  await SocietyInvitation.create({
    societyId: society1._id,
    email: "invited.tenant@greenwood.in",
    role: "TENANT",
    flatId: flatB201._id,
    token: "INV-GW-TNT-2026-T401",
    inviterId: owner2._id,
    status: "PENDING",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Record audit events
  await AuditEvent.create({
    societyId: society1._id,
    userId: admin._id,
    action: "SYSTEM_DEVELOPMENT_SEED_COMPLETED",
    details: {
      societiesSeeded: 2,
      usersSeeded: 11,
      timestamp: new Date(),
    },
  });

  console.log("\n==================================================================");
  console.log(" SEED COMPLETED SUCCESSFULLY!");
  console.log(" Default Password for all seed users: " + DEFAULT_PASSWORD);
  console.log("==================================================================");
  console.table([
    { Email: "owner@greenwood.in", Role: "Flat Owner", Society: "GREENWOOD-PUNE", Status: "VERIFIED", Destination: "/dashboard" },
    { Email: "tenant@greenwood.in", Role: "Tenant", Society: "GREENWOOD-PUNE", Status: "VERIFIED", Destination: "/dashboard?view=tenant" },
    { Email: "secretary@greenwood.in", Role: "Secretary", Society: "GREENWOOD-PUNE", Status: "VERIFIED", Destination: "/management/dashboard" },
    { Email: "chairman@greenwood.in", Role: "Chairman", Society: "GREENWOOD-PUNE", Status: "VERIFIED", Destination: "/management/dashboard" },
    { Email: "treasurer@greenwood.in", Role: "Treasurer", Society: "GREENWOOD-PUNE", Status: "VERIFIED", Destination: "/management/dashboard" },
    { Email: "manager@greenwood.in", Role: "Society Manager", Society: "GREENWOOD-PUNE", Status: "VERIFIED", Destination: "/management/dashboard" },
    { Email: "pending.owner@greenwood.in", Role: "Owner (New)", Society: "GREENWOOD-PUNE", Status: "PENDING", Destination: "/pending-approval" },
    { Email: "admin@societyflow.com", Role: "Super Admin", Society: "Platform-wide", Status: "VERIFIED", Destination: "/admin/dashboard" },
    { Email: "auditor@legaldesk.in", Role: "Legal Partner", Society: "Empanelled", Status: "VERIFIED", Destination: "/partner/dashboard" },
    { Email: "multi.user@societyflow.com", Role: "Multi-Society", Society: "Greenwood + Palmgrove", Status: "VERIFIED", Destination: "/select-workspace" },
  ]);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

if (process.argv[1]?.includes("seed")) {
  runSeed().catch((err) => {
    console.error("Seed execution failed:", err);
    process.exit(1);
  });
}
