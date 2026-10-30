import os
from PIL import Image, ImageDraw, ImageFont

def generate_flow_diagram():
    # Create high-res image for crisp print rendering (width: 1400px, height: 420px)
    width = 1400
    height = 420
    img = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Colors
    INDIGO = (79, 70, 229)       # #4F46E5
    DARK = (15, 23, 42)          # #0F172A
    SLATE = (100, 116, 139)      # #64748B
    LIGHT_BG = (248, 250, 252)   # #F8FAFC
    BORDER = (226, 232, 240)     # #E2E8F0
    EMERALD = (16, 185, 129)     # #10B981
    ROSE = (239, 68, 68)         # #EF4444
    ACCENT_BG = (238, 242, 255)  # #EEF2FF
    SUCCESS_BG = (236, 253, 245) # #ECFDF5

    # Try to load Windows system font or default font
    try:
        font_title = ImageFont.truetype("arialbd.ttf", 26)
        font_sub = ImageFont.truetype("arial.ttf", 18)
        font_badge = ImageFont.truetype("arialbd.ttf", 16)
        font_arrow = ImageFont.truetype("arialbd.ttf", 20)
    except:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_badge = ImageFont.load_default()
        font_arrow = ImageFont.load_default()

    # Step cards definition: (step_num, title, lines, x_start, badge_text, badge_color, badge_bg)
    steps = [
        ("1", "Registration", ["User fills Credentials,", "Role, Flat # & Wing", "Status: PENDING"], 40, "APPLICANT", INDIGO, ACCENT_BG),
        ("2", "Committee Review", ["Officer evaluates", "unit allotment in", "/management/approvals"], 320, "MANAGEMENT", INDIGO, ACCENT_BG),
        ("3", "Doc Onboarding", ["Upload 3 mandatory", "statutory property deeds", "(Encrypted S3/R2)"], 600, "RESIDENT", INDIGO, ACCENT_BG),
        ("4", "Deed Verification", ["Committee inspects", "deeds & title stamps in", "verification drawer"], 880, "COMMITTEE", INDIGO, ACCENT_BG),
        ("5", "Active Dashboard", ["Full Flat & Vault access.", "Tenants strictly isolated", "from owner deeds."], 1160, "VERIFIED", EMERALD, SUCCESS_BG),
    ]

    card_w = 200
    card_h = 240
    card_y = 70

    for step_num, title, lines, x, badge, b_col, b_bg in steps:
        # Card Background with border
        draw.rounded_rectangle([x, card_y, x + card_w, card_y + card_h], radius=16, fill=(255, 255, 255), outline=BORDER, width=2)

        # Header Pill (Step Number & Role Badge)
        draw.rounded_rectangle([x + 12, card_y + 14, x + 40, card_y + 42], radius=14, fill=INDIGO)
        draw.text((x + 20, card_y + 17), step_num, fill=(255, 255, 255), font=font_badge)

        draw.rounded_rectangle([x + 50, card_y + 14, x + card_w - 12, card_y + 42], radius=10, fill=b_bg)
        draw.text((x + 60, card_y + 20), badge, fill=b_col, font=font_badge)

        # Card Title
        draw.text((x + 14, card_y + 60), title, fill=DARK, font=font_title)

        # Divider line inside card
        draw.line([x + 14, card_y + 98, x + card_w - 14, card_y + 98], fill=BORDER, width=1)

        # Description text
        curr_y = card_y + 112
        for line in lines:
            draw.text((x + 14, curr_y), line, fill=SLATE, font=font_sub)
            curr_y += 28

        # Draw connecting arrow to next card
        if x < 1160:
            arrow_start_x = x + card_w + 8
            arrow_end_x = arrow_start_x + 64
            arrow_y = card_y + (card_h // 2)

            # Arrow line
            draw.line([arrow_start_x, arrow_y, arrow_end_x, arrow_y], fill=INDIGO, width=3)
            # Arrow head
            draw.polygon([
                (arrow_end_x, arrow_y),
                (arrow_end_x - 12, arrow_y - 8),
                (arrow_end_x - 12, arrow_y + 8)
            ], fill=INDIGO)

    # Bottom Decision outcomes banner
    draw.rounded_rectangle([40, 330, 1360, 400], radius=12, fill=ACCENT_BG, outline=BORDER, width=1)
    draw.text((60, 350), "APPROVAL ENGINE:", fill=INDIGO, font=font_title)
    draw.text((310, 352), "• APPROVED: Unlocks Onboarding & Live Vault", fill=EMERALD, font=font_sub)
    draw.text((750, 352), "• MORE INFO: Asks for corrections", fill=(217, 119, 6), font=font_sub)
    draw.text((1110, 352), "• REJECTED: Access denied", fill=ROSE, font=font_sub)

    out_file = r"c:\Users\Dell-478\OneDrive\Desktop\SocietyFlow\workflow_diagram.png"
    img.save(out_file, "PNG")
    print(f"Diagram saved at {out_file}")

if __name__ == "__main__":
    generate_flow_diagram()

