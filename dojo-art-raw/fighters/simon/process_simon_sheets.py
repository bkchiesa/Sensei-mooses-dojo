#!/usr/bin/env python3
"""Split Simon magenta chroma sheets into transparent ~512px frames + contact sheet.

Adapts the locked processor: detect magenta gutters instead of a naive equal
split (avoids neighbor-limb crumbs), keep one connected sprite per panel,
use a consistent scale so crouch stays ~half idle height, and preserve air
under airborne jump frames.
"""
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


def keep_main_sprite(im, min_alpha=24, crumb_frac=0.03, near=28):
    """Drop tiny far-away crumbs; keep fists/feet split by magenta fringing."""
    arr = np.array(im)
    vis = arr[:, :, 3] >= min_alpha
    if not vis.any():
        return im
    h, w = vis.shape
    labels = np.zeros((h, w), dtype=np.int32)
    current = 0
    sizes = {}
    boxes = {}
    ys, xs = np.where(vis)
    for y, x in zip(ys.tolist(), xs.tolist()):
        if labels[y, x]:
            continue
        current += 1
        stack = [(y, x)]
        count = 0
        miny, minx, maxy, maxx = y, x, y, x
        while stack:
            cy, cx = stack.pop()
            if cy < 0 or cy >= h or cx < 0 or cx >= w:
                continue
            if not vis[cy, cx] or labels[cy, cx]:
                continue
            labels[cy, cx] = current
            count += 1
            if cy < miny:
                miny = cy
            if cy > maxy:
                maxy = cy
            if cx < minx:
                minx = cx
            if cx > maxx:
                maxx = cx
            stack.extend(((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)))
        sizes[current] = count
        boxes[current] = (minx, miny, maxx, maxy)
    if not sizes:
        return im
    main = max(sizes, key=sizes.get)
    mx0, my0, mx1, my1 = boxes[main]
    keep = {main}
    for lab, sz in sizes.items():
        if lab == main:
            continue
        x0, y0, x1, y1 = boxes[lab]
        close = (x0 <= mx1 + near and x1 >= mx0 - near and y0 <= my1 + near and y1 >= my0 - near)
        if close and sz >= sizes[main] * crumb_frac:
            keep.add(lab)
        elif sz >= sizes[main] * 0.15:
            keep.add(lab)
    drop = ~np.isin(labels, list(keep))
    # never drop unlabeled background (already alpha 0)
    drop &= labels != 0
    out = arr.copy()
    out[drop, 3] = 0
    out[out[:, :, 3] == 0, :3] = 0
    return Image.fromarray(out, "RGBA")


def trim_alpha(im, pad=2):
    bb = im.split()[-1].getbbox()
    if not bb:
        return im
    l, t, r, b = bb
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def split_panels(im, n, overlap=0.0):
    """Equal columns. overlap=0 avoids pulling a neighbor toe into the next cell."""
    w = im.width
    pw = w / n
    ov = pw * overlap
    panels = []
    for i in range(n):
        left = max(0, int(i * pw - (ov if i > 0 else 0)))
        right = min(w, int((i + 1) * pw + (ov if i < n - 1 else 0)))
        panels.append(im.crop((left, 0, right, im.height)))
    return panels


def extract_sprite(panel):
    keyed = keep_main_sprite(remove_magenta_bg(panel))
    bb = keyed.split()[-1].getbbox()
    if not bb:
        return None
    bw, bh = bb[2] - bb[0], bb[3] - bb[1]
    if bw < 30 or bh < 60:
        return None
    return {
        "im": keyed.crop(bb),
        "bbox": bb,
        "panel_h": panel.height,
        "top": bb[1],
        "bottom": bb[3],
        "h": bh,
        "w": bw,
    }


def place_sprite(sprite, scale, anim, index):
    src = sprite["im"]
    nw = max(1, int(round(src.width * scale)))
    nh = max(1, int(round(src.height * scale)))
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas_w = nw + 10
    canvas = Image.new("RGBA", (canvas_w, TARGET_H), (0, 0, 0, 0))
    if anim == "jump" and index > 0:
        # Keep a clear transparent gap under airborne frames.
        if index == 2:
            dest_top = 12
        elif index == 1:
            dest_top = 36
        else:
            dest_top = 72
        if dest_top + nh > TARGET_H - 36:
            dest_top = max(8, TARGET_H - 36 - nh)
        canvas.paste(resized, (5, dest_top), resized)
    else:
        dest_top = TARGET_H - BOTTOM_MARGIN - nh
        if dest_top < 0:
            dest_top = 0
        canvas.paste(resized, (5, dest_top), resized)
    return canvas


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
    height = pad + 24 + len(all_frames) * (row_h + gap) + pad
    canvas = Image.new("RGBA", (width, height), (28, 28, 32, 255))
    draw = ImageDraw.Draw(canvas)
    font = load_font(28)
    title_font = load_font(22)
    draw.text((pad, 6), "SIMON — pose-bar contact", font=title_font, fill=(230, 230, 230, 255))
    y = pad + 28
    peaks = {("idle", 0), ("punch", 2), ("kick", 2), ("jump", 2), ("block", 0), ("crouch", 0), ("sweep", 2)}
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
            if (anim, i) in peaks:
                tag += " PEAK"
            draw.text((x + 6, y + 4), tag, font=title_font, fill=(180, 255, 180, 255))
            x += col_w + gap
        y += row_h + gap
    canvas.convert("RGB").save(CONTACT, "PNG", optimize=True)
    print("contact", CONTACT, canvas.size)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    extracted = []
    for anim, n in ANIMS:
        src = RAW / f"raw_{FID}_{anim}_sheet.png"
        im = Image.open(src).convert("RGBA")
        sprites = []
        for p in split_panels(im, n):
            sp = extract_sprite(p)
            if sp:
                sprites.append(sp)
        while len(sprites) < n and sprites:
            sprites.append(sprites[-1])
        sprites = sprites[:n]
        extracted.append((anim, sprites))
        print(anim, "raw", [(s["w"], s["h"], f"top={s['top']}") for s in sprites])

    idle_h = max(s["h"] for s in extracted[0][1]) if extracted[0][1] else 400
    tallest = max(s["h"] for _, sprites in extracted for s in sprites)
    scale = (TARGET_H - BOTTOM_MARGIN) / tallest
    print(f"scale {scale:.4f} from tallest={tallest} idle_h={idle_h}")

    all_frames = []
    for anim, sprites in extracted:
        frames = [place_sprite(s, scale, anim, i) for i, s in enumerate(sprites)]
        for i, fr in enumerate(frames):
            dest = OUT / f"fighter_{FID}_{anim}_{i:02d}.png"
            fr.save(dest, "PNG", optimize=True)
        print(anim, [f.size for f in frames])
        all_frames.append((anim, frames))
    build_contact(all_frames)

    print("\n--- silhouette QA (raw keyed bbox) ---")
    for anim, sprites in extracted:
        for i, s in enumerate(sprites):
            print(f"  {anim}_{i:02d} bbox={s['w']}x{s['h']} aspect={s['w']/s['h']:.2f} top={s['top']} bot_gap={s['panel_h']-s['bottom']}")


if __name__ == "__main__":
    main()
