import os
from PIL import Image, ImageDraw, ImageFont

def generate_login_flowchart():
    width = 1400
    height = 920
    img = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Palette
    INDIGO = (79, 70, 229)       # #4F46E5
    DARK = (15, 23, 42)          # #0F172A
    SLATE = (100, 116, 139)      # #64748B
    LIGHT_BG = (248, 250, 252)   # #F8FAFC
    BORDER = (226, 232, 240)     # #E2E8F0
    EMERALD = (16, 185, 129)     # #10B981
    ROSE = (239, 68, 68)         # #EF4444
    AMBER = (245, 158, 11)       # #F59E0B
    SKY = (14, 165, 233)         # #0EA5E9
    ACCENT_BG = (238, 242, 255)  # #EEF2FF
    SUCCESS_BG = (236, 253, 245) # #ECFDF5
    AMBER_BG = (254, 243, 199)   # #FEF3C7
    SKY_BG = (240, 249, 255)     # #F0F9FF

    try:
        font_main_title = ImageFont.truetype("arialbd.ttf", 26)
        font_sub = ImageFont.truetype("arial.ttf", 15)
        font_box_title = ImageFont.truetype("arialbd.ttf", 18)
        font_box_body = ImageFont.truetype("arial.ttf", 14)
        font_pill = ImageFont.truetype("arialbd.ttf", 13)
        font_arrow = ImageFont.truetype("arialbd.ttf", 13)
    except:
        font_main_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_box_title = ImageFont.load_default()
        font_box_body = ImageFont.load_default()
        font_pill = ImageFont.load_default()
        font_arrow = ImageFont.load_default()

    # Draw Banner
    draw.text((40, 30), "SocietyFlow — Unified Login & Multi-Dashboard Interconnection", fill=INDIGO, font=font_main_title)
    draw.text((40, 68), "How a single authenticated login resolves credentials and connects the 3 distinct dashboard experiences", fill=SLATE, font=font_sub)
    draw.line([40, 95, 1360, 95], fill=BORDER, width=2)

    # Helper: draw box
    def draw_node(x, y, w, h, title, lines, fill_c, border_c, badge=None, badge_c=None, badge_bg=None):
        draw.rounded_rectangle([x, y, x + w, y + h], radius=14, fill=fill_c, outline=border_c, width=2)
        ty = y + 14
        if badge:
            bw = len(badge) * 9 + 18
            draw.rounded_rectangle([x + w - bw - 12, y + 10, x + w - 12, y + 32], radius=8, fill=badge_bg or ACCENT_BG)
            draw.text((x + w - bw - 2, y + 14), badge, fill=badge_c or INDIGO, font=font_pill)

        draw.text((x + 16, ty), title, fill=DARK, font=font_box_title)
        draw.line([x + 16, y + 42, x + w - 16, y + 42], fill=BORDER, width=1)
        by = y + 52
        for line in lines:
            draw.text((x + 16, by), line, fill=SLATE, font=font_box_body)
            by += 20

    # Helper: draw arrow
    def draw_arrow(x1, y1, x2, y2, label=None, label_c=INDIGO):
        draw.line([x1, y1, x2, y2], fill=INDIGO, width=2)
        if x1 == x2: # Vertical
            draw.polygon([(x2, y2), (x2 - 6, y2 - 10), (x2 + 6, y2 - 10)], fill=INDIGO)
            if label:
                draw.text((x1 + 8, (y1 + y2) // 2 - 8), label, fill=label_c, font=font_arrow)
        elif y1 == y2: # Horizontal
            if x2 > x1:
                draw.polygon([(x2, y2), (x2 - 10, y2 - 6), (x2 - 10, y2 + 6)], fill=INDIGO)
                if label:
                    draw.text(((x1 + x2) // 2 - 20, y1 - 18), label, fill=label_c, font=font_arrow)
            else:
                draw.polygon([(x2, y2), (x2 + 10, y2 - 6), (x2 + 10, y2 + 6)], fill=INDIGO)
                if label:
                    draw.text(((x1 + x2) // 2 - 20, y1 - 18), label, fill=label_c, font=font_arrow)

    # 1. TOP NODE: LOGIN FORM
    draw_node(500, 120, 400, 105, "1. Universal Login (/login)", 
              ["User enters Email & Password", "Bcrypt hash authentication check", "Rate-limit brute-force protection"], 
              (255, 255, 255), INDIGO, badge="SINGLE ENTRY", badge_c=INDIGO, badge_bg=ACCENT_BG)

    # Arrow Down to RBAC
    draw_arrow(700, 225, 700, 280, label="Verified Credentials")

    # 2. MIDDLE NODE: RBAC & MEMBERSHIP RESOLUTION
    draw_node(450, 280, 500, 115, "2. Session Engine & RBAC Router", 
              ["Queries: User, SocietyMembership, FlatOccupancy", "Evaluates membership status & onboarding checklist", "Directs session to role-specific dashboard"], 
              ACCENT_BG, INDIGO, badge="ROUTER", badge_c=INDIGO, badge_bg=(255, 255, 255))

    # Branch Arrows to the 3 Dashboards
    # Left Branch -> Society Management
    draw.line([700, 395, 700, 435], fill=INDIGO, width=2)
    draw.line([700, 435, 230, 435], fill=INDIGO, width=2)
    draw_arrow(230, 435, 230, 480, label="Role = Management", label_c=AMBER)

    # Center Branch -> Property Owner
    draw_arrow(700, 435, 700, 480, label="Role = Owner", label_c=INDIGO)

    # Right Branch -> Tenant Resident
    draw.line([700, 435, 1170, 435], fill=INDIGO, width=2)
    draw_arrow(1170, 435, 1170, 480, label="Role = Tenant", label_c=SKY)

    # 3. BOTTOM LEVEL: THE THREE DASHBOARDS
    # Dashboard 1: Society Management
    draw_node(40, 480, 380, 270, "🏢 Society Management Console", 
              ["Route: /management/dashboard",
               "",
               "• Flats & Residents Directory",
               "• Central Statutory Approvals Queue",
               "• Service & NOC Request Inbox",
               "• Society Profile & Library Archives",
               "",
               "Key Power: Verifies applicants, deeds,",
               "and issues stamped NOC certificates."], 
              (255, 255, 255), AMBER, badge="COMMITTEE", badge_c=AMBER, badge_bg=AMBER_BG)

    # Dashboard 2: Property Owner
    draw_node(510, 480, 380, 270, "🏠 Property Owner Dashboard", 
              ["Route: /dashboard & /my-flat",
               "",
               "• Flat Allotment & Unit Deed Details",
               "• Full Property Vault (Sale Deed, Share Cert)",
               "• Registered Tenant Summary",
               "• Raise Official NOC & Service Requests",
               "",
               "Key Power: Full voting rights, titles,",
               "and property governance control."], 
              (255, 255, 255), INDIGO, badge="TITLE OWNER", badge_c=INDIGO, badge_bg=ACCENT_BG)

    # Dashboard 3: Tenant Resident
    draw_node(980, 480, 380, 270, "🔑 Tenant Resident Dashboard", 
              ["Route: /dashboard?view=tenant",
               "",
               "• Lease Agreement Terms & Duration",
               "• Landlord / Owner Contact Info",
               "• Personal Vault (Leave & License, Police)",
               "• Submit Maintenance Complaints & NOCs",
               "",
               "Key Privacy: Strictly isolated from",
               "Owner deeds & title conveyances."], 
              (255, 255, 255), SKY, badge="TENANT", badge_c=SKY, badge_bg=SKY_BG)

    # 4. INTERCONNECTIVITY CONNECTIONS (BOTTOM AREA)
    # Connector line between Management and Owner (Approvals & NOCs)
    draw.rounded_rectangle([40, 775, 1360, 890], radius=14, fill=LIGHT_BG, outline=BORDER, width=1)
    draw.text((60, 792), "THREE-WAY DASHBOARD INTERCONNECTION WORKFLOW:", fill=DARK, font=font_box_title)

    int_lines = [
        ("1. Owner <-> Management:", "Owner submits Sale/Renovation NOC -> Appears in Management Request Inbox -> Management Approves & issues PDF.", INDIGO),
        ("2. Tenant <-> Management:", "Tenant registers Lease & Police Verif -> Management verifies in Approvals Queue -> Unlocks tenant access.", SKY),
        ("3. Owner <-> Tenant Link:", "Both connect to the same Unit # (e.g. A-101), but Tenant never sees Owner's confidential financial title deeds.", EMERALD),
    ]

    iy = 824
    for title, desc, col in int_lines:
        draw.text((60, iy), title, fill=col, font=font_pill)
        draw.text((260, iy), desc, fill=SLATE, font=font_sub)
        iy += 22

    out_file = r"c:\Users\Dell-478\OneDrive\Desktop\SocietyFlow\login_interconnection_diagram.png"
    img.save(out_file, "PNG")
    print(f"Login diagram saved at: {out_file}")

if __name__ == "__main__":
    generate_login_flowchart()
