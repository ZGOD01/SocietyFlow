export interface DefaultServiceTemplate {
  code: string;
  title: string;
  description: string;
  category: "CERTIFICATES_NOC" | "PROPERTY" | "TENANT_OCCUPANCY" | "PERMISSIONS" | "GENERAL";
  eligibility: "OWNER" | "TENANT" | "BOTH";
  requiresOwnerAuthorization: boolean;
  estimatedProcessingDays: number;
  isActive: boolean;
  isDownstreamAvailable: boolean;
  downstreamNote?: string;
  requiredFields: Array<{
    id: string;
    label: string;
    type: "text" | "number" | "date" | "select" | "checkbox" | "textarea";
    required: boolean;
    options?: string[];
    placeholder?: string;
    helpText?: string;
  }>;
  requiredDocuments: Array<{
    code: string;
    title: string;
    description: string;
    required: boolean;
  }>;
}

export const DEFAULT_SERVICE_TEMPLATES: DefaultServiceTemplate[] = [
  // 1. Certificates & NOCs
  {
    code: "home_loan_noc",
    title: "Home Loan NOC",
    description: "Statutory No-Objection Certificate issued by the Society for mortgage or bank housing loan approval.",
    category: "CERTIFICATES_NOC",
    eligibility: "OWNER",
    requiresOwnerAuthorization: false,
    estimatedProcessingDays: 5,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "bankName", label: "Financing Bank / Institution Name", type: "text", required: true, placeholder: "e.g. State Bank of India, HDFC Bank" },
      { id: "branchName", label: "Bank Branch Name & City", type: "text", required: true, placeholder: "e.g. Baner Branch, Pune" },
      { id: "loanAmount", label: "Sanctioned Loan Amount (₹)", type: "number", required: true, placeholder: "e.g. 5000000" },
      { id: "applicantNames", label: "Borrower / Co-Borrower Names", type: "text", required: true, placeholder: "Full legal names as on loan application" },
      { id: "purposeRemarks", label: "Purpose / Specific Bank Clause", type: "textarea", required: false, placeholder: "Any specific bank format or reference number required" },
    ],
    requiredDocuments: [
      { code: "LOAN_SANCTION_LETTER", title: "Bank Loan Sanction Letter", description: "Official loan sanction letter from the lending institution", required: true },
      { code: "NO_DUES_RECEIPT", title: "Latest Maintenance Receipt", description: "Proof of zero pending society dues", required: false },
    ],
  },
  {
    code: "no_dues_cert",
    title: "No-Dues Certificate",
    description: "Formal certification confirming all maintenance dues, sinking funds and society charges are cleared up to date.",
    category: "CERTIFICATES_NOC",
    eligibility: "BOTH",
    requiresOwnerAuthorization: false,
    estimatedProcessingDays: 3,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "targetPeriod", label: "Clearance Period Up To", type: "date", required: true },
      { id: "purposeOfNdc", label: "Purpose of Clearance", type: "select", required: true, options: ["Personal Records", "Bank Loan", "Sale / Resale Due Diligence", "Rental Move-Out"] },
      { id: "remarks", label: "Additional Comments", type: "textarea", required: false },
    ],
    requiredDocuments: [
      { code: "LATEST_BILL_RECEIPT", title: "Latest Paid Maintenance Bill", description: "Copy of the most recent paid society invoice receipt", required: true },
    ],
  },
  {
    code: "address_confirmation",
    title: "Address Confirmation Letter",
    description: "Official society letterhead certification verifying residence and postal address for passport, visa or bank verification.",
    category: "CERTIFICATES_NOC",
    eligibility: "BOTH",
    requiresOwnerAuthorization: false,
    estimatedProcessingDays: 3,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "residentFullName", label: "Applicant Name to Appear on Letter", type: "text", required: true, placeholder: "Full legal name as per government ID" },
      { id: "issuingAuthority", label: "Authority Requiring Proof", type: "select", required: true, options: ["Passport Office", "Visa / Consulate", "Bank Account Opening", "Government Department", "Other"] },
      { id: "residingSince", label: "Residing Since (Year)", type: "text", required: true, placeholder: "e.g. 2021" },
    ],
    requiredDocuments: [
      { code: "GOVT_ID_PROOF", title: "Government Identity Proof", description: "Aadhaar Card, Passport or Voter ID", required: true },
    ],
  },
  {
    code: "general_society_cert",
    title: "General Society Certificate",
    description: "Standard society certification letter for administrative, utility meter or municipal requirements.",
    category: "CERTIFICATES_NOC",
    eligibility: "BOTH",
    requiresOwnerAuthorization: false,
    estimatedProcessingDays: 4,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "subjectMatter", label: "Certificate Subject / Purpose", type: "text", required: true, placeholder: "e.g. Electricity Meter Name Transfer" },
      { id: "addressedTo", label: "Addressed To (Agency / Authority)", type: "text", required: true, placeholder: "e.g. MSEDCL Baner Division" },
      { id: "detailedRequirements", label: "Details to be Certified", type: "textarea", required: true, placeholder: "Describe the specific factual statements required from the Society" },
    ],
    requiredDocuments: [
      { code: "SUPPORTING_DOC", title: "Supporting Utility / Agency Form", description: "Application form or notice from the requesting agency", required: false },
    ],
  },

  // 2. Property
  {
    code: "ownership_transfer",
    title: "Ownership Transfer Request",
    description: "Initiate formal membership and share certificate transfer for resale, succession or family gift deed.",
    category: "PROPERTY",
    eligibility: "OWNER",
    requiresOwnerAuthorization: false,
    estimatedProcessingDays: 14,
    isActive: true,
    isDownstreamAvailable: false,
    downstreamNote: "Ownership transfer intake only. Downstream statutory transfer workflows and committee resolutions will be enabled in a future release.",
    requiredFields: [
      { id: "transferMode", label: "Mode of Transfer", type: "select", required: true, options: ["Resale / Registered Sale Deed", "Family Gift Deed", "Inheritance / Succession", "Court Decree"] },
      { id: "transfereeName", label: "Proposed Transferee / Buyer Full Name", type: "text", required: true, placeholder: "Full legal name of the new purchaser / nominee" },
      { id: "transfereeContact", label: "Transferee Phone & Email", type: "text", required: true, placeholder: "Mobile number & email" },
      { id: "executionDate", label: "Agreement Execution Date", type: "date", required: true },
    ],
    requiredDocuments: [
      { code: "REGISTERED_SALE_DEED", title: "Registered Sale Deed / Agreement", description: "Registered transfer instrument with stamp duty endorsement", required: true },
      { code: "INDEX_II", title: "Index II Copy", description: "Certified copy of government land records Index II", required: true },
    ],
  },
  {
    code: "share_certificate_request",
    title: "Share Certificate Related Request",
    description: "Request society share certificate reissuance, duplicate copy, name correction or endorsement.",
    category: "PROPERTY",
    eligibility: "OWNER",
    requiresOwnerAuthorization: false,
    estimatedProcessingDays: 7,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "requestNature", label: "Nature of Request", type: "select", required: true, options: ["Issue Original Certificate", "Duplicate Share Certificate (Lost/Mutilated)", "Name Correction / Update", "Add Joint Member Endorsement"] },
      { id: "existingCertNumber", label: "Existing Share Certificate Number (if known)", type: "text", required: false, placeholder: "e.g. SC-1049" },
      { id: "explanation", label: "Reason & Background", type: "textarea", required: true, placeholder: "Explain the details of your request" },
    ],
    requiredDocuments: [
      { code: "PROPERTY_TITLE_DEED", title: "Proof of Ownership / Sale Deed", description: "Copy of registered title deed", required: true },
    ],
  },
  {
    code: "property_info_update",
    title: "Property Information Update",
    description: "Update official unit master details such as registered correspondence address, contact numbers or emergency contacts.",
    category: "PROPERTY",
    eligibility: "OWNER",
    requiresOwnerAuthorization: false,
    estimatedProcessingDays: 3,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "updatedEmail", label: "Updated Official Email Address", type: "text", required: false, placeholder: "new.email@example.com" },
      { id: "updatedPhone", label: "Updated Official Phone Number", type: "text", required: false, placeholder: "+91 98765 43210" },
      { id: "mailingAddress", label: "Updated Correspondence Mailing Address", type: "textarea", required: false, placeholder: "Enter new mailing address if residing off-site" },
      { id: "emergencyContact", label: "Emergency Contact (Name & Relationship)", type: "text", required: false, placeholder: "e.g. Ramesh Shah (Brother) - 9822012345" },
    ],
    requiredDocuments: [],
  },

  // 3. Tenant & Occupancy
  {
    code: "tenant_registration_request",
    title: "Tenant Registration Related Request",
    description: "Submit tenant lease renewal, police verification update or occupant roster modifications.",
    category: "TENANT_OCCUPANCY",
    eligibility: "BOTH",
    requiresOwnerAuthorization: true,
    estimatedProcessingDays: 5,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "renewalType", label: "Application Type", type: "select", required: true, options: ["Lease Extension / Renewal", "Add New Co-Occupant / Family Member", "Update Police Verification Record"] },
      { id: "newLeaseEndDate", label: "Extended Lease End Date", type: "date", required: true },
      { id: "numberOfOccupants", label: "Total Number of Residents", type: "number", required: true, placeholder: "e.g. 3" },
    ],
    requiredDocuments: [
      { code: "RENEWED_AGREEMENT", title: "Renewed Leave & License Agreement", description: "Registered agreement or renewal deed", required: true },
      { code: "POLICE_VERIFICATION", title: "Police Verification Intimation", description: "Police clearance receipt or online tenant intimation", required: true },
    ],
  },
  {
    code: "move_in_permission",
    title: "Move-In Permission",
    description: "Request gate security pass and freight elevator reservation for residential moving-in.",
    category: "TENANT_OCCUPANCY",
    eligibility: "BOTH",
    requiresOwnerAuthorization: false,
    estimatedProcessingDays: 2,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "scheduledDate", label: "Scheduled Moving Date", type: "date", required: true },
      { id: "timeSlot", label: "Preferred Time Slot", type: "select", required: true, options: ["Morning (9:00 AM - 1:00 PM)", "Afternoon (1:00 PM - 5:00 PM)", "Evening (5:00 PM - 8:00 PM)"] },
      { id: "packersMoversCompany", label: "Packers & Movers Agency Name", type: "text", required: true, placeholder: "e.g. Urban Relocations" },
      { id: "vehicleNumber", label: "Transport Truck Vehicle Number (if known)", type: "text", required: false, placeholder: "e.g. MH 12 AB 1234" },
    ],
    requiredDocuments: [
      { code: "MOVE_IN_AGREEMENT", title: "Possession Letter or Rental Lease", description: "Proof of approved occupancy", required: false },
    ],
  },
  {
    code: "move_out_permission",
    title: "Move-Out Permission",
    description: "Request gate exit pass and clearance inspection prior to vacating the society premises.",
    category: "TENANT_OCCUPANCY",
    eligibility: "BOTH",
    requiresOwnerAuthorization: true,
    estimatedProcessingDays: 3,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "moveOutDate", label: "Scheduled Move-Out Date", type: "date", required: true },
      { id: "ownerNoDuesConfirmed", label: "Owner Security Deposit & Dues Cleared", type: "checkbox", required: true, helpText: "I confirm that flat handover has been coordinated with the owner" },
      { id: "forwardingAddress", label: "Forwarding Address / City", type: "text", required: false, placeholder: "e.g. Pune / Bangalore" },
    ],
    requiredDocuments: [
      { code: "SOCIETY_NO_DUES", title: "Society Clearance Slip", description: "Signed clearance from society office", required: false },
    ],
  },
  {
    code: "rental_info_update",
    title: "Rental Information Update",
    description: "Update tenant vehicle registration, domestic staff passes or emergency contacts.",
    category: "TENANT_OCCUPANCY",
    eligibility: "TENANT",
    requiresOwnerAuthorization: false,
    estimatedProcessingDays: 2,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "vehicleDetails", label: "New Vehicle Registration (4-Wheeler / 2-Wheeler)", type: "text", required: false, placeholder: "e.g. Honda City MH 12 CD 4567" },
      { id: "maidStaffName", label: "Domestic Helper / Cook Name", type: "text", required: false, placeholder: "Name of regular staff for security pass" },
      { id: "notes", label: "Additional Information", type: "textarea", required: false },
    ],
    requiredDocuments: [],
  },

  // 4. Permissions
  {
    code: "renovation_permission",
    title: "Renovation Permission",
    description: "Statutory society permission for interior woodwork, bathroom tiling, electrical or plumbing overhaul.",
    category: "PERMISSIONS",
    eligibility: "BOTH",
    requiresOwnerAuthorization: true,
    estimatedProcessingDays: 7,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "workStartDate", label: "Proposed Work Start Date", type: "date", required: true },
      { id: "workEndDate", label: "Expected Work Completion Date", type: "date", required: true },
      { id: "scopeOfWork", label: "Detailed Scope of Work", type: "textarea", required: true, placeholder: "List all civil, electrical, plumbing or carpentry activities" },
      { id: "contractorName", label: "Head Contractor Name & Mobile", type: "text", required: true, placeholder: "e.g. Ramesh Patil - 9822334455" },
      { id: "noStructuralChangeAffidavit", label: "Zero Structural Column / Beam Alterations Confirmed", type: "checkbox", required: true, helpText: "Work will not compromise structural load-bearing elements" },
    ],
    requiredDocuments: [
      { code: "CONTRACTOR_ID", title: "Contractor Government ID", description: "Aadhaar Card or Photo ID of primary contractor", required: true },
      { code: "WORK_LAYOUT_PLAN", title: "Interior Layout / Plan Drawing", description: "Architectural sketch or layout plan showing proposed work", required: false },
    ],
  },
  {
    code: "other_permission",
    title: "Other Society Permission",
    description: "Request special society approval for terrace access, clubhouse private booking, solar net-metering or EV charger installation.",
    category: "PERMISSIONS",
    eligibility: "BOTH",
    requiresOwnerAuthorization: true,
    estimatedProcessingDays: 5,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "permissionType", label: "Permission Category", type: "select", required: true, options: ["EV Charger Installation in Parking", "Rooftop Solar Net-Metering Access", "Clubhouse / Community Hall Reservation", "Commercial Filming / Photography", "Other"] },
      { id: "eventDate", label: "Event / Installation Proposed Date", type: "date", required: true },
      { id: "justification", label: "Detailed Request Justification", type: "textarea", required: true, placeholder: "Explain your technical or personal requirement" },
    ],
    requiredDocuments: [
      { code: "TECHNICAL_SPEC", title: "Equipment / Agency Specification Sheet", description: "Technical approval or vendor specification", required: false },
    ],
  },

  // 5. General
  {
    code: "document_copy_request",
    title: "Document Copy Request",
    description: "Request authenticated copies of society registration certificate, sanctioned architectural plans or audited accounts.",
    category: "GENERAL",
    eligibility: "BOTH",
    requiresOwnerAuthorization: false,
    estimatedProcessingDays: 5,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "requestedDocumentName", label: "Document Name / Record Description", type: "text", required: true, placeholder: "e.g. Sanctioned Floor Blueprint, Society Bye-laws Copy" },
      { id: "purposeOfRequest", label: "Legal / Banking Purpose", type: "text", required: true, placeholder: "e.g. Resale verification, Bank home loan file" },
      { id: "formatPreference", label: "Format Preference", type: "select", required: true, options: ["Digital PDF through Vault", "Physical Certified Hardcopy"] },
    ],
    requiredDocuments: [],
  },
  {
    code: "general_application",
    title: "General Application / Letter Request",
    description: "Formal written petition, grievance or query submitted directly to the Managing Committee.",
    category: "GENERAL",
    eligibility: "BOTH",
    requiresOwnerAuthorization: false,
    estimatedProcessingDays: 7,
    isActive: true,
    isDownstreamAvailable: true,
    requiredFields: [
      { id: "subject", label: "Application Subject Line", type: "text", required: true, placeholder: "e.g. Request for additional parking slot allocation" },
      { id: "bodyText", label: "Application Body / Representation", type: "textarea", required: true, placeholder: "State your complete query, grievance or formal representation" },
      { id: "urgencyLevel", label: "Urgency Level", type: "select", required: true, options: ["Normal (Standard 7 Days)", "Urgent (Need within 48 Hours)"] },
    ],
    requiredDocuments: [
      { code: "REPRESENTATION_PROOF", title: "Supporting Evidence / Photographs", description: "Any relevant photographs, correspondence or bills", required: false },
    ],
  },
];
