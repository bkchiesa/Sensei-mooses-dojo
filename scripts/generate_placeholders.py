#!/usr/bin/env python3
"""Generate drop-in PNG placeholders for Sensei Moose's Dojo asset names."""

from __future__ import annotations

import os
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "SenseiMoosesDojo" / "Assets.xcassets"


def write_png(path: Path, width: int, height: int, pixels: list[tuple[int, int, int, int]]) -> None:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = bytearray()
    for y in range(height):
        raw.append(0)
        row = y * width
        for x in range(width):
            raw.extend(pixels[row + x])
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    )


class Canvas:
    def __init__(self, w: int, h: int, bg: tuple[int, int, int, int] = (0, 0, 0, 0)) -> None:
        self.w = w
        self.h = h
        self.p = [bg] * (w * h)

    def set(self, x: int, y: int, c: tuple[int, int, int, int]) -> None:
        if 0 <= x < self.w and 0 <= y < self.h and (c[3] > 0 or True):
            if c[3] == 0:
                self.p[y * self.w + x] = c
            elif c[3] == 255:
                self.p[y * self.w + x] = c
            else:
                r, g, b, a = c
                br, bg, bb, ba = self.p[y * self.w + x]
                t = a / 255.0
                self.p[y * self.w + x] = (
                    int(r * t + br * (1 - t)),
                    int(g * t + bg * (1 - t)),
                    int(b * t + bb * (1 - t)),
                    max(ba, a),
                )

    def fill(self, x: int, y: int, w: int, h: int, c: tuple[int, int, int, int]) -> None:
        for j in range(h):
            for i in range(w):
                self.set(x + i, y + j, c)

    def rect(self, x: int, y: int, w: int, h: int, c: tuple[int, int, int, int]) -> None:
        self.fill(x, y, w, 1, c)
        self.fill(x, y + h - 1, w, 1, c)
        self.fill(x, y, 1, h, c)
        self.fill(x + w - 1, y, 1, h, c)

    def vline(self, x: int, y0: int, y1: int, c: tuple[int, int, int, int]) -> None:
        for y in range(min(y0, y1), max(y0, y1) + 1):
            self.set(x, y, c)

    def hline(self, y: int, x0: int, x1: int, c: tuple[int, int, int, int]) -> None:
        for x in range(min(x0, x1), max(x0, x1) + 1):
            self.set(x, y, c)

    def scale(self, factor: int) -> Canvas:
        out = Canvas(self.w * factor, self.h * factor)
        for y in range(self.h):
            for x in range(self.w):
                c = self.p[y * self.w + x]
                out.fill(x * factor, y * factor, factor, factor, c)
        return out

    def save(self, path: Path) -> None:
        write_png(path, self.w, self.h, self.p)


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def gradient_v(w: int, h: int, top: tuple[int, int, int], bot: tuple[int, int, int]) -> Canvas:
    c = Canvas(w, h)
    for y in range(h):
        t = y / max(h - 1, 1)
        col = (lerp(top[0], bot[0], t), lerp(top[1], bot[1], t), lerp(top[2], bot[2], t), 255)
        c.fill(0, y, w, 1, col)
    return c


def write_imageset(name: str, canvas: Canvas) -> None:
    folder = ASSETS / f"{name}.imageset"
    folder.mkdir(parents=True, exist_ok=True)
    png = folder / f"{name}.png"
    canvas.save(png)
    (folder / "Contents.json").write_text(
        """{
  "images" : [
    {
      "filename" : "%s.png",
      "idiom" : "universal",
      "scale" : "1x"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  },
  "properties" : {
    "template-rendering-intent" : "original"
  }
}
"""
        % name
    )


# --- palette ---
CLEAR = (0, 0, 0, 0)
INK = (28, 18, 14, 255)
WHITE = (246, 242, 232, 255)
GI = (236, 228, 210, 255)
BELT = (28, 22, 20, 255)
MOOSE = (122, 72, 38, 255)
MOOSE_DK = (78, 42, 20, 255)
MOOSE_LT = (176, 120, 70, 255)
ANTLER = (92, 58, 32, 255)
SNOUT = (210, 168, 112, 255)
NOSE = (40, 24, 18, 255)


