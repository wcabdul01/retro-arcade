"""Generate Retro Arcade's app icon, adaptive-icon layers, and Play Store
feature graphic from the app's own palette/font — no external assets.

Run from the repo root:
    python tools/branding/generate_icons.py

Writes:
  - tools/branding/output/icon-master-1024.png       (design source)
  - tools/branding/output/icon-play-512.png           (Play Console upload)
  - tools/branding/output/feature-graphic-1024x500.png (Play Console upload)
  - android/app/src/main/res/mipmap-*/ic_launcher.png
  - android/app/src/main/res/mipmap-*/ic_launcher_round.png
  - android/app/src/main/res/mipmap-*/ic_launcher_foreground.png
"""

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(ROOT, "tools", "branding", "output")
FONT_PATH = os.path.join(ROOT, "public", "fonts", "PressStart2P-Regular.ttf")
RES_DIR = os.path.join(ROOT, "android", "app", "src", "main", "res")

# Muted olive/khaki LCD palette, matching src/config/AppConfig.ts (GB.*).
LIGHTEST = (0xAB, 0xB1, 0x8C, 255)
LIGHT = (0x7E, 0x85, 0x62, 255)
DARK = (0x54, 0x5A, 0x41, 255)
DARKEST = (0x16, 0x17, 0x0F, 255)

LEGACY_SIZES = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}
FOREGROUND_SIZES = {
    "mdpi": 108,
    "hdpi": 162,
    "xhdpi": 216,
    "xxhdpi": 324,
    "xxxhdpi": 432,
}


def draw_joystick(draw: ImageDraw.ImageDraw, cx: int, cy: int, s: float) -> None:
    """Draw a bold pixel-art joystick glyph centered at (cx, cy).

    `s` is a scale factor where s=1.0 matches the proportions tuned below
    against a 1024x1024 canvas. Uses only large simple shapes so the glyph
    stays crisp when downscaled to 48px.
    """
    # Base (trapezoid-ish rounded rect).
    base_w, base_h = 560 * s, 180 * s
    base_top = cy + 130 * s
    draw.rounded_rectangle(
        [cx - base_w / 2, base_top, cx + base_w / 2, base_top + base_h],
        radius=28 * s,
        fill=DARKEST,
    )
    # Stick.
    stick_w = 90 * s
    stick_top = cy - 170 * s
    draw.rounded_rectangle(
        [cx - stick_w / 2, stick_top, cx + stick_w / 2, base_top + 20 * s],
        radius=20 * s,
        fill=DARKEST,
    )
    # Ball.
    ball_r = 170 * s
    draw.ellipse(
        [cx - ball_r, cy - 170 * s - ball_r, cx + ball_r, cy - 170 * s + ball_r],
        fill=DARKEST,
    )
    # Highlight on the ball (pixel-art style: offset smaller circle).
    hi_r = 45 * s
    hi_cx = cx - 60 * s
    hi_cy = cy - 170 * s - 60 * s
    draw.ellipse(
        [hi_cx - hi_r, hi_cy - hi_r, hi_cx + hi_r, hi_cy + hi_r],
        fill=LIGHTEST,
    )


def bbox_of_alpha(img: Image.Image) -> tuple:
    return img.getbbox()


def make_master() -> Image.Image:
    """Opaque 1024x1024 icon: light-olive background + joystick glyph."""
    img = Image.new("RGBA", (1024, 1024), LIGHT)
    draw = ImageDraw.Draw(img)
    draw_joystick(draw, 512, 512, 1.0)
    return img


def make_foreground_layer() -> Image.Image:
    """Transparent 1024x1024 adaptive-icon foreground, glyph fit inside the
    ~66dp-of-108dp safe zone (626px-diameter circle centered at 512,512)."""
    # Draw at scale 1.0 on a scratch canvas to measure the glyph's bbox.
    scratch = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_joystick(ImageDraw.Draw(scratch), 512, 512, 1.0)
    left, top, right, bottom = bbox_of_alpha(scratch)
    half_w = max(512 - left, right - 512)
    half_h = max(512 - top, bottom - 512)
    corner_dist = (half_w**2 + half_h**2) ** 0.5
    safe_radius = 626 / 2
    scale = (safe_radius / corner_dist) * 0.92  # small extra margin
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_joystick(ImageDraw.Draw(fg), 512, 512, scale)
    return fg


