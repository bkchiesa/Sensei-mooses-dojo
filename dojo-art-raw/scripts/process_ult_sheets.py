#!/usr/bin/env python3
"""Snap magenta chroma and slice ultimate sheets into 12 frames.

Usage:
  python3 dojo-art-raw/scripts/process_ult_sheets.py [id ...]

If no ids are given, processes every raw_ult_<id>_sheet.png found in
/opt/cursor/artifacts/assets/. Copies chroma-snapped sheets and sliced
frames into dojo-art-raw/ultimates/<id>/ and /opt/cursor/artifacts/ults/<id>/.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
COLS, ROWS = 6, 2
TARGET_CHROMA = (255, 0, 255)
SRC_DIR = Path("/opt/cursor/artifacts/assets")
ARTIFACT_ULTS = Path("/opt/cursor/artifacts/ults")


def is_chroma(r: int, g: int, b: int) -> bool:
    """True for hot / washed magenta background, not character VFX."""
    if r < 170 or b < 170:
        return False
    if abs(r - b) > 55:
        return False
    if g > min(r, b) - 8:
        return False
    # Keep saturated violet / purple energy trails.
    if b - r > 35 and g < 90:
        return False
    return (r + b) / 2 - g >= 40


def snap_chroma(im: Image.Image) -> Image.Image:
    rgb = im.convert("RGB")
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


def discover_ids() -> list[str]:
    ids = []
    if not SRC_DIR.is_dir():
        return ids
    for p in sorted(SRC_DIR.glob("raw_ult_*_sheet.png")):
        name = p.name
        # raw_ult_<id>_sheet.png
        mid = name[len("raw_ult_") : -len("_sheet.png")]
        if mid:
            ids.append(mid)
    return ids


def process_id(fid: str) -> dict:
    src = SRC_DIR / f"raw_ult_{fid}_sheet.png"
    if not src.is_file():
        raise FileNotFoundError(src)
    dest_dir = ROOT / "ultimates" / fid
    dest_dir.mkdir(parents=True, exist_ok=True)
    art_dir = ARTIFACT_ULTS / fid
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

    return {
        "id": fid,
        "panels": len(frames),
        "sheet": f"{snapped.size[0]}x{snapped.size[1]}",
        "frame": f"{frames[0].size[0]}x{frames[0].size[1]}",
    }


def main() -> None:
    ids = sys.argv[1:] or discover_ids()
    if not ids:
        raise SystemExit("No ultimate sheet ids to process.")
    for fid in ids:
        info = process_id(fid)
        print(f"{info['id']}: {info['panels']} panels  sheet={info['sheet']}  frame={info['frame']}")


if __name__ == "__main__":
    main()
