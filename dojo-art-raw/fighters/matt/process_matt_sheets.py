#!/usr/bin/env python3
"""Slice Matt action sheets: chroma-key magenta, ~512px frames, contact sheet."""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
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
IDLE_TARGET_H = 440
PAD_X = 36
CONTACT_CELL_W = 300
CONTACT_LABEL_H = 40
CONTACT_BG = (18, 18, 22, 255)
CONTACT_FG = (255, 255, 255, 255)


def magenta_mask(rgb: np.ndarray) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.int16)
    g = rgb[:, :, 1].astype(np.int16)
    b = rgb[:, :, 2].astype(np.int16)
    return (r >= 175) & (b >= 170) & (g <= 95) & ((r + b - 2 * g) >= 200)


def chroma_key_rgba(im: Image.Image) -> Image.Image:
    rgb = np.asarray(im.convert("RGB"))
    mag = magenta_mask(rgb)
    alpha = np.where(mag, 0, 255).astype(np.uint8)
    # 1px erode to eat pink fringe.
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


def core_flood_owners(opaque: np.ndarray, count: int) -> np.ndarray:
    """Assign overflowed limbs to the character whose torso-core they connect to."""
    h, w = opaque.shape
    pw = w // count
    margin = max(8, int(pw * 0.22))
    owned = np.zeros((h, w), dtype=np.int16)
    seeds: list[list[tuple[int, int]]] = [[] for _ in range(count)]
    for i in range(count):
        x0 = i * pw + margin
        x1 = (i + 1) * pw - margin
        ys, xs = np.where(opaque[:, x0:x1])
        if len(xs) == 0:
            # Fall back to full column if the core is empty.
            ys, xs = np.where(opaque[:, i * pw : (i + 1) * pw])
            x0 = i * pw
        owned[ys, xs + x0] = i + 1
        # Seed from a sparse subset so the queue stays small.
        if len(xs) > 0:
            step = max(1, len(xs) // 400)
            for y, x in zip(ys[::step], xs[::step]):
                seeds[i].append((int(y), int(x + x0)))

    neigh = ((-1, 0), (1, 0), (0, -1), (0, 1))
    for i, seed_list in enumerate(seeds):
        q = deque(seed_list)
        cid = i + 1
        while q:
            y, x = q.popleft()
            for dy, dx in neigh:
                ny, nx = y + dy, x + dx
                if ny < 0 or ny >= h or nx < 0 or nx >= w:
                    continue
                if not opaque[ny, nx] or owned[ny, nx] != 0:
                    continue
                owned[ny, nx] = cid
                q.append((ny, nx))
    return owned


def extract_panel_images(sheet: Image.Image, count: int) -> list[dict]:
    keyed = chroma_key_rgba(sheet)
    arr = np.asarray(keyed)
    opaque = arr[:, :, 3] > 8
    owned = core_flood_owners(opaque, count)
    rows = []
    h, w = opaque.shape
    for i in range(count):
        mask = owned == (i + 1)
        # Drop tiny islands / leftover panel bleed.
        ys, xs = np.where(mask)
        if len(xs) < 80:
            raise RuntimeError(f"Panel {i} has too few owned pixels ({len(xs)})")
        x0, x1 = int(xs.min()), int(xs.max()) + 1
        y0, y1 = int(ys.min()), int(ys.max()) + 1
        # Extra pad.
        pad = 6
        x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
        x1, y1 = min(w, x1 + pad), min(h, y1 + pad)
        crop = arr[y0:y1, x0:x1].copy()
        crop_mask = mask[y0:y1, x0:x1]
        crop[:, :, 3] = np.where(crop_mask, crop[:, :, 3], 0)
        # Trim again after mask apply (removes unused pad).
        a = crop[:, :, 3]
        ys2, xs2 = np.where(a > 8)
        x0b, x1b = int(xs2.min()), int(xs2.max()) + 1
        y0b, y1b = int(ys2.min()), int(ys2.max()) + 1
        crop = crop[y0b:y1b, x0b:x1b]
        rows.append(
            {
                "image": Image.fromarray(crop, "RGBA"),
                "cw": crop.shape[1],
                "ch": crop.shape[0],
                "top": y0 + y0b,
                "bottom": y0 + y1b,
                "sheet_h": h,
            }
        )
    return rows


def compose_frame(crop: Image.Image, scale: float, canvas_w: int, canvas_h: int, dest_bottom: int) -> Image.Image:
    nw = max(1, int(round(crop.width * scale)))
    nh = max(1, int(round(crop.height * scale)))
    # Never exceed canvas; shrink this frame only if needed (block was oversized).
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


def main() -> None:
    measured: dict[str, list[dict]] = {}
    for anim, count in ANIMS:
        path = ROOT / f"raw_matt_{anim}_sheet.png"
        measured[anim] = extract_panel_images(Image.open(path), count)
        print(f"{anim}: heights {[r['ch'] for r in measured[anim]]} widths {[r['cw'] for r in measured[anim]]}")

    idle_h = measured["idle"][0]["ch"]
    max_ch = max(r["ch"] for rows in measured.values() for r in rows)
    scale = min(IDLE_TARGET_H / idle_h, (CANVAS_H - 8) / max_ch)
    print(f"idle_h={idle_h} max_ch={max_ch} scale={scale:.4f}")

    max_scaled_w = max(int(round(r["cw"] * scale)) for rows in measured.values() for r in rows)
    canvas_w = max(512, max_scaled_w + PAD_X * 2)
    canvas_h = CANVAS_H
    print(f"canvas={canvas_w}x{canvas_h}")

    frames: dict[str, list[Image.Image]] = {}
    for anim, rows in measured.items():
        max_bottom = max(r["bottom"] for r in rows)
        anim_frames = []
        for i, r in enumerate(rows):
            if anim == "jump":
                lift = int(round((max_bottom - r["bottom"]) * scale))
                dest_bottom = canvas_h - lift
            else:
                dest_bottom = canvas_h
            frame = compose_frame(r["image"], scale, canvas_w, canvas_h, dest_bottom)
            out = ROOT / f"fighter_matt_{anim}_{i:02d}.png"
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
        draw.text((16, y0 + 6), f"MATT  {anim.upper()}  ×{count}", font=font, fill=CONTACT_FG)
        for ci, fr in enumerate(frames[anim]):
            fit_h = cell_h - 10
            fit_w = cell_w - 10
            scale_fit = min(fit_w / fr.width, fit_h / fr.height)
            nw = max(1, int(fr.width * scale_fit))
            nh = max(1, int(fr.height * scale_fit))
            thumb = fr.resize((nw, nh), Image.Resampling.LANCZOS)
            cell = Image.new("RGBA", (nw, nh), (28, 28, 34, 255))
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

    contact_path = ROOT / "matt_contact_sheet.png"
    contact.convert("RGB").save(contact_path, "PNG")
    print(f"contact {contact_path} {contact.size}")


if __name__ == "__main__":
    main()
