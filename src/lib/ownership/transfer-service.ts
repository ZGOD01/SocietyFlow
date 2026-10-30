import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import {
  OwnershipTransfer,
  IOwnershipTransfer,
  OwnershipTransferType,
  OwnershipHistory,
  FlatOccupancy,
  Flat,
  Society,
  SocietyMembership,
  User,
  AuditEvent,
} from "@/models";
import { dispatchNotification } from "@/lib/notifications/notification-engine";

export interface InitiateTransferInput {
  societyId: string;
  flatId: string;
  transferType: OwnershipTransferType;
  reason: string;
  effectiveDate?: string;
  proposedOwner: {
    name: string;
    email: string;
    phone: string;
  };
  documents?: Array<{
    documentId?: string;
    documentType: string;
    name: string;
    fileUrl: string;
  }>;
}

/**
 * Initiate an ownership transfer request for an authorized flat
 */
export async function initiateOwnershipTransfer(
  currentOwnerUser: { id: string; name: string; email: string },
  input: InitiateTransferInput
) {
  await connectDB();

  // 1. Authorize: Current user MUST have an approved OWNER occupancy for this flat
  const activeOccupancy = await FlatOccupancy.findOne({
    flatId: new Types.ObjectId(input.flatId),
    userId: new Types.ObjectId(currentOwnerUser.id),
    societyId: new Types.ObjectId(input.societyId),
    occupancyType: "OWNER",
    status: "APPROVED",
  });

  if (!activeOccupancy) {
    throw new Error(
      "Unauthorized: You can only initiate an ownership transfer for a flat where you are a verified, approved owner."
    );
  }

  // 2. Concurrency check: Ensure no active pending transfer is currently open for this flat
  const existingPendingTransfer = await OwnershipTransfer.findOne({
    flatId: new Types.ObjectId(input.flatId),
    status: {
      $in: [
        "AWAITING_NEW_OWNER",
        "AWAITING_SOCIETY_VERIFICATION",
        "UNDER_REVIEW",
        "INFORMATION_REQUIRED",
        "APPROVED_PENDING_COMPLETION",
      ],
    },
  });

  if (existingPendingTransfer) {
    throw new Error(
      "A transfer request is already pending or in progress for this flat. Multiple concurrent transfers are prohibited."
    );
  }

  // 3. Check if proposed owner already has an account
  const proposedUser = await User.findOne({
    email: input.proposedOwner.email.toLowerCase().trim(),
  });

  // 4. Check for active tenant occupancies on this flat (Section 6 & 10 requirement)
  const activeTenancies = await FlatOccupancy.find({
    flatId: new Types.ObjectId(input.flatId),
    occupancyType: "TENANT",
    status: "APPROVED",
  }).populate("userId", "name email");

  const tenancyFlags = activeTenancies.map((t) => {
    const userDoc = t.userId as unknown as { name?: string; email?: string } | null;
    return {
      occupancyId: t._id,
      tenantName: userDoc?.name || t.ownerName || "Tenant",
      tenantEmail: userDoc?.email || "tenant@societyflow.com",
      leaseStartDate: t.leaseStartDate,
      leaseEndDate: t.leaseEndDate,
      status: t.status,
      reviewed: false,
    };
  });

  // 5. Generate secure invitation token
  const invitationToken = `TRF-INV-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  // 6. Create transfer record
  const transfer = await OwnershipTransfer.create({
    societyId: new Types.ObjectId(input.societyId),
    flatId: new Types.ObjectId(input.flatId),
    currentOwnerId: new Types.ObjectId(currentOwnerUser.id),
    currentOwnerName: currentOwnerUser.name,
    currentOwnerEmail: currentOwnerUser.email,
    proposedOwner: {
      name: input.proposedOwner.name.trim(),
      email: input.proposedOwner.email.toLowerCase().trim(),
      phone: input.proposedOwner.phone.trim(),
      existingUserId: proposedUser ? proposedUser._id : undefined,
    },
    transferType: input.transferType || "SALE",
    reason: input.reason.trim(),
    effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : new Date(),
    status: "AWAITING_NEW_OWNER",
    newOwnerAccepted: false,
    invitationToken,
    documents: (input.documents || []).map((d) => ({
      documentId: d.documentId ? new Types.ObjectId(d.documentId) : undefined,
      documentType: d.documentType,
      name: d.name,
      fileUrl: d.fileUrl,
      verified: false,
      uploadedAt: new Date(),
    })),
    activeTenancies: tenancyFlags,
    timeline: [
      {
        stage: "TRANSFER_INITIATION",
        status: "AWAITING_NEW_OWNER",
        performedBy: new Types.ObjectId(currentOwnerUser.id),
        performerName: currentOwnerUser.name,
        performerRole: "CURRENT_OWNER",
        comments: `Ownership transfer initiated via ${input.transferType}. Invitation sent to ${input.proposedOwner.name}.`,
        timestamp: new Date(),
      },
    ],
  });

  // 7. Audit log
  await AuditEvent.create({
    societyId: new Types.ObjectId(input.societyId),
    userId: new Types.ObjectId(currentOwnerUser.id),
    action: "OWNERSHIP_TRANSFER_INITIATED",
    details: {
      transferId: transfer._id.toString(),
      flatId: input.flatId,
      proposedOwner: input.proposedOwner.email,
      transferType: input.transferType,
    },
  });

  // 8. Notifications
  // Notify Current Owner
  await dispatchNotification({
    recipients: [currentOwnerUser.id],
    societyId: input.societyId,
    eventType: "TRANSFER_INITIATED",
    category: "OWNERSHIP_TRANSFER",
    type: "info",
    title: "Ownership Transfer Initiated",
    message: `You have initiated a property transfer for your unit to ${input.proposedOwner.name}. Awaiting new owner acceptance.`,
    actionUrl: `/ownership-transfer/${transfer._id.toString()}`,
  });

  // If proposed owner is registered, notify in-app; otherwise Resend email is sent to their invited email
  if (proposedUser) {
    await dispatchNotification({
      recipients: [proposedUser._id.toString()],
      societyId: input.societyId,
      eventType: "NEW_OWNER_INVITED",
      category: "OWNERSHIP_TRANSFER",
      type: "action_required",
      title: "Property Transfer Review Required",
      message: `${currentOwnerUser.name} has proposed an ownership transfer to you in SocietyFlow. Review and accept the proposal.`,
      actionUrl: `/ownership-transfer/${transfer._id.toString()}`,
    });
  }

  // Notify Society Committee
  const committeeMembers = await SocietyMembership.find({
    societyId: new Types.ObjectId(input.societyId),
    role: { $in: ["SECRETARY", "CHAIRMAN", "SOCIETY_MANAGER"] },
    status: "VERIFIED",
  }).lean();

  for (const cm of committeeMembers) {
    await dispatchNotification({
      recipients: [cm.userId.toString()],
      societyId: input.societyId,
      eventType: "TRANSFER_VERIFICATION_REQUIRED",
      category: "OWNERSHIP_TRANSFER",
      type: "info",
      title: "New Ownership Transfer Initiated",
      message: `An ownership transfer has been initiated for Unit. Review documents once accepted by incoming owner.`,
      actionUrl: `/ownership-transfer/${transfer._id.toString()}`,
    });
  }

  return transfer;
}

/**
 * Proposed new owner accepts or declines transfer proposal
 */
export async function respondToTransferInvitation(
  user: { id: string; email: string; name: string },
  transferId: string,
  accept: boolean,
  comments?: string
) {
  await connectDB();

  const transfer = await OwnershipTransfer.findById(transferId);
  if (!transfer) {
    throw new Error("Ownership transfer record not found.");
  }

  // Verify email matches proposed owner
  const isMatch =
    transfer.proposedOwner.email.toLowerCase() === user.email.toLowerCase() ||
    (transfer.proposedOwner.existingUserId &&
      transfer.proposedOwner.existingUserId.toString() === user.id);

  if (!isMatch) {
    throw new Error("Unauthorized: You are not the designated recipient of this ownership transfer.");
  }

  if (transfer.status !== "AWAITING_NEW_OWNER") {
    throw new Error(`Cannot respond: Transfer is currently in '${transfer.status}' status.`);
  }

  if (!accept) {
    transfer.status = "CANCELLED";
    transfer.newOwnerAccepted = false;
    transfer.newOwnerComments = comments || "Invitation declined by proposed new owner.";
    transfer.timeline.push({
      stage: "NEW_OWNER_DECLINE",
      status: "CANCELLED",
      performedBy: new Types.ObjectId(user.id),
      performerName: user.name,
      performerRole: "PROPOSED_OWNER",
      comments: comments || "Declined invitation.",
      timestamp: new Date(),
    });

    await transfer.save();

    // Notify outgoing owner
    await dispatchNotification({
      recipients: [transfer.currentOwnerId.toString()],
      societyId: transfer.societyId.toString(),
      eventType: "TRANSFER_REJECTED",
      category: "OWNERSHIP_TRANSFER",
      type: "warning",
      title: "Ownership Transfer Declined",
      message: `${user.name} declined the proposed ownership transfer.`,
      actionUrl: `/ownership-transfer/${transfer._id.toString()}`,
    });

    return transfer;
  }

  // Accepted
  transfer.newOwnerAccepted = true;
  transfer.newOwnerAcceptedAt = new Date();
  transfer.newOwnerComments = comments;
  transfer.status = "AWAITING_SOCIETY_VERIFICATION";
  transfer.proposedOwner.existingUserId = new Types.ObjectId(user.id);

  transfer.timeline.push({
    stage: "NEW_OWNER_ACCEPTANCE",
    status: "AWAITING_SOCIETY_VERIFICATION",
    performedBy: new Types.ObjectId(user.id),
    performerName: user.name,
    performerRole: "PROPOSED_OWNER",
    comments: comments || "Accepted ownership transfer proposal. Ready for Managing Committee verification.",
    timestamp: new Date(),
  });

  await transfer.save();

  // Audit
  await AuditEvent.create({
    societyId: transfer.societyId,
    userId: new Types.ObjectId(user.id),
    action: "OWNERSHIP_TRANSFER_ACCEPTED_BY_NEW_OWNER",
    details: { transferId: transfer._id.toString(), flatId: transfer.flatId.toString() },
  });

  // Notify outgoing owner
  await dispatchNotification({
    recipients: [transfer.currentOwnerId.toString()],
    societyId: transfer.societyId.toString(),
    eventType: "NEW_OWNER_ACCEPTED",
    category: "OWNERSHIP_TRANSFER",
    type: "info",
    title: "Transfer Accepted by New Owner",
    message: `${user.name} has accepted the property transfer proposal. Now pending Society Management verification.`,
    actionUrl: `/ownership-transfer/${transfer._id.toString()}`,
  });

  // Notify committee
  const committee = await SocietyMembership.find({
    societyId: transfer.societyId,
    role: { $in: ["SECRETARY", "CHAIRMAN", "SOCIETY_MANAGER"] },
    status: "VERIFIED",
  }).lean();

  for (const cm of committee) {
    await dispatchNotification({
      recipients: [cm.userId.toString()],
      societyId: transfer.societyId.toString(),
      eventType: "TRANSFER_VERIFICATION_REQUIRED",
      category: "OWNERSHIP_TRANSFER",
      type: "action_required",
      title: "Ownership Transfer Ready for Verification",
      message: `Incoming owner ${user.name} has accepted the transfer. Verify submitted Sale Deed and Share Certificate.`,
      actionUrl: `/ownership-transfer/${transfer._id.toString()}`,
    });
  }

  return transfer;
}

/**
 * Society committee decision: APPROVE, REQUEST_CORRECTION, or REJECT
 */
export async function recordSocietyTransferDecision(
  committeeUser: { id: string; name: string; role: string },
  transferId: string,
  action: "APPROVE" | "REQUEST_CORRECTION" | "REJECT",
  comments?: string
) {
  await connectDB();

  const transfer = await OwnershipTransfer.findById(transferId);
  if (!transfer) {
    throw new Error("Ownership transfer not found.");
  }

  if (action === "APPROVE") {
    // Check if required documents (Sale Deed & Share Certificate) are verified
    transfer.status = "APPROVED_PENDING_COMPLETION";
    transfer.societyDecision = {
      decidedBy: new Types.ObjectId(committeeUser.id),
      decidedByName: committeeUser.name,
      decidedByRole: committeeUser.role,
      decidedAt: new Date(),
      status: "APPROVED",
      comments: comments || "Documents verified. Managing Committee has approved transfer pending final completion execution.",
    };

    transfer.timeline.push({
      stage: "SOCIETY_VERIFICATION",
      status: "APPROVED_PENDING_COMPLETION",
      performedBy: new Types.ObjectId(committeeUser.id),
      performerName: committeeUser.name,
      performerRole: committeeUser.role,
      comments: comments || "Approved by Managing Committee.",
      timestamp: new Date(),
    });

    await transfer.save();

    // Notify both parties
    await dispatchNotification({
      recipients: [transfer.currentOwnerId.toString()],
      societyId: transfer.societyId.toString(),
      eventType: "TRANSFER_APPROVED",
      category: "OWNERSHIP_TRANSFER",
      type: "success",
      title: "Ownership Transfer Approved by Society",
      message: "The Managing Committee has verified documents and approved the transfer request.",
      actionUrl: `/ownership-transfer/${transfer._id.toString()}`,
    });

    if (transfer.proposedOwner.existingUserId) {
      await dispatchNotification({
        recipients: [transfer.proposedOwner.existingUserId.toString()],
        societyId: transfer.societyId.toString(),
        eventType: "TRANSFER_APPROVED",
        category: "OWNERSHIP_TRANSFER",
        type: "success",
        title: "Ownership Transfer Approved by Society",
        message: "Your ownership transfer has been approved by the Society Managing Committee.",
        actionUrl: `/ownership-transfer/${transfer._id.toString()}`,
      });
    }
  } else if (action === "REQUEST_CORRECTION") {
    transfer.status = "INFORMATION_REQUIRED";
    transfer.societyDecision = {
      decidedBy: new Types.ObjectId(committeeUser.id),
      decidedByName: committeeUser.name,
      decidedByRole: committeeUser.role,
      decidedAt: new Date(),
      status: "CORRECTION_REQUIRED",
      comments: comments || "Additional documents or clarifications required.",
    };

    transfer.timeline.push({
      stage: "SOCIETY_VERIFICATION",
      status: "INFORMATION_REQUIRED",
      performedBy: new Types.ObjectId(committeeUser.id),
      performerName: committeeUser.name,
      performerRole: committeeUser.role,
      comments: comments || "Correction / Additional information requested.",
      timestamp: new Date(),
    });

    await transfer.save();

    // Notify current owner
    await dispatchNotification({
      recipients: [transfer.currentOwnerId.toString()],
      societyId: transfer.societyId.toString(),
      eventType: "TRANSFER_CORRECTION_REQUIRED",
      category: "OWNERSHIP_TRANSFER",
      type: "warning",
      title: "Transfer Correction Required",
      message: `The Managing Committee requested corrections: ${comments}`,
      actionUrl: `/ownership-transfer/${transfer._id.toString()}`,
    });
  } else {
    // REJECT
    transfer.status = "REJECTED";
    transfer.societyDecision = {
      decidedBy: new Types.ObjectId(committeeUser.id),
      decidedByName: committeeUser.name,
      decidedByRole: committeeUser.role,
      decidedAt: new Date(),
      status: "REJECTED",
      comments: comments || "Transfer rejected by society committee.",
    };

    transfer.timeline.push({
      stage: "SOCIETY_VERIFICATION",
      status: "REJECTED",
      performedBy: new Types.ObjectId(committeeUser.id),
      performerName: committeeUser.name,
      performerRole: committeeUser.role,
      comments: comments || "Rejected by Managing Committee.",
      timestamp: new Date(),
    });

    await transfer.save();

    await dispatchNotification({
      recipients: [transfer.currentOwnerId.toString()],
      societyId: transfer.societyId.toString(),
      eventType: "TRANSFER_REJECTED",
      category: "OWNERSHIP_TRANSFER",
      type: "warning",
      title: "Ownership Transfer Rejected",
      message: `The Managing Committee rejected the transfer request: ${comments}`,
      actionUrl: `/ownership-transfer/${transfer._id.toString()}`,
    });
  }

  return transfer;
}

/**
 * Final Authorized Completion of Property Transfer (Section 4 & 5)
 * Updates flat directory, ends outgoing owner occupancy, creates incoming owner occupancy,
 * records ownership history, reviews active tenancies, and isolates historical personal documents.
 */
export async function completeOwnershipTransfer(
  committeeUser: { id: string; name: string; role: string },
  transferId: string,
  options?: {
    newShareCertificateNumber?: string;
    completionNotes?: string;
  }
) {
  await connectDB();

  const transfer = await OwnershipTransfer.findById(transferId);
  if (!transfer) {
    throw new Error("Ownership transfer not found.");
  }

  if (transfer.status !== "APPROVED_PENDING_COMPLETION") {
    throw new Error(
      `Cannot complete transfer: Status must be 'APPROVED_PENDING_COMPLETION', current status is '${transfer.status}'.`
    );
  }

  // 1. Identify incoming owner user record
  let incomingUserId: Types.ObjectId | null = transfer.proposedOwner.existingUserId || null;

  if (!incomingUserId) {
    const existing = await User.findOne({ email: transfer.proposedOwner.email.toLowerCase() });
    if (existing) {
      incomingUserId = existing._id;
    } else {
      // Create user record for incoming owner with placeholder temporary credentials
      const createdUser = await User.create({
        name: transfer.proposedOwner.name,
        email: transfer.proposedOwner.email.toLowerCase(),
        password: `$2a$10$temporaryHashForTransfer${Date.now()}`,
        phone: transfer.proposedOwner.phone,
        status: "ACTIVE",
        onboardingStatus: "DOCUMENT_ONBOARDING_REQUIRED",
      });
      incomingUserId = createdUser._id;
    }
    transfer.proposedOwner.existingUserId = incomingUserId;
  }

  // 2. Fetch Flat to ensure integrity
  const flat = await Flat.findById(transfer.flatId);
  if (!flat) {
    throw new Error("Associated flat not found in directory.");
  }

  const previousOwnerName = transfer.currentOwnerName || "Previous Owner";
  const newOwnerName = transfer.proposedOwner.name;

  // 3. Atomically close outgoing owner occupancy record
  await FlatOccupancy.findOneAndUpdate(
    {
      flatId: transfer.flatId,
      userId: transfer.currentOwnerId,
      status: "APPROVED",
    },
    {
      $set: {
        status: "ENDED",
        rejectionReason: `Ownership transferred to ${newOwnerName} on ${new Date().toISOString()}`,
      },
    }
  );

  // 4. Create or update incoming owner occupancy record
  await FlatOccupancy.findOneAndUpdate(
    {
      flatId: transfer.flatId,
      userId: incomingUserId,
    },
    {
      $set: {
        societyId: transfer.societyId,
        occupancyType: "OWNER",
        status: "APPROVED",
        ownershipType: "SOLE_OWNER",
        ownerName: newOwnerName,
        verifiedBy: new Types.ObjectId(committeeUser.id),
        verifiedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  // 5. Ensure incoming owner has verified SocietyMembership
  await SocietyMembership.findOneAndUpdate(
    {
      societyId: transfer.societyId,
      userId: incomingUserId,
    },
    {
      $set: {
        role: "OWNER",
        status: "VERIFIED",
      },
    },
    { upsert: true }
  );

  // 6. Update Flat Directory with new currentOwnerId and share certificate
  flat.currentOwnerId = incomingUserId;
  if (options?.newShareCertificateNumber) {
    flat.shareCertificateNumber = options.newShareCertificateNumber.trim();
  }
  await flat.save();

  // 7. Check for active tenancies and flag for review (Section 6 requirement)
  // Active tenancies must be preserved and flagged, NOT silently reassigned or deleted
  const activeTenancies = await FlatOccupancy.find({
    flatId: transfer.flatId,
    occupancyType: "TENANT",
    status: "APPROVED",
  });

  if (activeTenancies.length > 0) {
    transfer.activeTenancies = activeTenancies.map((t) => ({
      occupancyId: t._id,
      tenantName: t.ownerName || "Tenant Occupant",
      tenantEmail: "tenant@societyflow.com",
      status: "ACTIVE",
      reviewed: true,
      reviewNotes: `Tenancy active during ownership transfer to ${newOwnerName}. Notified new owner.`,
    }));
  }

  // 8. Create immutable OwnershipHistory record (Section 5 requirement)
  await OwnershipHistory.create({
    societyId: transfer.societyId,
    flatId: transfer.flatId,
    transferId: transfer._id,
    previousOwnerId: transfer.currentOwnerId,
    previousOwnerName,
    previousOwnerEmail: transfer.currentOwnerEmail,
    newOwnerId: incomingUserId,
    newOwnerName,
    newOwnerEmail: transfer.proposedOwner.email,
    transferType: transfer.transferType,
    effectiveDate: transfer.effectiveDate || new Date(),
    completedAt: new Date(),
    completedBy: new Types.ObjectId(committeeUser.id),
    shareCertificateNumber: options?.newShareCertificateNumber || flat.shareCertificateNumber,
    remarks: options?.completionNotes || "Transfer successfully completed and statutory register updated.",
  });

  // 9. Mark transfer as COMPLETED
  transfer.status = "COMPLETED";
  transfer.completionDetails = {
    completedBy: new Types.ObjectId(committeeUser.id),
    completedByName: committeeUser.name,
    completedAt: new Date(),
    shareCertificateTransferred: true,
    newShareCertificateNumber: options?.newShareCertificateNumber || flat.shareCertificateNumber,
    completionNotes: options?.completionNotes || "Official ownership transfer finalized in SocietyFlow roster.",
  };

  transfer.timeline.push({
    stage: "TRANSFER_COMPLETION",
    status: "COMPLETED",
    performedBy: new Types.ObjectId(committeeUser.id),
    performerName: committeeUser.name,
    performerRole: committeeUser.role,
    comments: `Transfer finalized. Unit ownership allocated to ${newOwnerName}.`,
    timestamp: new Date(),
  });

  await transfer.save();

  // 10. Audit Event
  await AuditEvent.create({
    societyId: transfer.societyId,
    userId: new Types.ObjectId(committeeUser.id),
    action: "OWNERSHIP_TRANSFER_COMPLETED",
    details: {
      transferId: transfer._id.toString(),
      flatId: transfer.flatId.toString(),
      previousOwner: previousOwnerName,
      newOwner: newOwnerName,
      shareCertificateNumber: options?.newShareCertificateNumber || flat.shareCertificateNumber,
    },
  });

  // 11. Notifications to all parties (Section 5)
  // To Outgoing Owner
  await dispatchNotification({
    recipients: [transfer.currentOwnerId.toString()],
    societyId: transfer.societyId.toString(),
    eventType: "TRANSFER_COMPLETED",
    category: "OWNERSHIP_TRANSFER",
    type: "success",
    title: "Property Ownership Transfer Completed",
    message: `Your ownership transfer to ${newOwnerName} has been officially confirmed by Society Management.`,
    actionUrl: `/ownership-transfer/${transfer._id.toString()}`,
  });

  // To Incoming Owner
  await dispatchNotification({
    recipients: [incomingUserId.toString()],
    societyId: transfer.societyId.toString(),
    eventType: "TRANSFER_COMPLETED",
    category: "OWNERSHIP_TRANSFER",
    type: "success",
    title: "Ownership Record Activated",
    message: `Congratulations! You are now the verified owner of Flat ${flat.flatNumber}. Log in to complete your onboarding documents.`,
    actionUrl: `/dashboard?view=owner`,
  });

  return transfer;
}
