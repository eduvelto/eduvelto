#!/usr/bin/env python3
"""Generate iOS Apple touch startup (splash) images for Eduvelto PWA.

Source: the approved app icon (public/icons/icon-512.png — navy background,
white book, blue swoosh, gold star; approved palette, no green).
Background colour is sampled from the icon's own corner pixel so the icon
blends seamlessly into the splash. Wordmark "Eduvelto" in Star Gold below.
"""
from PIL import Image, ImageDraw, ImageFont
import os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, 'public', 'icons', 'icon-512.png')
OUT = os.path.join(HERE, 'public', 'splash')
os.makedirs(OUT, exist_ok=True)

# (filename, width, height, media-query label)
SIZES = [
    ('apple-splash-640x1136.png', 640, 1136, 'iPhone 5 / SE (1st gen)'),
    ('apple-splash-750x1334.png', 750, 1334, 'iPhone 6 / 7 / 8'),
    ('apple-splash-828x1792.png', 828, 1792, 'iPhone XR'),
    ('apple-splash-1125x2436.png', 1125, 2436, 'iPhone X / XS / 11 Pro'),
    ('apple-splash-1170x2532.png', 1170, 2532, 'iPhone 12 / 13 / 14'),
    ('apple-splash-1242x2688.png', 1242, 2688, 'iPhone XS Max / 11 Pro Max'),
    ('apple-splash-1284x2778.png', 1284, 2778, 'iPhone 12 / 13 / 14 Pro Max'),
    ('apple-splash-1536x2048.png', 1536, 2048, 'iPad 9.7 inch'),
    ('apple-splash-1668x2224.png', 1668, 2224, 'iPad Pro 10.5 inch'),
    ('apple-splash-2048x2732.png', 2048, 2732, 'iPad Pro 12.9 inch'),
]

GOLD = (241, 179, 8)  # Star Gold #F1B308

icon = Image.open(SRC).convert('RGB')
bg = icon.getpixel((0, 0))
print('icon bg sampled:', '#%02x%02x%02x' % bg)

FONT_PATHS = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
]

def load_font(px):
    for p in FONT_PATHS:
        try:
            return ImageFont.truetype(p, px)
        except OSError:
            continue
    return ImageFont.load_default()

for name, w, h, label in SIZES:
    img = Image.new('RGB', (w, h), bg)
    # Logo: ~30% of the smaller side, centred slightly above middle.
    side = int(min(w, h) * 0.30)
    logo = icon.resize((side, side), Image.LANCZOS)
    lx = (w - side) // 2
    ly = int(h * 0.36) - side // 2
    img.paste(logo, (lx, ly))
    # Wordmark below the logo.
    draw = ImageDraw.Draw(img)
    font_px = int(min(w, h) * 0.075)
    font = load_font(font_px)
    text = 'Eduvelto'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    ty = ly + side + int(min(w, h) * 0.06)
    draw.text(((w - tw) // 2, ty), text, font=font, fill=GOLD)
    path = os.path.join(OUT, name)
    img.save(path, 'PNG', optimize=True)
    print(f'{name} {w}x{h} ({label}) -> {os.path.getsize(path)} bytes')

print('done:', len(SIZES), 'splash images in', OUT)
