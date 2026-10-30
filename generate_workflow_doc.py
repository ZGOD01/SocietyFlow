import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_document():
    doc = Document()

    # Set page margins (0.75 in all sides)
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    # Palette
    COLOR_PRIMARY = RGBColor(79, 70, 229)     # Indigo #4F46E5
    COLOR_SECONDARY = RGBColor(15, 23, 42)   # Dark Slate #0F172A
    COLOR_MUTED = RGBColor(100, 116, 139)    # Slate #64748B
    COLOR_SUCCESS = RGBColor(16, 185, 129)   # Emerald #10B981
    COLOR_WARNING = RGBColor(245, 158, 11)   # Amber #F59E0B
    COLOR_DANGER = RGBColor(239, 68, 68)     # Rose #EF4444

    HEX_PRIMARY = "4F46E5"
    HEX_LIGHT_BG = "F8FAFC"
    HEX_BORDER = "E2E8F0"
    HEX_ACCENT_BG = "EEF2FF"

    # Helpers
    def set_cell_background(cell, hex_color):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def add_callout(text, title="KEY WORKFLOW RULE", hex_bg="EEF2FF", hex_border="4F46E5"):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        cell = table.cell(0, 0)
        cell.width = Inches(7.0)
        set_cell_background(cell, hex_bg)
        set_cell_margins(cell, top=140, bottom=140, left=200, right=200)

        # Left border only
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="single" w:sz="36" w:space="0" w:color="{hex_border}"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>')
        tcPr.append(borders)

        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        r_title = p.add_run(f"📌 {title}: ")
        r_title.bold = True
        r_title.font.size = Pt(10)
        r_title.font.color.rgb = COLOR_PRIMARY

        r_text = p.add_run(text)
        r_text.font.size = Pt(9.5)
        r_text.font.color.rgb = COLOR_SECONDARY
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # ─────────────────────────────────────────────────────────────
    # COVER / HEADER TITLE
    # ─────────────────────────────────────────────────────────────
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(12)
    title_p.paragraph_format.space_after = Pt(2)
    r1 = title_p.add_run("SocietyFlow")
    r1.bold = True
    r1.font.size = Pt(26)
    r1.font.color.rgb = COLOR_PRIMARY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(8)
    r2 = sub_p.add_run("Complete System & Dashboard Workflow Guide")
    r2.bold = True
    r2.font.size = Pt(16)
    r2.font.color.rgb = COLOR_SECONDARY

    desc_p = doc.add_paragraph()
    desc_p.paragraph_format.space_after = Pt(16)
    r3 = desc_p.add_run("Executive Architecture • Multi-Role Dashboards • Approval & Decline Decision Engine • Document Vault Lifecycle • MCS Act 1960 Statutory Compliance")
    r3.font.size = Pt(10)
    r3.font.color.rgb = COLOR_MUTED

    # Divider line
    div_p = doc.add_paragraph()
    div_p.paragraph_format.space_after = Pt(14)
    pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="18" w:space="1" w:color="{HEX_PRIMARY}"/></w:pBdr>')
    div_p._p.get_or_add_pPr().append(pBdr)

    # ─────────────────────────────────────────────────────────────
    # SECTION 1: SYSTEM OVERVIEW & THE 5 USER ROLES
    # ─────────────────────────────────────────────────────────────
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(4)
    run_h1 = h1.add_run("1. System Overview & Multi-Role Architecture")
    run_h1.bold = True
    run_h1.font.size = Pt(14)
    run_h1.font.color.rgb = COLOR_PRIMARY

    doc.add_paragraph(
        "SocietyFlow is an enterprise digital governance and document management platform built for Cooperative Housing Societies "
        "governed by the Maharashtra Co-operative Societies (MCS) Act 1960. The system enforces zero-trust role segregation, "
        "dual-key multi-party verification (Owner + Society Management), and Cloudflare R2 encrypted cloud document vaults."
    )

    # Roles Table
    roles_table = doc.add_table(rows=6, cols=3)
    roles_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    roles_table.autofit = False

    col_widths = [Inches(1.8), Inches(2.2), Inches(3.0)]
    headers = ["Role / Persona", "Primary Responsibility", "Key Accessible Screens & Routes"]

    hdr_cells = roles_table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], HEX_PRIMARY)
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=150, right=150)
        p = hdr_cells[i].paragraphs[0]
        r = p.add_run(title)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    role_data = [
        ("Property Owner (RESIDENT_OWNER)", "Title deed ownership, self-occupancy or lease oversight, voting rights", "/dashboard, /profile, /my-flat, /documents, /services, /requests"),
        ("Tenant Resident (TENANT)", "Lease agreement occupancy, service NOCs, maintenance complaints", "/dashboard, /profile, /my-flat, /documents, /services, /requests"),
        ("Society Management (SOCIETY_ADMIN)", "Managing Committee (Secretary, Chairman, Treasurer), statutory approvals & ledger", "/dashboard, /profile, /management/dashboard, /management/flats, /management/approvals, /management/requests, /management/society"),
        ("Super Administrator (SUPER_ADMIN)", "Platform-wide master administration, society onboarding, root requests", "/admin/dashboard, /admin/requests"),
        ("Statutory Auditor (AUDITOR_PARTNER)", "Financial audits, compliance oversight, referral & fee tracking", "/dashboard, /partner/dashboard, /society-documents, /notifications"),
    ]

    for row_idx, data in enumerate(role_data, start=1):
        row_cells = roles_table.rows[row_idx].cells
        bg_col = "FFFFFF" if row_idx % 2 == 1 else HEX_LIGHT_BG
        for col_idx in range(3):
            row_cells[col_idx].width = col_widths[col_idx]
            set_cell_background(row_cells[col_idx], bg_col)
            set_cell_margins(row_cells[col_idx], top=90, bottom=90, left=130, right=130)
            p = row_cells[col_idx].paragraphs[0]
            r = p.add_run(data[col_idx])
            r.font.size = Pt(8.5)
            if col_idx == 0:
                r.bold = True
                r.font.color.rgb = COLOR_SECONDARY

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ─────────────────────────────────────────────────────────────
    # SECTION 2: REGISTRATION & LOGIN WORKFLOW
    # ─────────────────────────────────────────────────────────────
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(4)
    run_h2 = h2.add_run("2. Registration & Authentication Lifecycle")
    run_h2.bold = True
    run_h2.font.size = Pt(14)
    run_h2.font.color.rgb = COLOR_PRIMARY

    doc.add_paragraph(
        "SocietyFlow enforces a rigorous 3-step verification funnel to ensure that unauthorized individuals cannot access "
        "society ledgers or proprietary resident records."
    )

    steps = [
        ("Step 1: Account Credentials", "Applicant submits Full Legal Name (must match government ID), Email Address (login identifier), Secure Password (hashed with bcryptjs), and Mobile Phone Number."),
        ("Step 2: Role & Unit Association", "Applicant selects their role: \n• Owner: Selects Society by Code (e.g. ABC/DEF/001), Wing, Flat Number, and Ownership Classification (Sole Title Owner or Joint Owner).\n• Tenant: Enters Society Code, Wing, Flat Number, Landlord Name & Contact, and Lease Commencement Date.\n• Society Management: Enters Intended Committee Position (Secretary, Chairman, etc.), Resolution Number, and Society setup data."),
        ("Step 3: Staged Approval Queue", "Upon form submission, the system records a RegistrationRequest with status PENDING_APPROVAL and redirects the user to /pending-approval. At this stage, the user is locked out of operational dashboards until Society Management grants committee authorization.")
    ]

    for title, desc in steps:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(4)
        rt = p.add_run(f"• {title}: ")
        rt.bold = True
        rt.font.color.rgb = COLOR_PRIMARY
        rt.font.size = Pt(9.5)
        rd = p.add_run(desc)
        rd.font.size = Pt(9.5)

    add_callout(
        "Applicants cannot skip approval to access flat records. The system's Next.js middleware enforces strict role guards: "
        "if a user's SocietyMembership is PENDING, all attempts to load /my-flat, /documents, or /management/* are redirected "
        "to /pending-approval until approved.",
        title="SECURITY ENFORCEMENT"
    )

    # ─────────────────────────────────────────────────────────────
    # SECTION 3: DASHBOARDS & NAVIGATION BREAKDOWN
    # ─────────────────────────────────────────────────────────────
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(4)
    run_h3 = h3.add_run("3. Complete Breakdown of Dashboards")
    run_h3.bold = True
    run_h3.font.size = Pt(14)
    run_h3.font.color.rgb = COLOR_PRIMARY

    dashboards = [
        ("A. Overview Dashboard (/dashboard)", [
            "Universal landing console visible to Residents, Management Officers, and Auditors.",
            "Displays high-level statistics: Verified Membership Status, Active Unit Allotment, Pending Requests count, and recent society announcements.",
            "Includes Quick-Action tiles to raise service requests, download documents, or inspect flat profiles."
        ]),
        ("B. Profile Dashboard (/profile)", [
            "Positioned immediately below Overview in the sidebar navigation across all dashboards.",
            "Section 1 (Account Credentials): Full Legal Name, Email, Mobile Phone, Argon2/BCrypt security status, Member Enrollment Date.",
            "Section 2 (Role & Association): Society Name, Code, Registration ID, Unit Allotment (Wing, Flat #, Floor, BHK), and Ownership Classification (Sole Title Owner / Joint Owner) or Committee Designation.",
            "Section 3 (Statutory Documents): Real-time listing of uploaded onboarding documents with inline file preview and download.",
            "Section 4 (Private Vault Summary): Metrics for encrypted personal files stored outside management scrutiny."
        ]),
        ("C. Property Owner Dashboard (/my-flat & /documents)", [
            "My Flat (/my-flat): Live unit profile, registered carpet area, share certificate issuance state, and tenant summary (if rented).",
            "Property Documents Vault: Verified Sale Deeds, Possession Letters, and Share Certificates.",
            "Services & Requests (/services, /requests): Catalogue to apply for Sale NOC, Renovation NOC, or Address Proof, and live tracking of Managing Committee decisions."
        ]),
        ("D. Tenant Resident Dashboard (/my-flat & /documents)", [
            "My Flat (/my-flat): Lease duration, landlord contact credentials, and registered tenancy records.",
            "Tenant Vault (/documents): Displays ONLY tenant records (Leave & License, Police Verification, ID Proof).",
            "Strict Document Isolation: Owner Sale Deeds and Share Certificates are completely hidden from tenants."
        ]),
        ("E. Society Management Console (/management/*)", [
            "Management Console (/management/dashboard): Society KPIs, occupancy rates, financial metrics, and statutory compliance status.",
            "Flats & Residents (/management/flats): Visual grid of all wings and flats, live occupancy indicators (Owner Occupied, Tenant Occupied, Vacant), and slide-out resident inspection drawer.",
            "Approvals (/management/approvals): Central statutory queue for resident registrations and document verifications.",
            "Request Inbox (/management/requests): Committee processing desk for NOC applications and maintenance complaints.",
            "Society Profile (/management/society): Society legal name, registration number, bank accounts, and Managing Committee composition."
        ])
    ]

    for title, points in dashboards:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        rt = p.add_run(title)
        rt.bold = True
        rt.font.size = Pt(11)
        rt.font.color.rgb = COLOR_SECONDARY

        for pt in points:
            pp = doc.add_paragraph()
            pp.paragraph_format.left_indent = Inches(0.2)
            pp.paragraph_format.space_after = Pt(2)
            bullet = pp.add_run("• ")
            bullet.font.color.rgb = COLOR_PRIMARY
            rpt = pp.add_run(pt)
            rpt.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ─────────────────────────────────────────────────────────────
    # SECTION 4: APPROVAL & DECLINE REQUEST LIFECYCLE
    # ─────────────────────────────────────────────────────────────
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(4)
    run_h4 = h4.add_run("4. Approval & Decline Request Workflows")
    run_h4.bold = True
    run_h4.font.size = Pt(14)
    run_h4.font.color.rgb = COLOR_PRIMARY

    doc.add_paragraph(
        "SocietyFlow provides an automated decision lifecycle for two critical governance flows: (1) Resident Registration & Document Onboarding, and (2) Resident Service & NOC Applications."
    )

    # Approvals Table
    app_table = doc.add_table(rows=4, cols=4)
    app_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    app_table.autofit = False

    t_widths = [Inches(1.5), Inches(1.8), Inches(1.8), Inches(1.9)]
    t_hdrs = ["Workflow Stage", "Officer Action: Approve", "Officer Action: Decline / Reject", "Officer Action: Request Info"]

    hdr_c = app_table.rows[0].cells
    for i, title in enumerate(t_hdrs):
        hdr_c[i].width = t_widths[i]
        set_cell_background(hdr_c[i], HEX_PRIMARY)
        set_cell_margins(hdr_c[i], top=120, bottom=120, left=150, right=150)
        p = hdr_c[i].paragraphs[0]
        r = p.add_run(title)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    app_data = [
        ("1. Registration Request (/management/approvals)", 
         "Status -> APPROVED.\nUnlocks Document Onboarding screen for resident.\nAuto-attaches society membership.",
         "Status -> REJECTED.\nApplicant denied access.\nDetailed rejection reason sent via notification.",
         "Status -> MORE_INFO.\nApplicant asked to correct flat number, wing, or contact info."),
        ("2. Document Verification (/management/approvals)",
         "Status -> VERIFIED.\nLocks deed to Flat Vault permanently.\nActivates member dashboard access.",
         "Status -> REJECTED.\nInvalid document marked invalid with statutory note.",
         "Status -> CORRECTION_REQ.\nResident notified to re-upload clear legible copy."),
        ("3. Service & NOC Requests (/management/requests)",
         "Status -> APPROVED.\nSystem generates official A4 PDF certificate with QR code verification.",
         "Status -> REJECTED.\nDecision stamped with committee resolution and reason.",
         "Status -> IN_PROGRESS.\nAssigned to officer with internal remarks and resolution notes.")
    ]

    for row_idx, data in enumerate(app_data, start=1):
        row_cells = app_table.rows[row_idx].cells
        bg_col = "FFFFFF" if row_idx % 2 == 1 else HEX_LIGHT_BG
        for col_idx in range(4):
            row_cells[col_idx].width = t_widths[col_idx]
            set_cell_background(row_cells[col_idx], bg_col)
            set_cell_margins(row_cells[col_idx], top=90, bottom=90, left=130, right=130)
            p = row_cells[col_idx].paragraphs[0]
            r = p.add_run(data[col_idx])
            r.font.size = Pt(8.5)
            if col_idx == 0:
                r.bold = True
                r.font.color.rgb = COLOR_SECONDARY

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ─────────────────────────────────────────────────────────────
    # SECTION 5: DOCUMENT UPLOAD & VAULT LIFECYCLE
    # ─────────────────────────────────────────────────────────────
    h5 = doc.add_paragraph()
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(4)
    run_h5 = h5.add_run("5. Document Upload & Storage Steps (Cloudflare R2)")
    run_h5.bold = True
    run_h5.font.size = Pt(14)
    run_h5.font.color.rgb = COLOR_PRIMARY

    doc.add_paragraph(
        "SocietyFlow utilizes an enterprise dual-storage architecture powered by Cloudflare R2 object storage with an automatic "
        "in-memory buffer fallback to prevent downtime during network interruptions."
    )

    doc_steps = [
        ("Step 1: Onboarding Document Checklist", "Once registration is approved, the resident is directed to their mandatory document onboarding screen:\n• Property Owners upload: (1) Registered Sale Deed / Agreement, (2) Possession Letter, (3) Society Share Certificate.\n• Tenants upload: (1) Registered Leave & License Agreement, (2) Police Verification Certificate, (3) Government Photo ID."),
        ("Step 2: Client-Side Drag & Drop or Browse", "Residents select PDF or image files (JPG, PNG) up to 25 MB per document. The interface displays real-time upload progress, file size validation, and statutory category tagging."),
        ("Step 3: Secure Presigned S3/R2 Ingestion", "The upload API (/api/onboarding/upload-document or /api/documents) generates a unique SHA-256 encrypted object key and streams the file securely to Cloudflare R2."),
        ("Step 4: Managing Committee Review & Vault Allotment", "Uploaded documents are marked as PENDING review. Society Management inspects the file inline via high-resolution PDF/image viewer and marks it VERIFIED. Upon verification, the documents are permanently archived in the Property Documents Vault (/my-flat and /documents)."),
        ("Step 5: Personal Private Vault", "Residents can also upload private personal documents (e.g. tax returns, insurance policies, Aadhaar) into 'My Documents (Personal Vault)'. These files are marked with PRIVATE scope and are cryptographically inaccessible to Society Management.")
    ]

    for title, desc in doc_steps:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(4)
        rt = p.add_run(f"• {title}: ")
        rt.bold = True
        rt.font.color.rgb = COLOR_PRIMARY
        rt.font.size = Pt(9.5)
        rd = p.add_run(desc)
        rd.font.size = Pt(9.5)

    add_callout(
        "Tenant Vault Isolation: Under MCS Act 1960 tenancy privacy guidelines, tenants are strictly prevented from viewing "
        "or downloading the Owner's Sale Deed, Title Conveyance, or Share Certificate. The API filters documents by ownerUserId "
        "and category exclusions ($nin: ['SHARE_CERTIFICATE', 'SALE_DEED', 'POSSESSION_LETTER']) whenever a tenant session requests vault records.",
        title="TENANT DOCUMENT ISOLATION"
    )

    # ─────────────────────────────────────────────────────────────
    # SECTION 6: SUMMARY QUICK-REFERENCE TABLE
    # ─────────────────────────────────────────────────────────────
    h6 = doc.add_paragraph()
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(4)
    run_h6 = h6.add_run("6. Quick-Reference Governance Matrix")
    run_h6.bold = True
    run_h6.font.size = Pt(14)
    run_h6.font.color.rgb = COLOR_PRIMARY

    matrix_table = doc.add_table(rows=6, cols=5)
    matrix_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    matrix_table.autofit = False

    m_widths = [Inches(1.4), Inches(1.2), Inches(1.4), Inches(1.4), Inches(1.6)]
    m_hdrs = ["User Role", "Dashboard Route", "Can Upload Deeds?", "Can Issue Approvals?", "Vault Access Scope"]

    hdr_m = matrix_table.rows[0].cells
    for i, title in enumerate(m_hdrs):
        hdr_m[i].width = m_widths[i]
        set_cell_background(hdr_m[i], HEX_PRIMARY)
        set_cell_margins(hdr_m[i], top=120, bottom=120, left=150, right=150)
        p = hdr_m[i].paragraphs[0]
        r = p.add_run(title)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    matrix_data = [
        ("Property Owner", "/dashboard\n/my-flat", "Yes (Owner Deeds & Personal Vault)", "No (Submits NOC Requests)", "Personal Vault + Flat Property Vault"),
        ("Tenant Resident", "/dashboard\n/my-flat", "Yes (Lease & Police Verification)", "No (Submits Complaints)", "Personal Vault + Lease Records Only"),
        ("Society Management", "/management/*\n/dashboard", "Yes (Society Records & Minutes)", "Yes (Full Approval & Rejection Authority)", "All Flats Property Vaults + Society Library"),
        ("Super Admin", "/admin/dashboard", "Platform Configs", "Yes (Approves New Societies)", "Platform Infrastructure Ledgers"),
        ("Auditor Partner", "/partner/dashboard", "Audit Statements", "Audit Verification", "Society Library & Audit Statements")
    ]

    for row_idx, data in enumerate(matrix_data, start=1):
        row_cells = matrix_table.rows[row_idx].cells
        bg_col = "FFFFFF" if row_idx % 2 == 1 else HEX_LIGHT_BG
        for col_idx in range(5):
            row_cells[col_idx].width = m_widths[col_idx]
            set_cell_background(row_cells[col_idx], bg_col)
            set_cell_margins(row_cells[col_idx], top=90, bottom=90, left=130, right=130)
            p = row_cells[col_idx].paragraphs[0]
            r = p.add_run(data[col_idx])
            r.font.size = Pt(8.5)
            if col_idx == 0:
                r.bold = True
                r.font.color.rgb = COLOR_SECONDARY

    # Footer note
    footer_p = doc.add_paragraph()
    footer_p.paragraph_format.space_before = Pt(20)
    footer_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    rf = footer_p.add_run("Generated by SocietyFlow Digital Governance Engine • MCS Act 1960 Compliant")
    rf.font.size = Pt(8.5)
    rf.font.italic = True
    rf.font.color.rgb = COLOR_MUTED

    output_path = r"c:\Users\Dell-478\OneDrive\Desktop\SocietyFlow\SocietyFlow_Workflow_Guide.docx"
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    create_document()

