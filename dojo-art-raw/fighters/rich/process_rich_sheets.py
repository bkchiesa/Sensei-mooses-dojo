#!/usr/bin/env python3
"""Slice Rich action sheets: chroma-key, equal-panel split, ~512px frames, contact sheet."""

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
PAD_X = 36
CONTACT_CELL_W = 300
CONTACT_LABEL_H = 40
CONTACT_BG = (18, 18, 22, 255)
CONTACT_FG = (255, 255, 255, 255)
CHECK_A = (46, 46, 52, 255)
CHECK_B = (28, 28, 34, 255)
CHECK = 16


def chroma_mask(rgb: np.ndarray) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.int16)
    g = rgb[:, :, 1].astype(np.int16)
    b = rgb[:, :, 2].astype(np.int16)
    magenta = (r >= 175) & (b >= 170) & (g <= 95) & ((r + b - 2 * g) >= 200)
    near_black = (r <= 18) & (g <= 18) & (b <= 18)
    blue = (b >= 160) & (r <= 90) & (g <= 130) & ((b - r) >= 70)
    return magenta | near_black | blue


def chroma_key_rgba(im: Image.Image) -> Image.Image:
    rgb = np.asarray(im.convert("RGB"))
    keyed = chroma_mask(rgb)
    alpha = np.where(keyed, 0, 255).astype(np.uint8)
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


def extract_panel_images(sheet: Image.Image, count: int) -> list[dict]:
    keyed = chroma_key_rgba(sheet)
    arr = np.asarray(keyed)
    opaque = arr[:, :, 3] > 8
    h, w = opaque.shape
    overlap = max(8, int((w / count) * 0.04))
    rows = []
    for i in range(count):
        x0 = max(0, int(round(i * w / count)) - (0 if i == 0 else overlap))
        x1 = min(w, int(round((i + 1) * w / count)) + (0 if i == count - 1 else overlap))
        panel = arr[:, x0:x1].copy()
        a = panel[:, :, 3]
        ys, xs = np.where(a > 8)
        if len(xs) < 80:
            raise RuntimeError(f"Panel {i} has too few opaque pixels ({len(xs)})")
        px0, px1 = int(xs.min()), int(xs.max()) + 1
        py0, py1 = int(ys.min()), int(ys.max()) + 1
        crop = panel[py0:py1, px0:px1]
        rows.append(
            {
                "image": Image.fromarray(crop, "RGBA"),
                "cw": crop.shape[1],
                "ch": crop.shape[0],
                "top": py0,
                "bottom": py1,
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


def label_font(size: int) -> ImageFont.ImageFont:
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def checker_cell(w: int, h: int) -> Image.Image:
    cell = Image.new("RGBA", (w, h), CHECK_A)
    px = cell.load()
    for y in range(0, h, CHECK):
        for x in range(0, w, CHECK):
            if ((x // CHECK) + (y // CHECK)) % 2 == 0:
                for yy in range(y, min(h, y + CHECK)):
                    for xx in range(x, min(w, x + CHECK)):
                        px[xx, yy] = CHECK_B
    return cell


def main() -> None:
    FRAMES.mkdir(parents=True, exist_ok=True)
    measured: dict[str, list[dict]] = {}
    for anim, count in ANIMS:
        path = ROOT / f"raw_rich_{anim}_sheet.png"
        measured[anim] = extract_panel_images(Image.open(path), count)
        print(f"{anim}: heights {[r['ch'] for r in measured[anim]]} widths {[r['cw'] for r in measured[anim]]}")

    idle_h = measured["idle"][0]["ch"]
    max_ch = max(r["ch"] for rows in measured.values() for r in rows)
    scale = min(CONTENT_H / idle_h, (CANVAS_H - BOTTOM_MARGIN) / max_ch)
    print(f"idle_h={idle_h} max_ch={max_ch} scale={scale:.4f}")

    max_scaled_w = max(int(round(r["cw"] * scale)) for rows in measured.values() for r in rows)
    canvas_w = max(512, max_scaled_w + PAD_X * 2)
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
            out = FRAMES / f"fighter_rich_{anim}_{i:02d}.png"
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
        draw.text((16, y0 + 6), f"RICH  {anim.upper()}  ×{count}", font=font, fill=CONTACT_FG)
        for ci, fr in enumerate(frames[anim]):
            fit_h = cell_h - 10
            fit_w = cell_w - 10
            scale_fit = min(fit_w / fr.width, fit_h / fr.height)
            nw = max(1, int(fr.width * scale_fit))
            nh = max(1, int(fr.height * scale_fit))
            thumb = fr.resize((nw, nh), Image.Resampling.LANCZOS)
            cell = checker_cell(nw, nh)
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

    contact_path = ROOT / "rich_contact_sheet.png"
    contact.convert("RGB").save(contact_path, "PNG")
    print(f"contact {contact_path} {contact.size}")


if __name__ == "__main__":
    main()