def draw_moose_jump(w: int = 48, h: int = 52) -> Canvas:
    """Closed-gi jump pose (title pose B)."""
    c = Canvas(w, h)
    # antlers
    c.fill(10, 2, 2, 8, ANTLER)
    c.fill(8, 2, 4, 2, ANTLER)
    c.fill(7, 4, 2, 3, ANTLER)
    c.fill(12, 3, 3, 2, ANTLER)
    c.fill(36, 2, 2, 8, ANTLER)
    c.fill(36, 2, 4, 2, ANTLER)
    c.fill(39, 4, 2, 3, ANTLER)
    c.fill(33, 3, 3, 2, ANTLER)
    # head
    c.fill(14, 8, 20, 14, MOOSE)
    c.fill(16, 7, 16, 2, MOOSE)
    c.fill(18, 20, 12, 3, MOOSE)
    # ears
    c.fill(13, 9, 3, 4, MOOSE_DK)
    c.fill(32, 9, 3, 4, MOOSE_DK)
    # snout
    c.fill(19, 15, 10, 6, SNOUT)
    c.fill(22, 20, 4, 2, NOSE)
    # closed determined eyes
    c.fill(17, 13, 4, 2, INK)
    c.fill(27, 13, 4, 2, INK)
    # gi (closed)
    c.fill(16, 23, 16, 14, GI)
    c.fill(17, 22, 14, 2, GI)
    # closed lapels
    c.vline(23, 23, 34, INK)
    c.vline(24, 23, 34, WHITE)
    c.fill(16, 23, 16, 1, INK)
    # belt
    c.fill(16, 33, 16, 3, BELT)
    c.fill(21, 33, 6, 4, BELT)
    # arms out (jump)
    c.fill(8, 25, 8, 4, GI)
    c.fill(6, 24, 4, 4, MOOSE)
    c.fill(32, 25, 8, 4, GI)
    c.fill(38, 24, 4, 4, MOOSE)
    # tucked jumping legs
    c.fill(18, 37, 5, 8, GI)
    c.fill(25, 37, 5, 8, GI)
    c.fill(17, 43, 6, 4, MOOSE_DK)
    c.fill(25, 43, 6, 4, MOOSE_DK)
    return c


def draw_moose_body() -> Canvas:
    c = Canvas(40, 36)
    c.fill(12, 2, 16, 18, GI)
    c.vline(19, 2, 18, INK)
    c.vline(20, 2, 18, WHITE)
    c.fill(12, 16, 16, 3, BELT)
    c.fill(10, 6, 6, 4, GI)
    c.fill(24, 6, 6, 4, GI)
    c.fill(8, 6, 4, 4, MOOSE)
    c.fill(28, 6, 4, 4, MOOSE)
    c.fill(14, 20, 5, 10, GI)
    c.fill(21, 20, 5, 10, GI)
    c.fill(13, 28, 6, 4, MOOSE_DK)
    c.fill(21, 28, 6, 4, MOOSE_DK)
    return c


def draw_moose_head() -> Canvas:
    c = Canvas(40, 28)
    c.fill(8, 2, 2, 8, ANTLER)
    c.fill(6, 2, 4, 2, ANTLER)
    c.fill(30, 2, 2, 8, ANTLER)
    c.fill(30, 2, 4, 2, ANTLER)
    c.fill(12, 8, 16, 13, MOOSE)
    c.fill(11, 9, 3, 4, MOOSE_DK)
    c.fill(26, 9, 3, 4, MOOSE_DK)
    c.fill(15, 14, 10, 6, SNOUT)
    c.fill(18, 19, 4, 2, NOSE)
    c.fill(14, 12, 4, 2, INK)
    c.fill(22, 12, 4, 2, INK)
    return c


FIGHTERS = {
    "matt": {"gi": (196, 52, 38, 255), "hair": (72, 42, 24, 255), "skin": (224, 176, 128, 255), "accent": (255, 210, 80, 255)},
    "simon": {"gi": (32, 68, 140, 255), "hair": (212, 176, 72, 255), "skin": (232, 188, 142, 255), "accent": (120, 200, 255, 255)},
    "rich": {"gi": (36, 110, 62, 255), "hair": (24, 18, 14, 255), "skin": (198, 148, 104, 255), "accent": (90, 220, 140, 255)},
    "amanda": {"gi": (118, 48, 150, 255), "hair": (48, 28, 40, 255), "skin": (228, 170, 130, 255), "accent": (230, 160, 255, 255)},
    "jb": {"gi": (196, 154, 36, 255), "hair": (96, 72, 48, 255), "skin": (214, 164, 118, 255), "accent": (255, 230, 120, 255)},
}


