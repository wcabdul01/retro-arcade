"""Frame the raw 480x1040 game captures (from capture_screenshots.mjs) into
store-sized screenshots with a caption, in the app's own palette/font.

Run from the repo root:
    python tools/store-assets/compose_screenshots.py

Writes:
  - tools/store-assets/screenshots/appgallery/*.png  (1080x1920, 9:16)
  - tools/store-assets/screenshots/appstore/*.png    (1320x2868, iPhone 6.9")
"""

import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
RAW_DIR = os.path.join(HERE, "screenshots", "hires-raw")
FONT_PATH = os.path.join(ROOT, "public", "fonts", "PressStart2P-Regular.ttf")

# Matches src/config/AppConfig.ts (GB.*).
LIGHTEST = (0xAB, 0xB1, 0x8C)
LIGHT = (0x7E, 0x85, 0x62)
DARK = (0x54, 0x5A, 0x41)
DARKEST = (0x16, 0x17, 0x0F)

# (raw capture name, caption lines) -- order is the store order.
SHOTS = [
    ("00-hub", ["10 CLASSIC GAMES", "ONE ARCADE"]),
    ("02-block-drop", ["STACK AND", "CLEAR THE LINES"]),
    ("01-brick-breaker", ["BOUNCE, BREAK,", "CLEAR THE BOARD"]),
    ("05-tank-war", ["BLAST THROUGH", "WALLS AND FOES"]),
    ("09-sudoku", ["SUDOKU WITH", "5 DIFFICULTIES"]),
    ("10-solitaire", ["CLASSIC", "SOLITAIRE"]),
    ("07-star-defender", ["HOLD THE LINE", "AGAINST THE FLEET"]),
    ("06-racing", ["DODGE TRAFFIC,", "SURVIVE THE LANES"]),
]

TARGETS = {
    "appgallery": (1080, 1920),
    "appstore": (1320, 2868),
}


def grid_texture(img: Image.Image, spacing: int) -> None:
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    w, h = img.size
    for x in range(0, w, spacing):
        d.line([(x, 0), (x, h)], fill=(22, 23, 15, 20))
    for y in range(0, h, spacing):
        d.line([(0, y), (w, y)], fill=(22, 23, 15, 20))
    img.alpha_composite(overlay)


def compose(raw: Image.Image, caption: list, size: tuple) -> Image.Image:
    w, h = size
    img = Image.new("RGBA", size, LIGHT + (255,))
    grid_texture(img, spacing=max(12, w // 60))
    draw = ImageDraw.Draw(img)

    # Caption block: top ~15% of the frame.
    font_size = round(w * 0.05)
    font = ImageFont.truetype(FONT_PATH, font_size)
    line_gap = round(font_size * 0.7)
    top = round(h * 0.055)
    for i, line in enumerate(caption):
        bbox = draw.textbbox((0, 0), line, font=font)
        x = (w - (bbox[2] - bbox[0])) / 2
        draw.text((x, top + i * (font_size + line_gap)), line, font=font, fill=DARKEST)

    # Game frame below the caption, keeping the 480:1040 aspect.
    game_top = round(h * 0.17)
    bottom_margin = round(h * 0.035)
    game_h = h - game_top - bottom_margin
    game_w = round(game_h * raw.width / raw.height)
    game = raw.convert("RGB").resize((game_w, game_h), Image.Resampling.LANCZOS)
    border = max(6, w // 120)
    gx = (w - game_w) // 2
    draw.rectangle(
        [gx - border, game_top - border, gx + game_w + border - 1, game_top + game_h + border - 1],
        fill=DARKEST,
    )
    img.paste(game, (gx, game_top))
    return img.convert("RGB")


def main() -> None:
    for store, size in TARGETS.items():
        out_dir = os.path.join(HERE, "screenshots", store)
        os.makedirs(out_dir, exist_ok=True)
        for i, (name, caption) in enumerate(SHOTS, start=1):
            raw = Image.open(os.path.join(RAW_DIR, f"{name}.png"))
            compose(raw, caption, size).save(os.path.join(out_dir, f"{i:02d}-{name[3:]}.png"))
        print(f"Wrote {len(SHOTS)} screenshots to {out_dir} ({size[0]}x{size[1]})")


if __name__ == "__main__":
    main()
