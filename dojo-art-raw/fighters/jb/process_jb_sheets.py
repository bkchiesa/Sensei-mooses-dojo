#!/usr/bin/env python3
"""Slice JB action sheets: magenta-key, equal-panel split, ~512px frames, contact sheet."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
FRAMES = ROOT / "frames"
ANIMS: list[tuple[str, int]] = [
    ("idle", 4),
    ("punch", 4),
    ("kick", 4),
    ("jump", 4),
    ("block", 2),
    ("crouch", 2),
    ("sweep", 4),
]
CANVAS_H = 512
CONTENT_H = 500
BOTTOM_MARGIN = 12
OVERLAP_FRAC = 0.06
CONTACT_CELL_W = 300
CONTACT_LABEL_H = 44
CONTACT_BG = (22, 22, 26, 255)
CONTACT_FG = (255, 255, 255, 255)
CHECK_A = (48, 48, 56, 255)
CHECK_B = (36, 36, 42, 255)


def chroma_mask(rgb: np.ndarray) -> np.ndarray:
    """True where background should be removed (magenta, near-black, blue chroma)."""
    r = rgb[:, :, 0].astype(np.int16)
    g = rgb[:, :, 1].astype(np.int16)
    b = rgb[:, :, 2].astype(np.int16)
    magenta = (r >= 175) & (b >= 170) & (g <= 95) & ((r + b - 2 * g) >= 200)
    near_black = (r <= 28) & (g <= 28) & (b <= 28)
    blue = (b >= 170) & (r <= 90) & (g <= 120) & ((b - r) >= 80)
    return magenta | near_black | blue


def chroma_key_rgba(im: Image.Image) -> Image.Image:
    rgb = np.asarray(im.convert("RGB"))
    bg = chroma_mask(rgb)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    padded = np.pad((alpha > 0).astype(np.uint8), 1, mode="constant")
    eroded = np.ones(alpha.shape, dtype=bool)
    for dy in (0, 1, 2):
        for dx in (0, 1, 2):
            eroded &= padded[dy : dy + alpha.shape[0], dx : dx + alpha.shape[1]].astype(bool)
    alpha = np.where(eroded, 255, 0).astype(np.uint8)
    out = np.zeros((rgb.shape[0], rgb.shape[1], 4), dtype=np.uint8)
    out[:, :, :3] = rgb
    out[:, :, 3] = alpha
    r, g, b = out[:, :, 0].astype(np.int16), out[:, :, 1].astype(np.int16), out[:, :, 2].astype(np.int16)
    spill = (alpha > 0) & (r >= 160) & (b >= 160) & (g <= 120)
    if spill.any():
        out[:, :, 0] = np.where(spill, np.clip((r + g) // 2, 0, 255), out[:, :, 0])
        out[:, :, 2] = np.where(spill, np.clip((b + g) // 2, 0, 255), out[:, :, 2])
    return Image.fromarray(out, "RGBA")


def trim_rgba(arr: np.ndarray, pad: int = 4) -> tuple[np.ndarray, tuple[int, int, int, int]]:
    a = arr[:, :, 3]
    ys, xs = np.where(a > 8)
    if len(xs) < 40:
        raise RuntimeError(f"Panel has too few opaque pixels ({len(xs)})")
    h, w = a.shape
    x0, x1 = max(0, int(xs.min()) - pad), min(w, int(xs.max()) + 1 + pad)
    y0, y1 = max(0, int(ys.min()) - pad), min(h, int(ys.max()) + 1 + pad)
    return arr[y0:y1, x0:x1].copy(), (x0, y0, x1, y1)


def extract_panel_images(sheet: Image.Image, count: int) -> list[dict]:
    keyed = chroma_key_rgba(sheet)
    arr = np.asarray(keyed)
    h, w = arr.shape[:2]
    pw = w / count
    overlap = int(pw * OVERLAP_FRAC)
    rows = []
    for i in range(count):
        x0 = max(0, int(round(i * pw)) - overlap)
        x1 = min(w, int(round((i + 1) * pw)) + overlap)
        crop, (cx0, cy0, cx1, cy1) = trim_rgba(arr[:, x0:x1])
        rows.append(
            {
                "image": Image.fromarray(crop, "RGBA"),
                "cw": crop.shape[1],
                "ch": crop.shape[0],
                "top": cy0,
                "bottom": cy1,
                "sheet_h": h,
            }
        )
    return rows


def compose_frame(crop: Image.Image, scale: float, canvas_w: int, canvas_h: int, dest_bottom: int) -> Image.Image:
    nw = max(1, int(round(crop.width * scale)))
    nh = max(1, int(round(crop.height * scale)))
    fit = min(1.0, (canvas_h - 2) / nh, (canvas_w - 8) / nw)
    if fit < 1.0:
        nw = max(1, int(round(nw * fit)))
        nh = max(1, int(round(nh * fit)))
    scaled = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    x = (canvas_w - nw) // 2
    y = dest_bottom - nh
    y = max(0, min(y, canvas_h - nh))
    x = max(0, min(x, canvas_w - nw))
    canvas.paste(scaled, (x, y), scaled)
    return canvas


def checker_tile(w: int, h: int, cell: int = 16) -> Image.Image:
    tile = Image.new("RGBA", (w, h), CHECK_A)
    draw = ImageDraw.Draw(tile)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            if ((x // cell) + (y // cell)) % 2 == 0:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=CHECK_B)
    return tile


def label_font(size: int) -> ImageFont.ImageFont:
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def main() -> None:
    FRAMES.mkdir(parents=True, exist_ok=True)
    measured: dict[str, list[dict]] = {}
    for anim, count in ANIMS:
        path = ROOT / f"raw_jb_{anim}_sheet.png"
        measured[anim] = extract_panel_images(Image.open(path), count)
        print(f"{anim}: heights {[r['ch'] for r in measured[anim]]} widths {[r['cw'] for r in measured[anim]]}")

    idle_h = measured["idle"][0]["ch"]
    max_ch = max(r["ch"] for rows in measured.values() for r in rows)
    scale = min(CONTENT_H / idle_h, (CANVAS_H - BOTTOM_MARGIN - 2) / max_ch)
    print(f"idle_h={idle_h} max_ch={max_ch} scale={scale:.4f}")

    max_scaled_w = max(int(round(r["cw"] * scale)) for rows in measured.values() for r in rows)
    canvas_w = max(512, max_scaled_w + 48)
    canvas_h = CANVAS_H
    dest_ground = canvas_h - BOTTOM_MARGIN
    print(f"canvas={canvas_w}x{canvas_h} dest_ground={dest_ground}")

    frames: dict[str, list[Image.Image]] = {}
    for anim, rows in measured.items():
        max_bottom = max(r["bottom"] for r in rows)
        anim_frames = []
        for i, r in enumerate(rows):
            if anim == "jump":
                lift = int(round((max_bottom - r["bottom"]) * scale))
                dest_bottom = dest_ground - lift
            else:
                dest_bottom = dest_ground
            frame = compose_frame(r["image"], scale, canvas_w, canvas_h, dest_bottom)
            out = FRAMES / f"fighter_jb_{anim}_{i:02d}.png"
            frame.save(out, "PNG")
            anim_frames.append(frame)
            print(f"  wrote {out.name} {frame.size} dest_bottom={dest_bottom} src={r['cw']}x{r['ch']}")
        frames[anim] = anim_frames

    cols = 4
    rows_n = len(ANIMS)
    cell_w = CONTACT_CELL_W
    cell_h = CANVAS_H
    sheet_w = cols * cell_w + 32
    sheet_h = rows_n * (cell_h + CONTACT_LABEL_H) + 28
    contact = Image.new("RGBA", (sheet_w, sheet_h), CONTACT_BG)
    draw = ImageDraw.Draw(contact)
    font = label_font(22)
    idx_font = label_font(18)

    for ri, (anim, count) in enumerate(ANIMS):
        y0 = 14 + ri * (cell_h + CONTACT_LABEL_H)
        draw.text((16, y0 + 8), f"JB  {anim.upper()}  ×{count}", font=font, fill=CONTACT_FG)
        for ci, fr in enumerate(frames[anim]):
            fit_h = cell_h - 10
            fit_w = cell_w - 10
            scale_fit = min(fit_w / fr.width, fit_h / fr.height)
            nw = max(1, int(fr.width * scale_fit))
            nh = max(1, int(fr.height * scale_fit))
            thumb = fr.resize((nw, nh), Image.Resampling.LANCZOS)
            cell = checker_tile(nw, nh, 14)
            cell = Image.alpha_composite(cell, thumb)
            cx = 16 + ci * cell_w + (cell_w - nw) // 2
            cy = y0 + CONTACT_LABEL_H + (fit_h - nh)
            contact.paste(cell, (cx, cy), cell)
            draw.text(
                (16 + ci * cell_w + 8, y0 + CONTACT_LABEL_H - 2),
                f"{ci:02d}",
                font=idx_font,
                fill=(180, 180, 190, 255),
            )

    contact_path = ROOT / "jb_contact_sheet.png"
    contact.convert("RGB").save(contact_path, "PNG")
    print(f"contact {contact_path} {contact.size}")


if __name__ == "__main__":
    main()
