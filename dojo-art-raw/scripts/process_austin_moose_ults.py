#!/usr/bin/env python3
"""Snap magenta chroma, slice Austin/Moose ult sheets, resize FX, alias senseiMoose."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART_IDS = ("austin", "moose")
COLS, ROWS = 6, 2
SHEET_SIZE = (1536, 1024)
CELL_SIZE = (256, 512)
FX_SIZE = (1280, 800)
TARGET_CHROMA = (255, 0, 255)
SRC_DIR = Path("/opt/cursor/artifacts/assets")
ARTIFACT_BUNDLE = Path("/opt/cursor/artifacts/austin-moose-ults")


def is_chroma(r: int, g: int, b: int) -> bool:
    """True for hot / washed magenta background, not gold/cyan VFX or white sparks."""
    if r < 170 or b < 170:
        return False
    if abs(r - b) > 55:
        return False
    # Keep saturated violet energy (G much lower, B clearly above R).
    if b - r > 35 and g < 90:
        return False
    # Classic hot magenta: high R/B, G clearly lower.
    if (r + b) / 2 - g >= 25:
        return True
    # Washed bloom-magenta: near-white pink where G still sits below R/B.
    if r >= 220 and b >= 220 and g <= min(r, b) - 2:
        return True
    return False


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


def fit_exact(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    if im.size == size:
        return im
    src_w, src_h = im.size
    dst_w, dst_h = size
    src_aspect = src_w / src_h
    dst_aspect = dst_w / dst_h
    if src_aspect > dst_aspect:
        new_w = int(round(src_h * dst_aspect))
        left = (src_w - new_w) // 2
        im = im.crop((left, 0, left + new_w, src_h))
    elif src_aspect < dst_aspect:
        new_h = int(round(src_w / dst_aspect))
        top = (src_h - new_h) // 2
        im = im.crop((0, top, src_w, top + new_h))
    if im.size != size:
        im = im.resize(size, Image.Resampling.LANCZOS)
    return im


def slice_sheet(im: Image.Image) -> list[Image.Image]:
    w, h = im.size
    cw, ch = w // COLS, h // ROWS
    frames = []
    for row in range(ROWS):
        for col in range(COLS):
            box = (col * cw, row * ch, (col + 1) * cw, (row + 1) * ch)
            frames.append(im.crop(box))
    return frames


def copy_everywhere(src: Path, *dests: Path) -> None:
    for dest in dests:
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)


def process_id(fid: str) -> dict:
    dest_dir = ROOT / "ultimates" / fid
    dest_fx = dest_dir / "fx"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_fx.mkdir(parents=True, exist_ok=True)
    art_dir = ARTIFACT_BUNDLE / fid
    art_fx = art_dir / "fx"
    art_dir.mkdir(parents=True, exist_ok=True)
    art_fx.mkdir(parents=True, exist_ok=True)

    raw = Image.open(SRC_DIR / f"raw_ult_{fid}_sheet.png")
    snapped = snap_chroma(fit_exact(raw, SHEET_SIZE))
    sheet_path = dest_dir / f"raw_ult_{fid}_sheet.png"
    snapped.save(sheet_path, "PNG")
    copy_everywhere(
        sheet_path,
        SRC_DIR / f"raw_ult_{fid}_sheet.png",
        art_dir / f"raw_ult_{fid}_sheet.png",
    )

    frames = slice_sheet(snapped)
    for i, frame in enumerate(frames):
        name = f"raw_ult_{fid}_{i:02d}.png"
        frame_path = dest_dir / name
        frame.save(frame_path, "PNG")
        copy_everywhere(frame_path, SRC_DIR / name, art_dir / name)

    fx_count = 0
    for i in range(16):
        src = SRC_DIR / f"raw_ult_{fid}_fx_{i:02d}.png"
        if not src.exists():
            break
        fx = snap_chroma(fit_exact(Image.open(src), FX_SIZE))
        name = f"raw_ult_{fid}_fx_{i:02d}.png"
        fx_path = dest_fx / name
        fx.save(fx_path, "PNG")
        copy_everywhere(fx_path, SRC_DIR / name, art_fx / name)
        fx_count += 1

    return {
        "id": fid,
        "panels": len(frames),
        "sheet": f"{snapped.size[0]}x{snapped.size[1]}",
        "frame": f"{frames[0].size[0]}x{frames[0].size[1]}",
        "fx": fx_count,
        "fx_size": f"{FX_SIZE[0]}x{FX_SIZE[1]}",
    }


def alias_sensei_moose() -> int:
    src = ROOT / "ultimates" / "moose"
    dest = ROOT / "ultimates" / "senseiMoose"
    art = ARTIFACT_BUNDLE / "senseiMoose"
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "fx").mkdir(parents=True, exist_ok=True)
    art.mkdir(parents=True, exist_ok=True)
    (art / "fx").mkdir(parents=True, exist_ok=True)
    copied = 0
    for path in sorted(src.rglob("*.png")):
        rel = path.relative_to(src)
        name = path.name.replace("raw_ult_moose", "raw_ult_senseiMoose")
        out_rel = rel.with_name(name)
        out = dest / out_rel
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, out)
        copy_everywhere(out, SRC_DIR / name, art / out_rel)
        copied += 1
    return copied


def main() -> None:
    for fid in ART_IDS:
        info = process_id(fid)
        print(
            f"{info['id']}: {info['panels']} panels  sheet={info['sheet']}  "
            f"frame={info['frame']}  fx={info['fx']} @ {info['fx_size']}"
        )
    n = alias_sensei_moose()
    print(f"senseiMoose aliases: {n} files")


if __name__ == "__main__":
    main()