def draw_fighter_idle(fid: str) -> Canvas:
    pal = FIGHTERS[fid]
    c = Canvas(32, 48)
    gi, hair, skin = pal["gi"], pal["hair"], pal["skin"]
    # head
    c.fill(11, 4, 10, 10, skin)
    c.fill(11, 3, 10, 5, hair)
    if fid == "amanda":
        c.fill(9, 6, 3, 8, hair)
        c.fill(20, 6, 3, 8, hair)
        c.fill(10, 13, 3, 3, pal["accent"])
    if fid == "rich":
        c.fill(12, 12, 8, 3, hair)  # beard
    if fid == "jb":
        c.fill(11, 3, 10, 3, (180, 160, 120, 255))  # lighter crop
    # eyes
    c.fill(13, 8, 2, 2, INK)
    c.fill(17, 8, 2, 2, INK)
    # torso gi
    c.fill(10, 15, 12, 14, gi)
    c.vline(15, 15, 26, WHITE)
    c.vline(16, 15, 26, INK)
    c.fill(10, 26, 12, 3, BELT)
    # arms
    c.fill(6, 16, 4, 10, gi)
    c.fill(22, 16, 4, 10, gi)
    c.fill(6, 24, 4, 3, skin)
    c.fill(22, 24, 4, 3, skin)
    # legs
    c.fill(11, 29, 4, 12, gi)
    c.fill(17, 29, 4, 12, gi)
    c.fill(10, 39, 5, 4, INK)
    c.fill(17, 39, 5, 4, INK)
    # stance offset
    c.fill(9, 41, 6, 3, INK)
    c.fill(17, 41, 6, 3, INK)
    return c


def draw_fighter_portrait(fid: str) -> Canvas:
    pal = FIGHTERS[fid]
    c = Canvas(40, 40, pal["gi"])
    hair, skin = pal["hair"], pal["skin"]
    c.fill(10, 8, 20, 22, skin)
    c.fill(10, 6, 20, 10, hair)
    if fid == "amanda":
        c.fill(8, 10, 4, 14, hair)
        c.fill(28, 10, 4, 14, hair)
    if fid == "rich":
        c.fill(12, 24, 16, 5, hair)
    c.fill(15, 16, 3, 3, INK)
    c.fill(22, 16, 3, 3, INK)
    c.fill(17, 22, 6, 3, (180, 90, 80, 255))
    # gi collar
    c.fill(8, 30, 24, 10, pal["gi"])
    c.fill(18, 30, 4, 10, WHITE)
    c.rect(0, 0, 40, 40, pal["accent"])
    return c


def draw_stage_sky(w: int = 320, h: int = 180) -> Canvas:
    # Lions Bridge mood B — dusk / amber
    c = gradient_v(w, h, (255, 150, 70), (88, 42, 92))
    # sun
    for y in range(h):
        for x in range(w):
            dx, dy = x - 230, y - 48
            if dx * dx + dy * dy < 280:
                c.set(x, y, (255, 220, 120, 255))
            elif dx * dx + dy * dy < 420:
                c.set(x, y, (255, 180, 90, 180))
    # clouds
    cloud = (255, 200, 170, 160)
    c.fill(20, 28, 50, 8, cloud)
    c.fill(30, 22, 28, 8, cloud)
    c.fill(140, 18, 60, 7, cloud)
    return c


