"""Crop raw full-viewport captures down to just the game canvas region and
normalize to 24-bit PNG for the Play Store listing.

Run from the repo root:
    python tools/store-assets/crop_screenshots.py
"""

import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(HERE, "screenshots", "raw")
FINAL_DIR = os.path.join(HERE, "screenshots", "final")

# The real browser viewport was always 1920px wide, but its height varied
# between capture sessions (855-911px), which changes the canvas's display
# size/position (see __fixCanvas in the capture session: canvas is scaled to
# fill the full viewport height at the 480:1040 game aspect, centered
# horizontally). Screenshots are a uniform downscale of that real viewport
# (capture width / 1920). Recompute the crop box per-file from its actual
# dimensions rather than assuming one fixed box.
REAL_VIEWPORT_W = 1920
GAME_W, GAME_H = 480, 1040


def crop_box_for(img_w: int, img_h: int) -> tuple:
    scale_capture = img_w / REAL_VIEWPORT_W
    real_vh = img_h / scale_capture
    display_w = round(GAME_W * (real_vh / GAME_H))
    left = round((REAL_VIEWPORT_W - display_w) / 2)
    crop_left = round(left * scale_capture)
    crop_width = round(display_w * scale_capture)
    return (crop_left, 0, crop_left + crop_width, img_h)


def main() -> None:
    os.makedirs(FINAL_DIR, exist_ok=True)
    for name in sorted(os.listdir(RAW_DIR)):
        if not name.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        img = Image.open(os.path.join(RAW_DIR, name)).convert("RGB")
        box = crop_box_for(*img.size)
        cropped = img.crop(box)
        out_name = os.path.splitext(name)[0] + ".png"
        cropped.save(os.path.join(FINAL_DIR, out_name))
        print(f"{name} -> {out_name} {cropped.size}")


if __name__ == "__main__":
    main()
