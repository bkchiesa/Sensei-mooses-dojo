#!/usr/bin/env python3
"""Snap magenta chroma, size Casper frames, and build contact sheets."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
SRC = Path("/opt/cursor/artifacts/assets")
CHROMA = (255, 0, 255)
PAD = 16

POSE_ROWS: list[tuple[str, list[str]]] = [
    ("idle", [f"fighter_casper_idle_{i:02d}.png" for i in (1, 2, 3)]),
    ("punch", [f"fighter_casper_punch_{i:02d}.png" for i in range(4)]),
    ("kick", [f"fighter_casper_kick_{i:02d}.png" for i in range(4)]),
    ("jump", [f"fighter_casper_jump_{i:02d}.png" for i in range(4)]),
    ("block", [f"fighter_casper_block_{i:02d}.png" for i in range(2)]),
    ("crouch", [f"fighter_casper_crouch_{i:02d}.png" for i in range(2)]),
    ("sweep", [f"fighter_casper_sweep_{i:02d}.png" for i in range(4)]),
    ("hit", ["fighter_casper_hit_00.png"]),
    ("defeat", ["fighter_casper_defeat_00.png"]),
]
ULT_FRAMES = [f"ult_casper_{i:02d}.png" for i in range(12)]
JUMP_PEAKS = {"fighter_casper_jump_01.png", "fighter_casper_jump_02.png"}


def chroma_mask(arr: np.ndarray) -> np.ndarray:
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    hot = (r >= 160) & (b >= 160) & (np.abs(r - b) <= 60) & (g <= np.minimum(r, b) - 6) & ((r + b) / 2 - g >= 35)
    already = (r == 255) & (g == 0) & (b == 255)
    return hot | already


def snap_chroma(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGB"))
    arr[chroma_mask(arr)] = CHROMA
    return Image.fromarray(arr, "RGB")


def content_bbox(im: Image.Image) -> tuple[int, int, int, int]:
    px = im.load()
    w, h = im.size
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if px[x, y] != CHROMA:
                if x < min_x:
                    min_x = x
                if y < min_y:
                    min_y = y
                if x > max_x:
                    max_x = x
                if y > max_y:
                    max_y = y
    if max_x < 0:
        return (0, 0, w, h)
    return (min_x, min_y, max_x + 1, max_y + 1)


def fit_frame(im: Image.Image, name: str) -> Image.Image:
    box = content_bbox(im)
    crop = im.crop(box)
    cw, ch = crop.size
    extra_bottom = 72 if name in JUMP_PEAKS else 0
    if name == "fighter_casper_defeat_00.png":
        scale = 512 / max(cw, 1)
        nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
        crop = crop.resize((nw, nh), Image.Resampling.LANCZOS)
        # Frame aspect ~1.7
        fw = nw + PAD * 2
        fh = max(round(fw / 1.7), nh + PAD * 2)
        out = Image.new("RGB", (fw, fh), CHROMA)
        out.paste(crop, ((fw - nw) // 2, (fh - nh) // 2))
        return out

    target_h = 440 if name in JUMP_PEAKS else 512
    scale = target_h / max(ch, 1)
    nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
    crop = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    fw = nw + PAD * 2
    fh = nh + PAD * 2 + extra_bottom
    out = Image.new("RGB", (fw, fh), CHROMA)
    out.paste(crop, (PAD, PAD))
    return out


def label_font(size: int):
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        p = Path(path)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def contact_sheet(
    rows: list[tuple[str, list[Path]]],
    dest: Path,
    cell: int = 220,
    label_h: int = 28,
) -> None:
    max_cols = max(len(files) for _, files in rows)
    sheet_w = 16 + max_cols * (cell + 8) + 120
    sheet_h = 16 + len(rows) * (cell + label_h + 12)
    sheet = Image.new("RGB", (sheet_w, sheet_h), (18, 18, 22))
    draw = ImageDraw.Draw(sheet)
    font = label_font(16)
    y = 12
    for row_name, files in rows:
        draw.text((12, y + 8), row_name, fill=(240, 240, 240), font=font)
        x = 110
        for path in files:
            im = Image.open(path).convert("RGB")
            # letterbox into cell
            scale = min(cell / im.size[0], cell / im.size[1])
            nw, nh = max(1, round(im.size[0] * scale)), max(1, round(im.size[1] * scale))
            thumb = im.resize((nw, nh), Image.Resampling.LANCZOS)
            tile = Image.new("RGB", (cell, cell), CHROMA)
            tile.paste(thumb, ((cell - nw) // 2, (cell - nh) // 2))
            sheet.paste(tile, (x, y))
            draw.text((x + 4, y + cell + 4), path.name.replace("fighter_casper_", "").replace(".png", ""), fill=(200, 200, 200), font=font)
            x += cell + 8
        y += cell + label_h + 12
    dest.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(dest, "PNG")
    print("wrote", dest, sheet.size)


def process() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    (ROOT / "refs").mkdir(exist_ok=True)
    report = []
    all_pose: list[tuple[str, list[Path]]] = []
    for row_name, names in POSE_ROWS:
        paths = []
        for name in names:
            src = SRC / name
            if not src.exists():
                raise SystemExit(f"missing {src}")
            snapped = snap_chroma(Image.open(src))
            fitted = fit_frame(snapped, name)
            dest = ROOT / name
            fitted.save(dest, "PNG")
            box = content_bbox(fitted)
            bw, bh = box[2] - box[0], box[3] - box[1]
            report.append(f"{name:32} frame={fitted.size[0]}x{fitted.size[1]} content={bw}x{bh}")
            paths.append(dest)
        all_pose.append((row_name, paths))

    ult_paths = []
    for name in ULT_FRAMES:
        snapped = snap_chroma(Image.open(SRC / name))
        fitted = fit_frame(snapped, name)
        dest = ROOT / name
        fitted.save(dest, "PNG")
        box = content_bbox(fitted)
        bw, bh = box[2] - box[0], box[3] - box[1]
        report.append(f"{name:32} frame={fitted.size[0]}x{fitted.size[1]} content={bw}x{bh}")
        ult_paths.append(dest)

    # Keep locked look ref sized similarly for QA.
    locked = snap_chroma(Image.open(SRC / "casper_locked_look.png"))
    fit_frame(locked, "casper_locked_look.png").save(ROOT / "refs" / "casper_locked_look.png", "PNG")

    contact_sheet(all_pose, ROOT / "casper_pose_contact.png")
    contact_sheet([("ult", ult_paths)], ROOT / "casper_ult_contact.png", cell=180)

    # Forbid idle_00
    idle00 = ROOT / "fighter_casper_idle_00.png"
    if idle00.exists():
        raise SystemExit("idle_00 must not be written")

    print("\n".join(report))


if __name__ == "__main__":
    process()
