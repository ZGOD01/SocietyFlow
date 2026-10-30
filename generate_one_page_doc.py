import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_one_page_visual_document():
    doc = Document()

    for section in doc.sections:
        section.top_margin = Inches(0.4)
        section.bottom_margin = Inches(0.4)
        section.left_margin = Inches(0.45)
        section.right_margin = Inches(0.45)

    COLOR_PRIMARY = RGBColor(79, 70, 229)    # #4F46E5
    COLOR_DARK = RGBColor(15, 23, 42)        # #0F172A
    COLOR_MUTED = RGBColor(100, 116, 139)    # #64748B
    HEX_PRIMARY = "4F46E5"
    HEX_LIGHT_BG = "F8FAFC"

    def set_cell_background(cell, hex_color):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=45, bottom=45, left=70, right=70):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    # 1. HEADER
    p_header = doc.add_paragraph()
    p_header.paragraph_format.space_before = Pt(0)
    p_header.paragraph_format.space_after = Pt(1)
    r_title = p_header.add_run("SocietyFlow — Account Creation & Approval Lifecycles")
    r_title.bold = True
    r_title.font.size = Pt(13)
    r_title.font.color.rgb = COLOR_PRIMARY

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(4)
    r_sub = p_sub.add_run("Visual Overview: Society Management, Property Owner & Tenant Onboarding Lifecycles")
    r_sub.font.size = Pt(8)
    r_sub.font.color.rgb = COLOR_MUTED

    # 2. EMBED ATTRACTIVE VISUAL DIAGRAM
    diagram_path = r"c:\Users\Dell-478\OneDrive\Desktop\SocietyFlow\societyflow_account_creation_flows.png"
    if os.path.exists(diagram_path):
        p_img = doc.add_paragraph()
        p_img.paragraph_format.space_before = Pt(0)
        p_img.paragraph_format.space_after = Pt(4)
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.add_picture(diagram_path, width=Inches(7.4))

    # 3. CONCISE WORKFLOW MATRIX
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(3)
    h1.paragraph_format.space_after = Pt(2)
    r1 = h1.add_run("Summary of the 3 Key Onboarding Funnels")
    r1.bold = True
    r1.font.size = Pt(9.5)
    r1.font.color.rgb = COLOR_PRIMARY

    table1 = doc.add_table(rows=4, cols=4)
    table1.alignment = WD_TABLE_ALIGNMENT.CENTER
    table1.autofit = False

    t1_widths = [Inches(1.6), Inches(2.0), Inches(2.0), Inches(1.8)]
    t1_hdrs = ["Account Type", "Waiting Approval On", "Mandatory Document Upload", "Landed Dashboard"]
    hdr1 = table1.rows[0].cells
    for i, title in enumerate(t1_hdrs):
        hdr1[i].width = t1_widths[i]
        set_cell_background(hdr1[i], HEX_PRIMARY)
        set_cell_margins(hdr1[i], top=40, bottom=40, left=70, right=70)
        p = hdr1[i].paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(title)
        run.bold = True
        run.font.size = Pt(7.5)
        run.font.color.rgb = RGBColor(255, 255, 255)

    t1_data = [
        ("Society Management", "Super Admin Dashboard (/admin/requests)", "Society registration certificate, bye-laws, and committee resolution", "/management/dashboard (Full management console activated)"),
        ("Property Owner", "Society Management Dashboard (/management/approvals)", "Sale Deed, Possession Letter, Society Share Certificate", "/dashboard & /my-flat (Property vault unlocked)"),
        ("Tenant Resident", "Dual Approval: 1. Flat Owner + 2. Society Management", "Leave & License Agreement, Police Verification, Govt ID", "/dashboard?view=tenant (Isolated from owner deeds)")
    ]

    for row_idx, (role, app, docs, land) in enumerate(t1_data, start=1):
        row_c = table1.rows[row_idx].cells
        bg_c = "FFFFFF" if row_idx % 2 == 1 else HEX_LIGHT_BG
        for i, val in enumerate([role, app, docs, land]):
            row_c[i].width = t1_widths[i]
            set_cell_background(row_c[i], bg_c)
            set_cell_margins(row_c[i], top=35, bottom=35, left=70, right=70)
            p = row_c[i].paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(val)
            r.font.size = Pt(7)
            if i == 0:
                r.bold = True
                r.font.color.rgb = COLOR_DARK

    # 4. FOOTER
    p_ftr = doc.add_paragraph()
    p_ftr.paragraph_format.space_before = Pt(4)
    p_ftr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    rf = p_ftr.add_run("SocietyFlow Digital Governance Engine • MCS Act 1960 Visual Flow Reference")
    rf.font.size = Pt(7)
    rf.font.italic = True
    rf.font.color.rgb = COLOR_MUTED

    output_path = r"c:\Users\Dell-478\OneDrive\Desktop\SocietyFlow\SocietyFlow_Workflow_Guide.docx"
    doc.save(output_path)
    print(f"Updated Word document successfully created at: {output_path}")

if __name__ == "__main__":
    create_one_page_visual_document()
