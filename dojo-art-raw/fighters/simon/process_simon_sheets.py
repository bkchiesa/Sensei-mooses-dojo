#!/usr/bin/env python3
"""Split Simon magenta chroma sheets into transparent ~512px frames + contact sheet."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

TARGET_H, BOTTOM_MARGIN = 512, 12
ANIMS = [
    ("idle", 4),
    ("punch", 4),
    ("kick", 4),
    ("jump", 4),
    ("block", 2),
    ("crouch", 2),
    ("sweep", 4),
]
FID = "simon"
RAW = Path("/workspace/dojo-art-raw/fighters") / FID
OUT = RAW / "frames"
CONTACT = RAW / f"{FID}_contact_sheet.png"


def remove_magenta_bg(im, tol=55.0):
    im = im.convert("RGBA")
    arr = np.array(im, dtype=np.uint8)
    rgb = arr[:, :, :3].astype(np.float32)
    magenta = np.array([255.0, 0.0, 255.0])
    d_mag = np.sqrt(((rgb - magenta) ** 2).sum(axis=2))
    h, w = rgb.shape[:2]
    corners = np.stack([rgb[2, 2], rgb[2, w - 3], rgb[h - 3, 2], rgb[h - 3, w - 3]])
    bg = np.median(corners, axis=0)
    d_bg = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    magentaish = (r > 180) & (b > 180) & (g < 140) & ((r + b - 2 * g) > 120)
    near_black = (r < 25) & (g < 25) & (b < 25)
    blueish = (b > 180) & (r < 100) & (g < 140) & ((b - r) > 80)
    mask = (d_mag < tol) | (d_bg < 45) | magentaish | near_black | blueish
    alpha = arr[:, :, 3].astype(np.float32)
    alpha[mask] = 0
    fringe = (~mask) & ((d_mag < tol + 30) | (d_bg < 65))
    alpha[fringe] *= 0.3
    out = arr.copy()
    out[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    out[out[:, :, 3] == 0, :3] = 0
    return Image.fromarray(out, "RGBA")


def trim_alpha(im, pad=2):
    bb = im.split()[-1].getbbox()
    if not bb:
        return im
    l, t, r, b = bb
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def bottom_align(im, target_h=TARGET_H, margin=BOTTOM_MARGIN):
    im = trim_alpha(im)
    content_h = target_h - margin
    nw = max(1, int(round(im.width * (content_h / im.height))))
    resized = im.resize((nw, content_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (nw + 10, target_h), (0, 0, 0, 0))
    canvas.paste(resized, (5, 0), resized)
    return canvas


def split_panels(im, n, overlap=0.04):
    w = im.width
    pw = w / n
    ov = pw * overlap
    panels = []
    for i in range(n):
        left = max(0, int(i * pw - (ov if i > 0 else 0)))
        right = min(w, int((i + 1) * pw + (ov if i < n - 1 else 0)))
        panels.append(im.crop((left, 0, right, im.height)))
    return panels


def checker_bg(size, cell=16):
    w, h = size
    im = Image.new("RGBA", size, (0, 0, 0, 0))
    px = im.load()
    c1, c2 = (55, 55, 55, 255), (85, 85, 85, 255)
    for y in range(h):
        for x in range(w):
            px[x, y] = c1 if ((x // cell) + (y // cell)) % 2 == 0 else c2
    return im


def load_font(size):
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def build_contact(all_frames):
    label_w = 140
    pad = 16
    gap = 10
    row_h = TARGET_H + 8
    max_cols = max(len(frs) for _, frs in all_frames)
    col_w = max((fr.width for _, frs in all_frames for fr in frs), default=200)
    width = label_w + pad + max_cols * (col_w + gap) + pad
    height = pad + len(all_frames) * (row_h + gap) + pad
    canvas = Image.new("RGBA", (width, height), (28, 28, 32, 255))
    draw = ImageDraw.Draw(canvas)
    font = load_font(28)
    title_font = load_font(22)
    draw.text((pad, 4), "SIMON — pose-bar contact", font=title_font, fill=(230, 230, 230, 255))
    y = pad + 18
    for anim, frames in all_frames:
        draw.text((12, y + TARGET_H // 2 - 14), anim.upper(), font=font, fill=(255, 220, 80, 255))
        x = label_w
        for i, fr in enumerate(frames):
            cell_w, cell_h = col_w, TARGET_H
            bg = checker_bg((cell_w, cell_h))
            canvas.paste(bg, (x, y))
            ox = x + max(0, (cell_w - fr.width) // 2)
            canvas.paste(fr, (ox, y), fr)
            tag = f"{i:02d}"
            if (anim, i) in {("idle", 0), ("punch", 2), ("kick", 2), ("jump", 2), ("block", 0), ("crouch", 0), ("sweep", 2)}:
                tag += " PEAK"
            draw.text((x + 6, y + 4), tag, font=title_font, fill=(180, 255, 180, 255))
            x += col_w + gap
        y += row_h + gap
    canvas.convert("RGB").save(CONTACT, "PNG", optimize=True)
    print("contact", CONTACT, canvas.size)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    all_frames = []
    for anim, n in ANIMS:
        src = RAW / f"raw_{FID}_{anim}_sheet.png"
        im = Image.open(src).convert("RGBA")
        frames = []
        for p in split_panels(im, n):
            keyed = remove_magenta_bg(p)
            bb = keyed.split()[-1].getbbox()
            if not bb:
                continue
            bw, bh = bb[2] - bb[0], bb[3] - bb[1]
            if bw < 30 or bh < 60:
                continue
            frames.append(bottom_align(keyed))
        while len(frames) < n and frames:
            frames.append(frames[-1].copy())
        frames = frames[:n]
        for i, fr in enumerate(frames):
            dest = OUT / f"fighter_{FID}_{anim}_{i:02d}.png"
            fr.save(dest, "PNG", optimize=True)
        print(anim, [f.size for f in frames])
        all_frames.append((anim, frames))
    build_contact(all_frames)

    # Silhouette QA: bbox aspect after keying, before bottom-align scale
    print("\n--- silhouette QA (raw keyed bbox) ---")
    for anim, n in ANIMS:
        src = RAW / f"raw_{FID}_{anim}_sheet.png"
        im = Image.open(src).convert("RGBA")
        for i, p in enumerate(split_panels(im, n)):
            keyed = remove_magenta_bg(p)
            bb = keyed.split()[-1].getbbox()
            if not bb:
                print(f"  {anim}_{i:02d} EMPTY")
                continue
            bw, bh = bb[2] - bb[0], bb[3] - bb[1]
            print(f"  {anim}_{i:02d} bbox={bw}x{bh} aspect={bw/bh:.2f}")


if __name__ == "__main__":
    main()
