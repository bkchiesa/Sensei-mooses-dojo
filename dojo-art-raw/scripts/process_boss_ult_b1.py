#!/usr/bin/env python3
"""Snap magenta chroma and slice boss-batch-1 ultimate sheets into frames."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART_IDS = ("misty", "lucas", "chris", "christiano", "dakota")
COLS, ROWS = 6, 2
TARGET_SIZE = (1536, 1024)
TARGET_CHROMA = (255, 0, 255)
SRC_DIR = Path("/opt/cursor/artifacts/assets")
ARTIFACT_BOSS = Path("/opt/cursor/artifacts/boss-ults-b1")


def is_chroma(r: int, g: int, b: int) -> bool:
    """True for hot / washed magenta background, not character VFX."""
    if r < 170 or b < 170:
        return False
    if abs(r - b) > 55:
        return False
    if g > min(r, b) - 8:
        return False
    if b - r > 35 and g < 90:
        return False
    return (r + b) / 2 - g >= 40


def snap_chroma(im: Image.Image) -> Image.Image:
    rgb = im.convert("RGB")
    if rgb.size != TARGET_SIZE:
        rgb = rgb.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
    pixels = rgb.load()
    w, h = rgb.size
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            if is_chroma(r, g, b):
                pixels[x, y] = TARGET_CHROMA
    return rgb


def slice_sheet(im: Image.Image) -> list[Image.Image]:
    w, h = im.size
    cw, ch = w // COLS, h // ROWS
    frames = []
    for row in range(ROWS):
        for col in range(COLS):
            box = (col * cw, row * ch, (col + 1) * cw, (row + 1) * ch)
            frames.append(im.crop(box))
    return frames


def process_id(fid: str) -> dict:
    src = SRC_DIR / f"raw_ult_{fid}_sheet.png"
    dest_dir = ROOT / "ultimates" / fid
    dest_dir.mkdir(parents=True, exist_ok=True)
    art_dir = ARTIFACT_BOSS / fid
    art_dir.mkdir(parents=True, exist_ok=True)

    raw = Image.open(src)
    snapped = snap_chroma(raw)
    sheet_path = dest_dir / f"raw_ult_{fid}_sheet.png"
    snapped.save(sheet_path, "PNG")
    shutil.copy2(sheet_path, SRC_DIR / f"raw_ult_{fid}_sheet.png")
    shutil.copy2(sheet_path, art_dir / f"raw_ult_{fid}_sheet.png")

    frames = slice_sheet(snapped)
    for i, frame in enumerate(frames):
        name = f"raw_ult_{fid}_{i:02d}.png"
        frame_path = dest_dir / name
        frame.save(frame_path, "PNG")
        shutil.copy2(frame_path, art_dir / name)
        shutil.copy2(frame_path, SRC_DIR / name)

    return {
        "id": fid,
        "panels": len(frames),
        "sheet": f"{snapped.size[0]}x{snapped.size[1]}",
        "frame": f"{frames[0].size[0]}x{frames[0].size[1]}",
    }


def main() -> None:
    for fid in ART_IDS:
        info = process_id(fid)
        print(
            f"{info['id']}: {info['panels']} panels  "
            f"sheet={info['sheet']}  frame={info['frame']}"
        )


if __name__ == "__main__":
    main()
