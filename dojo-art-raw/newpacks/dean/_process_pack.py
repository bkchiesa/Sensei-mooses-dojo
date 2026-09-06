#!/usr/bin/env python3
"""Scale Dean Pass-3 frames to catalog sizes and build contact sheets."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
MAGENTA = (255, 0, 255)
TARGET_H = 512
DEFEAT_W = 512
DEFEAT_RATIO = 1.70  # mid of 1.6–1.8


def snap_magenta(im: Image.Image) -> Image.Image:
    rgb = im.convert("RGB")
    px = rgb.load()
    w, h = rgb.size
    # Snap near-magenta chroma (corners + nearby) to exact #FF00FF
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if r > 200 and b > 200 and g < 80:
                px[x, y] = MAGENTA
    return rgb


def fit_height(im: Image.Image, height: int) -> Image.Image:
    w, h = im.size
    nw = max(1, round(w * height / h))
    return im.resize((nw, height), Image.Resampling.LANCZOS)


def process_defeat(im: Image.Image) -> Image.Image:
    w, h = im.size
    scale = DEFEAT_W / w
    nw, nh = DEFEAT_W, max(1, round(h * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    target_h = max(1, round(DEFEAT_W / DEFEAT_RATIO))
    if nh > target_h:
        top = (nh - target_h) // 2
        im = im.crop((0, top, nw, top + target_h))
    elif nh < target_h:
        canvas = Image.new("RGB", (nw, target_h), MAGENTA)
        canvas.paste(im, (0, (target_h - nh) // 2))
        im = canvas
    return im


def process_file(path: Path, kind: str) -> tuple[int, int]:
    im = snap_magenta(Image.open(path))
    if kind == "defeat":
        im = process_defeat(im)
    else:
        im = fit_height(im, TARGET_H)
    im.save(path, "PNG", optimize=True)
    return im.size


POSE_ROWS = [
    ("idle", ["fighter_dean_idle_01.png", "fighter_dean_idle_02.png", "fighter_dean_idle_03.png"]),
    ("punch", [f"fighter_dean_punch_{i:02d}.png" for i in range(4)]),
    ("kick", [f"fighter_dean_kick_{i:02d}.png" for i in range(4)]),
    ("jump", [f"fighter_dean_jump_{i:02d}.png" for i in range(4)]),
    ("block", [f"fighter_dean_block_{i:02d}.png" for i in range(2)]),
    ("crouch", [f"fighter_dean_crouch_{i:02d}.png" for i in range(2)]),
    ("sweep", [f"fighter_dean_sweep_{i:02d}.png" for i in range(4)]),
    ("hit", ["fighter_dean_hit_00.png"]),
    ("defeat", ["fighter_dean_defeat_00.png"]),
]


def cell(im: Image.Image, box: int) -> Image.Image:
    im = im.convert("RGB")
    w, h = im.size
    scale = min((box - 8) / w, (box - 8) / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (box, box), (32, 32, 32))
    canvas.paste(im, ((box - nw) // 2, (box - nh) // 2))
    return canvas


def contact(rows: list[tuple[str, list[str]]], out: Path, title: str) -> None:
    box = 280
    label_h = 28
    title_h = 48
    pad = 10
    cols = max(len(fs) for _, fs in rows)
    W = pad * 2 + cols * (box + pad) + 90
    H = title_h + pad + len(rows) * (box + label_h + pad)
    sheet = Image.new("RGB", (W, H), (18, 18, 18))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
        small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except OSError:
        font = ImageFont.load_default()
        small = font
    draw.text((pad, 12), title, fill=(255, 255, 255), font=font)
    y = title_h
    for name, files in rows:
        draw.text((pad, y + box // 2), name, fill=(220, 220, 220), font=small)
        x = 90
        for fn in files:
            p = ROOT / fn
            if not p.exists():
                x += box + pad
                continue
            c = cell(Image.open(p), box)
            sheet.paste(c, (x, y))
            draw.text((x + 6, y + box + 4), fn.replace("fighter_dean_", "").replace("ult_dean_", "ult_"), fill=(200, 200, 200), font=small)
            x += box + pad
        y += box + label_h + pad
    sheet.save(out, "PNG", optimize=True)
    print("wrote", out, sheet.size)


def main() -> None:
    sizes = {}
    for p in sorted(ROOT.glob("fighter_dean_*.png")):
        kind = "defeat" if "defeat" in p.name else "pose"
        sizes[p.name] = process_file(p, kind)
        print(p.name, sizes[p.name])
    for p in sorted(ROOT.glob("ult_dean_*.png")):
        sizes[p.name] = process_file(p, "ult")
        print(p.name, sizes[p.name])
    contact(POSE_ROWS, ROOT / "dean_pose_contact.png", "DEAN pose bar — Pass-3 / magenta #FF00FF")
    ult_rows = [
        ("ult 00-03", [f"ult_dean_{i:02d}.png" for i in range(4)]),
        ("ult 04-07", [f"ult_dean_{i:02d}.png" for i in range(4, 8)]),
        ("ult 08-11", [f"ult_dean_{i:02d}.png" for i in range(8, 12)]),
    ]
    contact(ult_rows, ROOT / "dean_ult_contact.png", "DEAN ult — KIAI / gold calligraphy brush")


if __name__ == "__main__":
    main()