def make_legacy(master: Image.Image, size: int) -> Image.Image:
    return master.resize((size, size), Image.Resampling.LANCZOS)


def make_round(master: Image.Image, size: int) -> Image.Image:
    big = master.resize((size * 4, size * 4), Image.Resampling.LANCZOS)
    mask = Image.new("L", big.size, 0)
    ImageDraw.Draw(mask).ellipse([0, 0, big.size[0], big.size[1]], fill=255)
    big.putalpha(mask)
    return big.resize((size, size), Image.Resampling.LANCZOS)


def make_foreground(fg_layer: Image.Image, size: int) -> Image.Image:
    return fg_layer.resize((size, size), Image.Resampling.LANCZOS)


def draw_grid_texture(img: Image.Image, spacing: int = 24, color=(0, 0, 0, 18)) -> None:
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    w, h = img.size
    for x in range(0, w, spacing):
        d.line([(x, 0), (x, h)], fill=color, width=1)
    for y in range(0, h, spacing):
        d.line([(0, y), (w, y)], fill=color, width=1)
    img.alpha_composite(overlay)


def make_feature_graphic() -> Image.Image:
    w, h = 1024, 500
    img = Image.new("RGBA", (w, h), LIGHT)
    draw_grid_texture(img)
    draw = ImageDraw.Draw(img)

    # Small joystick glyph on the left, inside the safe zone.
    draw_joystick(draw, 175, 250, 0.42)

    title = "RETRO ARCADE"
    tagline = "10 CLASSIC GAMES. ONE ARCADE."
    text_x = 340
    max_text_right = 974  # right edge of the 924x400 safe zone (50..974)

    # Shrink the title font until it fits within the safe zone's right edge.
    title_size = 64
    while title_size > 20:
        title_font = ImageFont.truetype(FONT_PATH, title_size)
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        if text_x + (title_bbox[2] - title_bbox[0]) <= max_text_right:
            break
        title_size -= 2
    tagline_font = ImageFont.truetype(FONT_PATH, 20)

    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_h = title_bbox[3] - title_bbox[1]
    draw.text((text_x, 190 - title_h), title, font=title_font, fill=DARKEST)
    draw.text((text_x, 250), tagline, font=tagline_font, fill=DARK)

    return img.convert("RGB")


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)

    master = make_master()
    master.save(os.path.join(OUT_DIR, "icon-master-1024.png"))

    play_icon = master.resize((512, 512), Image.Resampling.LANCZOS)
    play_icon.save(os.path.join(OUT_DIR, "icon-play-512.png"))

    feature = make_feature_graphic()
    feature.save(os.path.join(OUT_DIR, "feature-graphic-1024x500.png"))

    fg_layer = make_foreground_layer()

    for density, size in LEGACY_SIZES.items():
        mip_dir = os.path.join(RES_DIR, f"mipmap-{density}")
        os.makedirs(mip_dir, exist_ok=True)
        make_legacy(master, size).save(os.path.join(mip_dir, "ic_launcher.png"))
        make_round(master, size).save(os.path.join(mip_dir, "ic_launcher_round.png"))

    for density, size in FOREGROUND_SIZES.items():
        mip_dir = os.path.join(RES_DIR, f"mipmap-{density}")
        os.makedirs(mip_dir, exist_ok=True)
        make_foreground(fg_layer, size).save(
            os.path.join(mip_dir, "ic_launcher_foreground.png")
        )

    print("Done. Wrote:")
    print(f"  {OUT_DIR}\\icon-master-1024.png")
    print(f"  {OUT_DIR}\\icon-play-512.png")
    print(f"  {OUT_DIR}\\feature-graphic-1024x500.png")
    print(f"  {len(LEGACY_SIZES) * 2 + len(FOREGROUND_SIZES)} files under android/app/src/main/res/mipmap-*/")


if __name__ == "__main__":
    main()
