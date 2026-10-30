import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import crypto from "crypto";
import mongoose, { Types } from "mongoose";
import { uploadObjectDirect, generateR2ObjectKey } from "@/lib/r2";
import { GeneratedDocument, IGeneratedDocument } from "@/models/GeneratedDocument";
import { DocumentModel } from "@/models/Document";
import { IServiceRequest } from "@/models/ServiceRequest";
import { ISociety } from "@/models/Society";

export interface GenerateCertificateParams {
  request: IServiceRequest;
  society: ISociety;
  documentType: "HOME_LOAN_NOC" | "NO_DUES_CERT" | "ADDRESS_CONFIRMATION" | "GENERAL_SOCIETY_LETTER";
  signatoryUserId: Types.ObjectId | string;
  signatoryName: string;
  signatoryRole: string;
  flatNumber: string;
  wingName?: string;
  purpose?: string;
  bankName?: string;
}

export async function generateSocietyCertificate({
  request,
  society,
  documentType,
  signatoryUserId,
  signatoryName,
  signatoryRole,
  flatNumber,
  wingName = "",
  purpose = "General Purpose",
  bankName = "Financial Institution",
}: GenerateCertificateParams): Promise<IGeneratedDocument> {
  const now = new Date();
  const year = now.getFullYear();
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  const typeCode =
    documentType === "HOME_LOAN_NOC"
      ? "NOC"
      : documentType === "NO_DUES_CERT"
      ? "NDC"
      : documentType === "ADDRESS_CONFIRMATION"
      ? "ADC"
      : "LET";

  const documentRef = `SF-${typeCode}-${year}-${randomSuffix}`;
  const verificationToken = crypto.randomBytes(12).toString("hex");

  // Public verification URL embedded in QR Code
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://societyflow.in";
  const verifyUrl = `${baseUrl}/verify/${verificationToken}`;

  // Generate QR Code PNG buffer
  const qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
    width: 140,
    margin: 1,
    color: {
      dark: "#1A1A1A",
      light: "#FFFFFF",
    },
  });

  // Create PDF Document (A4 size: 595.28 x 841.89 pt)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const qrImage = await pdfDoc.embedPng(qrPngBuffer);

  // Palette (SPPU Notes Style Guide)
  const primaryColor = rgb(0.1, 0.1, 0.1); // #1A1A1A
  const indigoColor = rgb(0.31, 0.27, 0.9); // #4F46E5
  const mutedColor = rgb(0.45, 0.45, 0.45);
  const subtleBg = rgb(0.97, 0.98, 0.98); // #F8F9FA

  // 1. Decorative border
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: indigoColor,
    borderWidth: 1.5,
  });

  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0.5,
  });

  // 2. Society Letterhead Header
  let cursorY = height - 70;

  const societyName = society.name.toUpperCase();
  const socNameWidth = fontBold.widthOfTextAtSize(societyName, 17);
  page.drawText(societyName, {
    x: (width - socNameWidth) / 2,
    y: cursorY,
    size: 17,
    font: fontBold,
    color: primaryColor,
  });

  cursorY -= 16;
  const regNumber = society.registrationNumber
    ? `Reg. No: ${society.registrationNumber}`
    : "Registered Co-operative Housing Society";
  const regWidth = fontRegular.widthOfTextAtSize(regNumber, 9);
  page.drawText(regNumber, {
    x: (width - regWidth) / 2,
    y: cursorY,
    size: 9,
    font: fontRegular,
    color: mutedColor,
  });

  cursorY -= 14;
  const fullAddress = `${society.address ? `${society.address}, ` : ""}${society.city || ""}, ${society.state || ""}${society.pinCode ? ` - ${society.pinCode}` : ""}`;
  const addrWidth = fontRegular.widthOfTextAtSize(fullAddress, 8.5);
  page.drawText(fullAddress, {
    x: (width - addrWidth) / 2,
    y: cursorY,
    size: 8.5,
    font: fontRegular,
    color: mutedColor,
  });

  cursorY -= 14;
  page.drawLine({
    start: { x: 45, y: cursorY },
    end: { x: width - 45, y: cursorY },
    thickness: 1,
    color: indigoColor,
  });

  // 3. Document Title Bar
  cursorY -= 35;
  let title = "OFFICIAL SOCIETY CERTIFICATE";
  if (documentType === "HOME_LOAN_NOC") title = "NO-OBJECTION CERTIFICATE (HOME LOAN)";
  else if (documentType === "NO_DUES_CERT") title = "NO-DUES CLEARANCE CERTIFICATE";
  else if (documentType === "ADDRESS_CONFIRMATION") title = "RESIDENTIAL ADDRESS CONFIRMATION";
  else if (documentType === "GENERAL_SOCIETY_LETTER") title = "OFFICIAL SOCIETY LETTER";

  page.drawRectangle({
    x: 45,
    y: cursorY - 6,
    width: width - 90,
    height: 28,
    color: subtleBg,
    borderColor: rgb(0.85, 0.88, 0.95),
    borderWidth: 1,
  });

  const titleWidth = fontBold.widthOfTextAtSize(title, 13);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: cursorY + 2,
    size: 13,
    font: fontBold,
    color: indigoColor,
  });

  // 4. Meta Row: Reference & Date
  cursorY -= 32;
  page.drawText(`Ref. No: ${documentRef}`, {
    x: 48,
    y: cursorY,
    size: 9.5,
    font: fontBold,
    color: primaryColor,
  });

  const formattedDate = `Issue Date: ${now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;
  const dateWidth = fontRegular.widthOfTextAtSize(formattedDate, 9.5);
  page.drawText(formattedDate, {
    x: width - 48 - dateWidth,
    y: cursorY,
    size: 9.5,
    font: fontRegular,
    color: primaryColor,
  });

  cursorY -= 12;
  page.drawText(`Request ID: ${request.requestId}`, {
    x: 48,
    y: cursorY,
    size: 8.5,
    font: fontRegular,
    color: mutedColor,
  });

  // 5. Salutation & Body Paragraphs
  cursorY -= 35;
  page.drawText("TO WHOMSOEVER IT MAY CONCERN", {
    x: 48,
    y: cursorY,
    size: 10.5,
    font: fontBold,
    color: primaryColor,
  });

  cursorY -= 25;
  const applicantName = (request.formData?.applicantName as string) || "Member / Resident";
  const roleText = request.applicantRole === "OWNER" ? "bonafide property owner" : "registered lawful tenant";
  const unitText = wingName ? `Flat No. ${flatNumber}, ${wingName}` : `Flat No. ${flatNumber}`;

  let bodyParagraphs: string[] = [];

  if (documentType === "HOME_LOAN_NOC") {
    bodyParagraphs = [
      `This is to certify that ${applicantName} is the ${roleText} of ${unitText} in ${society.name}, situated at ${society.address ? `${society.address}, ` : ""}${society.city || ""}, ${society.state || ""}.`,
      `The Managing Committee of the Society confirms that it has NO OBJECTION to the applicant mortgaging/pledging their ownership interest in the said property with ${bankName || "authorized banking institutions / housing finance companies"} for securing a home loan facility.`,
      `The Society further certifies that the title of the member to the said flat is clear and marketable according to the records available with the Society, and all maintenance charges and society assessments up to the current billing period have been paid.`,
      `The Society undertakes that upon receipt of notice from the lender, it will record the mortgage charge in its register of members as per prevailing society bylaws.`,
    ];
  } else if (documentType === "NO_DUES_CERT") {
    bodyParagraphs = [
      `This is to certify that ${applicantName}, ${roleText} of ${unitText} in ${society.name}, has cleared all regular society maintenance charges, municipal taxes apportionments, sinking fund contributions, and allied utility assessments.`,
      `As of ${now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}, there are NIL outstanding dues or penalty charges pending against the aforementioned flat in the books of the Society.`,
      `This certificate is issued upon verification by the Society Treasurer and Secretary upon the specific request of the member for: ${purpose}.`,
    ];
  } else if (documentType === "ADDRESS_CONFIRMATION") {
    bodyParagraphs = [
      `This is to certify that ${applicantName} is currently residing at ${unitText}, in ${society.name}, ${society.address ? `${society.address}, ` : ""}${society.city || ""}, ${society.state || ""}${society.pinCode ? ` - ${society.pinCode}` : ""}.`,
      `According to the verified records and member occupancy register maintained by the Society, the applicant is an authorized ${roleText} of the aforementioned flat.`,
      `This certificate is issued on request for identity/address verification and official correspondence purposes.`,
    ];
  } else {
    bodyParagraphs = [
      `This is to certify regarding ${unitText} in ${society.name}, held/occupied by ${applicantName} (${roleText}).`,
      `The Managing Committee has reviewed the application submitted under Request Ref #${request.requestId} regarding "${purpose}".`,
      `This formal endorsement letter is released in accordance with the decision of the Managing Committee.`,
    ];
  }

  // Draw paragraphs with simple line wrapping
  const maxWidth = width - 96;
  for (const para of bodyParagraphs) {
    const words = para.split(" ");
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = fontRegular.widthOfTextAtSize(testLine, 9.5);
      if (testWidth > maxWidth) {
        page.drawText(currentLine, {
          x: 48,
          y: cursorY,
          size: 9.5,
          font: fontRegular,
          color: primaryColor,
          lineHeight: 14,
        });
        cursorY -= 15;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      page.drawText(currentLine, {
        x: 48,
        y: cursorY,
        size: 9.5,
        font: fontRegular,
        color: primaryColor,
      });
      cursorY -= 20;
    }
  }

  // 6. Verification QR Box & Authorized Signatory Box
  cursorY = Math.max(cursorY - 20, 160);

  // Left: QR Code Box
  page.drawImage(qrImage, {
    x: 48,
    y: cursorY - 75,
    width: 75,
    height: 75,
  });

  page.drawText("Scan to Verify", {
    x: 132,
    y: cursorY - 15,
    size: 8.5,
    font: fontBold,
    color: primaryColor,
  });
  page.drawText("Digital Verification Record", {
    x: 132,
    y: cursorY - 28,
    size: 7.5,
    font: fontRegular,
    color: mutedColor,
  });
  page.drawText(`Token: ${verificationToken.slice(0, 12)}...`, {
    x: 132,
    y: cursorY - 40,
    size: 7,
    font: fontRegular,
    color: mutedColor,
  });
  page.drawText("SocietyFlow Prototype Registry", {
    x: 132,
    y: cursorY - 52,
    size: 7,
    font: fontRegular,
    color: indigoColor,
  });

  // Right: Signatory Box
  const signatoryBoxX = width - 230;
  page.drawText(`For ${society.name}`, {
    x: signatoryBoxX,
    y: cursorY - 5,
    size: 9,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText("[DIGITALLY SANCTIONED]", {
    x: signatoryBoxX,
    y: cursorY - 32,
    size: 8,
    font: fontBold,
    color: indigoColor,
  });

  page.drawText(signatoryName, {
    x: signatoryBoxX,
    y: cursorY - 52,
    size: 9.5,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText(`${signatoryRole}, Managing Committee`, {
    x: signatoryBoxX,
    y: cursorY - 65,
    size: 8,
    font: fontRegular,
    color: mutedColor,
  });

  // 7. Demonstration Disclaimer Footer Box (Prompt 8 Section 10 & 13 Mandate)
  const disclaimerY = 42;
  page.drawRectangle({
    x: 40,
    y: disclaimerY - 4,
    width: width - 80,
    height: 32,
    color: rgb(0.98, 0.95, 0.92),
    borderColor: rgb(0.92, 0.75, 0.65),
    borderWidth: 0.8,
  });

  const discLine1 = "DEMONSTRATION PROTOTYPE: Generated electronically via SocietyFlow for management review & test workflows.";
  const discLine2 = "This document does NOT constitute a legally binding electronic signature under the Information Technology Act.";
  const d1Width = fontRegular.widthOfTextAtSize(discLine1, 7.5);
  const d2Width = fontRegular.widthOfTextAtSize(discLine2, 7.5);

  page.drawText(discLine1, {
    x: (width - d1Width) / 2,
    y: disclaimerY + 14,
    size: 7.5,
    font: fontBold,
    color: rgb(0.5, 0.25, 0.1),
  });

  page.drawText(discLine2, {
    x: (width - d2Width) / 2,
    y: disclaimerY + 3,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.5, 0.25, 0.1),
  });

  // Serialize PDF
  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  // Generate Cloudflare R2 object key
  const r2Key = generateR2ObjectKey({
    societyId: society._id.toString(),
    scope: "request",
    documentId: request._id.toString(),
    originalFilename: `${documentRef}.pdf`,
  });

  // Upload to Cloudflare R2 (or in-memory dev fallback)
  await uploadObjectDirect({
    r2ObjectKey: r2Key,
    buffer: pdfBuffer,
    mimeType: "application/pdf",
  });

  const docData = {
    documentRef,
    verificationToken,
    societyId: society._id,
    serviceRequestId: request._id,
    requestId: request.requestId,
    applicantUserId: request.applicantUserId,
    applicantName,
    flatId: request.flatId,
    flatNumber,
    wingName,
    documentType,
    title,
    r2ObjectKey: r2Key,
    fileSize: pdfBuffer.length,
    mimeType: "application/pdf",
    issuedAt: now,
    issuedByUserId: typeof signatoryUserId === "string" ? new Types.ObjectId(signatoryUserId) : signatoryUserId,
    issuedByName: signatoryName,
    issuedByRole: signatoryRole,
    verificationCount: 0,
    isDemonstrationPrototype: true,
    metadata: {
      bankName,
      purpose,
    },
  };

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    // Create GeneratedDocument record in MongoDB
    const genDoc = await GeneratedDocument.create(docData);

    // Also create an official record in Document repository so it appears in resident's authorized vault
    const vaultDocId = `DOC-${year}-${randomSuffix}`;
    await DocumentModel.create({
      documentId: vaultDocId,
      societyId: society._id,
      flatId: request.flatId,
      ownerUserId: request.applicantUserId,
      scope: "REQUEST",
      category: "OFFICIAL_CERTIFICATE",
      originalFilename: `${documentRef}.pdf`,
      displayName: `${title} - ${documentRef}`,
      mimeType: "application/pdf",
      size: pdfBuffer.length,
      r2ObjectKey: r2Key,
      r2Bucket: "societyflow-vault-docs",
      verificationStatus: "VERIFIED",
      version: 1,
      visibility: "PRIVATE",
      description: `Official ${title} issued on ${now.toDateString()} by ${signatoryName} (${signatoryRole}).`,
      tags: [documentType, "CERTIFICATE", "SOCIETY_ISSUED"],
      quarantineStatus: "CLEAN",
      isArchived: false,
      verifiedBy: typeof signatoryUserId === "string" ? new Types.ObjectId(signatoryUserId) : signatoryUserId,
      verifiedAt: now,
    });

    return genDoc;
  }

  // Fallback return object for disconnected/unit test environments
  return docData as unknown as IGeneratedDocument;
}