def draw_stage_far(w: int = 320, h: int = 180) -> Canvas:
    c = Canvas(w, h)
    ridge = (72, 38, 68, 255)
    for x in range(w):
        y = int(88 + 10 * ((x / 40) % 2) + 6 * ((x // 70) % 3))
        c.fill(x, y, 1, h - y, ridge)
    # far trees
    tree = (48, 28, 50, 255)
    for x in range(8, w, 22):
        c.fill(x, 100, 3, 30, tree)
        c.fill(x - 4, 96, 11, 10, tree)
    return c


def draw_stage_mid(w: int = 320, h: int = 180) -> Canvas:
    c = Canvas(w, h)
    water_top = (48, 70, 110)
    water_bot = (24, 36, 64)
    for y in range(118, h):
        t = (y - 118) / max(h - 119, 1)
        col = (lerp(water_top[0], water_bot[0], t), lerp(water_top[1], water_bot[1], t), lerp(water_top[2], water_bot[2], t), 255)
        c.fill(0, y, w, 1, col)
    # reflections
    for x in range(0, w, 16):
        c.fill(x, 124, 8, 2, (255, 170, 90, 80))
    return c


def draw_stage_master(w: int = 320, h: int = 180) -> Canvas:
    """Bridge / lions plate only (transparent) so it stacks over sky/far/mid."""
    c = Canvas(w, h)
    stone = (118, 86, 70, 255)
    stone_dk = (78, 52, 42, 255)
    gold = (212, 168, 64, 255)
    # bridge deck
    c.fill(0, 108, w, 14, stone)
    c.fill(0, 108, w, 2, stone_dk)
    # arches
    for ax in (40, 120, 200, 280):
        c.fill(ax - 18, 122, 36, 28, stone_dk)
        c.fill(ax - 10, 128, 20, 22, (30, 40, 70, 255))
    # lion statues
    lion = (168, 130, 78, 255)
    for lx in (36, 268):
        c.fill(lx, 86, 16, 22, lion)
        c.fill(lx + 2, 80, 10, 8, lion)
        c.fill(lx + 10, 88, 10, 4, lion)  # snout
        c.fill(lx + 4, 82, 2, 2, INK)
        c.fill(lx, 78, 3, 6, gold)  # mane hint
        c.fill(lx + 4, 104, 4, 6, lion)
        c.fill(lx + 10, 104, 4, 6, lion)
    # lantern posts
    for px in (90, 160, 230):
        c.fill(px, 86, 3, 22, stone_dk)
        c.fill(px - 3, 80, 9, 8, (230, 140, 50, 255))
    return c


def draw_stage_near(w: int = 320, h: int = 180) -> Canvas:
    c = Canvas(w, h)
    rail = (54, 32, 24, 255)
    c.fill(0, 150, w, 6, rail)
    for x in range(8, w, 18):
        c.fill(x, 138, 3, 18, rail)
    # foreground lanterns
    c.fill(12, 120, 8, 12, (255, 160, 60, 220))
    c.fill(300, 118, 8, 12, (255, 160, 60, 220))
    c.fill(0, 168, w, 12, (40, 24, 18, 255))
    return c


def draw_app_icon() -> Canvas:
    c = Canvas(1024, 1024, (42, 22, 58, 255))
    moose = draw_moose_jump().scale(16)
    ox = (1024 - moose.w) // 2
    oy = (1024 - moose.h) // 2 - 20
    for y in range(moose.h):
        for x in range(moose.w):
            px = moose.p[y * moose.w + x]
            if px[3] > 0:
                c.set(ox + x, oy + y, px)
    return c


def write_app_icon() -> None:
    folder = ASSETS / "AppIcon.appiconset"
    folder.mkdir(parents=True, exist_ok=True)
    draw_app_icon().save(folder / "AppIcon.png")
    (folder / "Contents.json").write_text(
        """{
  "images" : [
    {
      "filename" : "AppIcon.png",
      "idiom" : "universal",
      "platform" : "ios",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
"""
    )


def write_catalog_root() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    (ASSETS / "Contents.json").write_text(
        """{
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
"""
    )
    accent = ASSETS / "AccentColor.colorset"
    accent.mkdir(parents=True, exist_ok=True)
    (accent / "Contents.json").write_text(
        """{
  "colors" : [
    {
      "color" : {
        "color-space" : "srgb",
        "components" : {
          "alpha" : "1.000",
          "blue" : "0.220",
          "green" : "0.620",
          "red" : "0.930"
        }
      },
      "idiom" : "universal"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
"""
    )


def main() -> None:
    write_catalog_root()
    write_app_icon()

    write_imageset("moose_title_idle", draw_moose_jump().scale(6))
    write_imageset("moose_title_body", draw_moose_body().scale(6))
    write_imageset("moose_title_head", draw_moose_head().scale(6))

    for fid in FIGHTERS:
        write_imageset(f"fighter_{fid}_idle_00", draw_fighter_idle(fid).scale(6))
        write_imageset(f"fighter_{fid}_portrait", draw_fighter_portrait(fid).scale(4))

    write_imageset("stage1_sky", draw_stage_sky().scale(4))
    write_imageset("stage1_far", draw_stage_far().scale(4))
    write_imageset("stage1_mid", draw_stage_mid().scale(4))
    write_imageset("stage1_master", draw_stage_master().scale(4))
    write_imageset("stage1_near", draw_stage_near().scale(4))

    print(f"Wrote placeholders under {ASSETS}")


if __name__ == "__main__":
    main()
