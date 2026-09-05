#!/usr/bin/env python3
"""Snap magenta chroma and slice boss ultimate sheets into frames."""

from __future__ import annotations

import shutil
import sys
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART_IDS = tuple(sys.argv[1:]) or ("jaylen", "amiyr", "shaun", "ryan")
COLS, ROWS = 6, 2
TARGET_CHROMA = (255, 0, 255)
SRC_DIR = Path("/opt/cursor/artifacts/assets")
ARTIFACT_DIR = Path("/opt/cursor/artifacts/boss-ults")


def is_saturated_chroma(r: int, g: int, b: int) -> bool:
    """True for hot / mid magenta background, not character VFX."""
    if r < 170 or b < 170:
        return False
    if abs(r - b) > 55:
        return False
    if g > min(r, b) - 8:
        return False
    # Keep saturated violet energy (G much lower, B clearly above R).
    if b - r > 35 and g < 90:
        return False
    return (r + b) / 2 - g >= 30


def is_washed_chroma(r: int, g: int, b: int) -> bool:
    """True for pale pink-magenta leftover from GenerateImage."""
    if r < 200 or b < 200:
        return False
    if abs(r - b) > 40:
        return False
    if g >= 248:
        return False
    if b - r > 35 and g < 90:
        return False
    return (r + b) / 2 - g >= 8


def is_bg_candidate(r: int, g: int, b: int) -> bool:
    return is_saturated_chroma(r, g, b) or is_washed_chroma(r, g, b)


def snap_chroma(im: Image.Image) -> Image.Image:
    rgb = im.convert("RGB")
    pixels = rgb.load()
    w, h = rgb.size
    visited = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()

    def try_push(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h:
            return
        idx = y * w + x
        if visited[idx]:
            return
        r, g, b = pixels[x, y]
        if not is_bg_candidate(r, g, b):
            return
        visited[idx] = 1
        q.append((x, y))

    for x in range(w):
        try_push(x, 0)
        try_push(x, h - 1)
    for y in range(h):
        try_push(0, y)
        try_push(w - 1, y)

    while q:
        x, y = q.popleft()
        pixels[x, y] = TARGET_CHROMA
        try_push(x + 1, y)
        try_push(x - 1, y)
        try_push(x, y + 1)
        try_push(x, y - 1)

    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            if is_saturated_chroma(r, g, b):
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
    art_dir = ARTIFACT_DIR / fid
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
    for fid in ART_IDS:
        info = process_id(fid)
        print(f"{info['id']}: {info['panels']} panels  sheet={info['sheet']}  frame={info['frame']}")


if __name__ == "__main__":
    main()
