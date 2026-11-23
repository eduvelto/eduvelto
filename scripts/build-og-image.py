#!/usr/bin/env python3
"""Eduvelto OG image (1200x630) — 23 Nov 2026, feature/seo-50-100-pages.

Purpose-built social-preview image for Open Graph / Twitter cards
(SEO-009: the old og:image was public/logo.png, 2729x912, 386 KB,
with no width/height tags). Navy background, approved white logo
lockup, Bangla tagline, eduvelto.com in gold. No claims, no numbers.

Re-run: ~/workspace/.venv-img/bin/python scripts/build-og-image.py
Inputs: brand-assets/final/eduvelto-logo-white-transparent.png
Output: public/og-image.jpg (quality 88).
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
NAVY = (10, 31, 68)
GOLD = (245, 166, 35)
WHITE = (255, 255, 255)

BN_FONT = "/usr/share/fonts/truetype/noto/NotoSansBengali-Bold.ttf"
LATIN_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

img = Image.new("RGB", (W, H), NAVY)
draw = ImageDraw.Draw(img)

logo = Image.open(
    "../brand-assets/final/eduvelto-logo-white-transparent.png"
).convert("RGBA")
# Logo lockup: keep aspect, width 620.
lw = 620
lh = round(lw * logo.height / logo.width)
logo = logo.resize((lw, lh), Image.LANCZOS)
img.paste(logo, ((W - lw) // 2, 78), logo)

tagline = "শেখো, এগিয়ে যাও, স্বপ্ন গড়ো"
f_tag = ImageFont.truetype(BN_FONT, 46)
tw = draw.textlength(tagline, font=f_tag)
draw.text(((W - tw) / 2, 400), tagline, font=f_tag, fill=WHITE)

site = "eduvelto.com"
f_site = ImageFont.truetype(LATIN_FONT, 34)
sw = draw.textlength(site, font=f_site)
draw.text(((W - sw) / 2, 478), site, font=f_site, fill=GOLD)

# Gold bar at the bottom, as on the FB cover v3.
draw.rectangle([0, H - 10, W, H], fill=GOLD)

img.save("public/og-image.jpg", "JPEG", quality=88)
print("wrote public/og-image.jpg", img.size)
