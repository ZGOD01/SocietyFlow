from PIL import Image, ImageDraw, ImageFont
import os

def create_attractive_flow_diagram():
    # 1600 x 980 for ultra-crisp presentation
    width = 1600
    height = 980
    img = Image.new("RGBA", (width, height), (250, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    # Palette
    COLOR_TITLE = (15, 23, 42)        # Slate 900
    COLOR_SUB = (100, 116, 139)       # Slate 500
    BORDER_LIGHT = (226, 232, 240)    # Slate 200

    # Colors per flow
    # Flow 1: Society Mgmt -> Super Admin (Purple/Amber)
    F1_MAIN = (147, 51, 234)         # Purple 600
    F1_BG = (250, 245, 255)          # Purple 50
    F1_BORDER = (233, 213, 255)      # Purple 200
    F1_ACCENT = (217, 119, 6)        # Amber

    # Flow 2: Owner -> Society Mgmt (Indigo/Emerald)
    F2_MAIN = (79, 70, 229)          # Indigo 600
    F2_BG = (238, 242, 255)          # Indigo 50
    F2_BORDER = (199, 210, 254)      # Indigo 200
    F2_ACCENT = (16, 185, 129)       # Emerald

    # Flow 3: Tenant -> Dual Owner + Mgmt (Sky/Teal)
    F3_MAIN = (2, 132, 199)          # Sky 600
    F3_BG = (240, 249, 255)          # Sky 50
    F3_BORDER = (186, 230, 253)      # Sky 200
    F3_ACCENT = (13, 148, 136)       # Teal

    # Fonts
    try:
        font_main = ImageFont.truetype("arialbd.ttf", 32)
        font_sub = ImageFont.truetype("arial.ttf", 18)
        font_track_title = ImageFont.truetype("arialbd.ttf", 20)
        font_step_num = ImageFont.truetype("arialbd.ttf", 16)
        font_step_title = ImageFont.truetype("arialbd.ttf", 17)
        font_step_body = ImageFont.truetype("arial.ttf", 14)
        font_badge = ImageFont.truetype("arialbd.ttf", 13)
    except:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_track_title = ImageFont.load_default()
        font_step_num = ImageFont.load_default()
        font_step_title = ImageFont.load_default()
        font_step_body = ImageFont.load_default()
        font_badge = ImageFont.load_default()

    # HEADER BANNER
    draw.text((60, 35), "SocietyFlow — Complete Account Onboarding & Approval Lifecycle", fill=COLOR_TITLE, font=font_main)
    draw.text((60, 80), "Visual connection between Society Management, Property Owner, Tenant, and the Approving Dashboards", fill=COLOR_SUB, font=font_sub)
    draw.line([60, 115, 1540, 115], fill=BORDER_LIGHT, width=2)

    # HELPER: Draw step card
    def draw_step_card(x, y, w, h, step_str, title, lines, theme_col, bg_col, border_col, is_final=False):
        # Card Background
        card_fill = (255, 255, 255) if not is_final else bg_col
        draw.rounded_rectangle([x, y, x + w, y + h], radius=16, fill=card_fill, outline=border_col, width=2)

        # Step Pill
        draw.rounded_rectangle([x + 14, y + 14, x + 44, y + 44], radius=15, fill=theme_col)
        draw.text((x + 23, y + 18), step_str, fill=(255, 255, 255), font=font_step_num)

        # Title
        draw.text((x + 54, y + 18), title, fill=COLOR_TITLE, font=font_step_title)
        draw.line([x + 14, y + 54, x + w - 14, y + 54], fill=border_col, width=1)

        # Body
        by = y + 66
        for line in lines:
            draw.text((x + 16, by), line, fill=COLOR_SUB, font=font_step_body)
            by += 22

    # HELPER: Draw connecting arrow
    def draw_connecting_arrow(x1, y, x2, theme_col, label=""):
        mid_y = y
        draw.line([x1, mid_y, x2, mid_y], fill=theme_col, width=4)
        # Arrowhead
        draw.polygon([
            (x2, mid_y),
            (x2 - 14, mid_y - 9),
            (x2 - 14, mid_y + 9)
        ], fill=theme_col)
        if label:
            draw.text((x1 + 6, mid_y - 20), label, fill=theme_col, font=font_badge)

    # ─────────────────────────────────────────────────────────────
    # FLOW 1: SOCIETY MANAGEMENT -> SUPER ADMIN
    # ─────────────────────────────────────────────────────────────
    track1_y = 140
    # Track Background Container
    draw.rounded_rectangle([50, track1_y, 1550, track1_y + 240], radius=20, fill=F1_BG, outline=F1_BORDER, width=2)
    # Track Header Badge
    draw.rounded_rectangle([70, track1_y + 14, 460, track1_y + 46], radius=10, fill=F1_MAIN)
    draw.text((85, track1_y + 18), "FLOW 1: SOCIETY MANAGEMENT CREATION", fill=(255, 255, 255), font=font_track_title)

    card_y = track1_y + 60
    card_w = 295
    card_h = 160

    # Step 1: Mgmt Registers
    draw_step_card(70, card_y, card_w, card_h, "1", "Create Account", 
                   ["Society Manager / Secretary", "enters credentials, society name,", "wings & resolution number."], 
                   F1_MAIN, F1_BG, F1_BORDER)

    draw_connecting_arrow(365, card_y + 80, 435, F1_MAIN, "Submits")

    # Step 2: Waiting Approval (Super Admin)
    draw_step_card(435, card_y, card_w, card_h, "2", "Waiting Approval", 
                   ["Request routed to:", "SUPER ADMIN DASHBOARD", "(/admin/requests) for review."], 
                   F1_MAIN, F1_BG, F1_BORDER)

    draw_connecting_arrow(730, card_y + 80, 800, F1_MAIN, "Reviewed")

    # Step 3: Super Admin Approves
    draw_step_card(800, card_y, card_w, card_h, "3", "Super Admin Confirms", 
                   ["Super Admin inspects society,", "verifies registration ID, and", "clicks [APPROVE]."], 
                   F1_MAIN, F1_BG, F1_BORDER)

    draw_connecting_arrow(1095, card_y + 80, 1165, F1_MAIN, "Activated")

    # Step 4: Society Created & Dashboard Unlocked
    draw_step_card(1165, card_y, card_w + 50, card_h, "4", "Management Active!", 
                   ["🎉 Society is registered!", "Management lands on console", "(/management/dashboard) ready to", "approve owners & tenants."], 
                   F1_MAIN, (243, 232, 255), F1_MAIN, is_final=True)

    # ─────────────────────────────────────────────────────────────
    # FLOW 2: PROPERTY OWNER -> SOCIETY MANAGEMENT
    # ─────────────────────────────────────────────────────────────
    track2_y = 410
    draw.rounded_rectangle([50, track2_y, 1550, track2_y + 240], radius=20, fill=F2_BG, outline=F2_BORDER, width=2)
    draw.rounded_rectangle([70, track2_y + 14, 460, track2_y + 46], radius=10, fill=F2_MAIN)
    draw.text((85, track2_y + 18), "FLOW 2: PROPERTY OWNER ONBOARDING", fill=(255, 255, 255), font=font_track_title)

    card_y = track2_y + 60

    # Step 1: Owner Registers
    draw_step_card(70, card_y, card_w, card_h, "1", "Owner Registers", 
                   ["Enters Name, Email, Phone,", "selects Society Code, Wing,", "Flat # & Sole/Joint Owner."], 
                   F2_MAIN, F2_BG, F2_BORDER)

    draw_connecting_arrow(365, card_y + 80, 435, F2_MAIN, "Submits")

    # Step 2: Waiting Approval
    draw_step_card(435, card_y, card_w, card_h, "2", "Waiting Approval", 
                   ["Request routed to:", "SOCIETY MANAGEMENT", "(/management/approvals) queue."], 
                   F2_MAIN, F2_BG, F2_BORDER)

    draw_connecting_arrow(730, card_y + 80, 800, F2_MAIN, "Approved")

    # Step 3: Document Upload
    draw_step_card(800, card_y, card_w, card_h, "3", "Upload Documents", 
                   ["Owner uploads 3 deeds:", "• Registered Sale Deed", "• Possession Letter", "• Society Share Certificate."], 
                   F2_MAIN, F2_BG, F2_BORDER)

    draw_connecting_arrow(1095, card_y + 80, 1165, F2_MAIN, "Verified")

    # Step 4: Lands on Owner Dashboard
    draw_step_card(1165, card_y, card_w + 50, card_h, "4", "Owner Dashboard Active!", 
                   ["🏠 Lands on /dashboard & /my-flat", "• Property Vault unlocked", "• Flat status: Owner Occupied", "• Can apply for NOCs & services."], 
                   F2_MAIN, (224, 231, 255), F2_MAIN, is_final=True)

    # ─────────────────────────────────────────────────────────────
    # FLOW 3: TENANT -> DUAL OWNER & SOCIETY APPROVAL
    # ─────────────────────────────────────────────────────────────
    track3_y = 680
    draw.rounded_rectangle([50, track3_y, 1550, track3_y + 240], radius=20, fill=F3_BG, outline=F3_BORDER, width=2)
    draw.rounded_rectangle([70, track3_y + 14, 460, track3_y + 46], radius=10, fill=F3_MAIN)
    draw.text((85, track3_y + 18), "FLOW 3: TENANT RESIDENT ONBOARDING", fill=(255, 255, 255), font=font_track_title)

    card_y = track3_y + 60

    # Step 1: Tenant Registers
    draw_step_card(70, card_y, card_w, card_h, "1", "Tenant Registers", 
                   ["Enters Credentials, Society,", "Wing, Target Flat #, Landlord", "Name & Lease Start Date."], 
                   F3_MAIN, F3_BG, F3_BORDER)

    draw_connecting_arrow(365, card_y + 80, 435, F3_MAIN, "Submits")

    # Step 2: Dual Approval (Owner & Society)
    draw_step_card(435, card_y, card_w, card_h, "2", "Dual Approvals", 
                   ["Requires Approval by:", "1. Flat Owner (Landlord)", "2. Society Management", "(/management/approvals)"], 
                   F3_MAIN, F3_BG, F3_BORDER)

    draw_connecting_arrow(730, card_y + 80, 800, F3_MAIN, "Approved")

    # Step 3: Document Upload
    draw_step_card(800, card_y, card_w, card_h, "3", "Upload Documents", 
                   ["Tenant uploads mandatory docs:", "• Leave & License Agreement", "• Police Verification Copy", "• Government Photo ID."], 
                   F3_MAIN, F3_BG, F3_BORDER)

    draw_connecting_arrow(1095, card_y + 80, 1165, F3_MAIN, "Verified")

    # Step 4: Lands on Tenant Dashboard
    draw_step_card(1165, card_y, card_w + 50, card_h, "4", "Tenant Dashboard Active!", 
                   ["🔑 Lands on /dashboard?view=tenant", "• Lease duration active on /my-flat", "• Isolated from Owner title deeds", "• Can raise complaints & NOCs."], 
                   F3_MAIN, (224, 242, 254), F3_MAIN, is_final=True)

    # Save outputs
    out_file = r"c:\Users\Dell-478\OneDrive\Desktop\SocietyFlow\societyflow_account_creation_flows.png"
    img.save(out_file, "PNG")
    print(f"Attractive diagram saved to {out_file}")

if __name__ == "__main__":
    create_attractive_flow_diagram()

