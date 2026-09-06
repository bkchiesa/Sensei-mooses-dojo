#!/usr/bin/env python3
"""Synthesize web-ready arcade SFX + BGM (ogg + mp3) when Tempo stems are absent."""

from __future__ import annotations

import math
import os
import struct
import subprocess
import tempfile
import wave
from pathlib import Path

SR = 22050
ROOT = Path(__file__).resolve().parent


def clamp(x: float, lo: float = -1.0, hi: float = 1.0) -> float:
    return lo if x < lo else hi if x > hi else x


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        frames = b"".join(struct.pack("<h", int(clamp(s) * 32767)) for s in samples)
        wf.writeframes(frames)


def fade(samples: list[float], ms: float = 8) -> list[float]:
    n = max(1, int(SR * ms / 1000))
    out = samples[:]
    for i in range(min(n, len(out))):
        out[i] *= i / n
        out[-1 - i] *= i / n
    return out


def noise(i: int) -> float:
    # Deterministic hash noise (no import random — stable files).
    x = (i * 1103515245 + 12345) & 0x7FFFFFFF
    return (x / 0x7FFFFFFF) * 2 - 1


def env_exp(t: float, decay: float) -> float:
    return math.exp(-t * decay)


def tone(freq: float, dur: float, vol: float = 0.55, decay: float = 8.0, harmonics: tuple[float, ...] = (1.0, 0.35)) -> list[float]:
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        s = 0.0
        for k, h in enumerate(harmonics, start=1):
            s += h * math.sin(2 * math.pi * freq * k * t)
        out.append(s * vol * env_exp(t, decay))
    return fade(out)


def sweep(f0: float, f1: float, dur: float, vol: float = 0.5, decay: float = 6.0) -> list[float]:
    n = int(SR * dur)
    out = []
    phase = 0.0
    for i in range(n):
        t = i / SR
        freq = f0 + (f1 - f0) * (t / dur)
        phase += 2 * math.pi * freq / SR
        out.append(math.sin(phase) * vol * env_exp(t, decay))
    return fade(out)


def thud(dur: float, vol: float = 0.7) -> list[float]:
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        s = 0.85 * math.sin(2 * math.pi * (90 + 40 * (1 - t / dur)) * t)
        s += 0.25 * noise(i) * env_exp(t, 18)
        out.append(s * vol * env_exp(t, 14))
    return fade(out)


def whoosh(dur: float, vol: float = 0.45, high: bool = True) -> list[float]:
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        band = 0.55 + 0.45 * math.sin(2 * math.pi * (high and 18 or 11) * t)
        s = noise(i) * band
        # crude highpass-ish
        if i:
            s = s - out[-1] * (0.35 if high else 0.55)
        out.append(s * vol * env_exp(t, 7 if high else 5))
    return fade(out, 4)


def clack(dur: float = 0.16, vol: float = 0.6) -> list[float]:
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        s = 0.5 * math.sin(2 * math.pi * 1400 * t) + 0.35 * math.sin(2 * math.pi * 880 * t)
        s += 0.25 * noise(i)
        out.append(s * vol * env_exp(t, 22))
    return fade(out, 3)


def chime(freqs: tuple[float, ...], dur: float, vol: float = 0.45) -> list[float]:
    n = int(SR * dur)
    out = [0.0] * n
    for fi, freq in enumerate(freqs):
        delay = int(SR * 0.04 * fi)
        for i in range(max(0, n - delay)):
            t = i / SR
            out[i + delay] += math.sin(2 * math.pi * freq * t) * vol * env_exp(t, 3.2)
    peak = max((abs(x) for x in out), default=1.0)
    return fade([x / peak * vol * 1.6 for x in out])


def concat(*parts: list[float], gap: float = 0.0) -> list[float]:
    pad = [0.0] * int(SR * gap)
    out: list[float] = []
    for p in parts:
        out.extend(p)
        out.extend(pad)
    return out


def mix(*layers: list[float]) -> list[float]:
    n = max(len(l) for l in layers)
    out = [0.0] * n
    for layer in layers:
        for i, s in enumerate(layer):
            out[i] += s
    peak = max((abs(x) for x in out), default=1.0)
    if peak > 0.95:
        out = [x * 0.95 / peak for x in out]
    return fade(out)


def loop_phrase(pattern: list[tuple[float, float, float]], bars: int = 2, bpm: float = 120) -> list[float]:
    """pattern: (freq, beats, vol). Repeat `bars` times and fade the edges."""
    beat = 60.0 / bpm
    phrase: list[float] = []
    for _ in range(bars):
        for freq, beats, vol in pattern:
            if freq <= 0:
                phrase.extend([0.0] * int(SR * beat * beats))
            else:
                phrase.extend(tone(freq, beat * beats * 0.96, vol=vol, decay=4.5, harmonics=(1.0, 0.22, 0.08)))
                phrase.extend([0.0] * int(SR * beat * beats * 0.04))
    return fade(phrase, 12)


def encode(wav_path: Path, ogg: Path, mp3: Path) -> None:
    ogg.parent.mkdir(parents=True, exist_ok=True)
    mp3.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(wav_path), "-c:a", "libvorbis", "-q:a", "4", str(ogg)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(wav_path), "-c:a", "libmp3lame", "-b:a", "96k", str(mp3)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def dump(kind: str, stem: str, samples: list[float]) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / f"{stem}.wav"
        write_wav(wav, samples)
        encode(wav, ROOT / kind / f"{stem}.ogg", ROOT / kind / f"{stem}.mp3")
    print(f"  {kind}/{stem}")


def main() -> None:
    os.chdir(ROOT)
    print("Generating arcade fallback stems…")

    dump("sfx", "punch_miss", whoosh(0.14, 0.42, high=True))
    dump("sfx", "punch_hit", mix(thud(0.16, 0.55), tone(320, 0.12, 0.4, 18)))
    dump("sfx", "kick_miss", whoosh(0.18, 0.48, high=False))
    dump("sfx", "kick_hit", mix(thud(0.22, 0.72), tone(180, 0.16, 0.45, 14)))
    dump("sfx", "sweep", mix(whoosh(0.22, 0.4, high=False), sweep(220, 90, 0.2, 0.35, 7)))
    dump("sfx", "block", clack())
    dump("sfx", "hit", mix(thud(0.14, 0.6), tone(240, 0.1, 0.35, 20)))
    dump("sfx", "jump", sweep(280, 720, 0.22, 0.48, 6))
    dump("sfx", "land", thud(0.18, 0.65))
    dump("sfx", "crouch", tone(140, 0.09, 0.4, 16, (1.0, 0.15)))
    dump("sfx", "ult_ready", chime((523.25, 659.25, 783.99), 0.55, 0.42))
    dump("sfx", "ult_activate", mix(sweep(180, 720, 0.35, 0.5, 4), chime((392, 523.25), 0.4, 0.35)))
    dump("sfx", "ult_impact", mix(thud(0.36, 0.85), tone(110, 0.3, 0.5, 8), tone(55, 0.4, 0.35, 6)))
    dump("sfx", "ko", concat(tone(196, 0.18, 0.5, 6), tone(146.8, 0.22, 0.48, 5), tone(98, 0.4, 0.55, 3)))
    dump("sfx", "fight_banner", chime((392, 523.25, 659.25, 784), 0.7, 0.5))
    dump("sfx", "countdown", tone(880, 0.12, 0.5, 10))
    dump("sfx", "menu_move", tone(660, 0.06, 0.32, 18))
    dump("sfx", "menu_confirm", concat(tone(523.25, 0.07, 0.4, 14), tone(784, 0.12, 0.42, 10)))
    dump("sfx", "char_select", tone(587.33, 0.1, 0.4, 12))
    dump("sfx", "char_locked", tone(140, 0.16, 0.4, 9, (1.0, 0.5)))
    dump("sfx", "round_win", chime((523.25, 659.25, 783.99), 0.55, 0.45))
    dump("sfx", "round_lose", concat(tone(349.23, 0.14, 0.4, 8), tone(261.63, 0.22, 0.4, 6)))
    dump("sfx", "match_win", chime((392, 523.25, 659.25, 783.99, 987.77), 0.9, 0.48))
    dump("sfx", "match_lose", concat(tone(311.13, 0.16, 0.4, 7), tone(233.08, 0.2, 0.38, 6), tone(174.61, 0.35, 0.42, 4)))
    dump("sfx", "next_fight", concat(tone(659.25, 0.08, 0.4, 12), tone(880, 0.12, 0.42, 10)))
    dump("sfx", "unlock", chime((659.25, 783.99, 1046.5), 0.65, 0.45))

    # C major-ish attract (slower). A2=110, C3=130.81, E3=164.81, G3=196
    title = loop_phrase(
        [
            (130.81, 1, 0.28),
            (164.81, 1, 0.26),
            (196.00, 1, 0.28),
            (164.81, 1, 0.24),
            (146.83, 1, 0.26),
            (196.00, 1, 0.28),
            (220.00, 1, 0.26),
            (196.00, 1, 0.24),
        ],
        bars=2,
        bpm=88,
    )
    title_bass = loop_phrase(
        [(65.41, 2, 0.22), (73.42, 2, 0.2), (82.41, 2, 0.22), (73.42, 2, 0.2)],
        bars=2,
        bpm=88,
    )
    dump("bgm", "title_attract_loop", mix(title, title_bass))

    fight_a = loop_phrase(
        [
            (146.83, 0.5, 0.32),
            (174.61, 0.5, 0.3),
            (196.00, 0.5, 0.32),
            (220.00, 0.5, 0.3),
            (196.00, 0.5, 0.3),
            (174.61, 0.5, 0.28),
            (164.81, 0.5, 0.3),
            (146.83, 0.5, 0.28),
        ],
        bars=4,
        bpm=132,
    )
    fight_bass = loop_phrase(
        [(73.42, 1, 0.26), (82.41, 1, 0.24), (87.31, 1, 0.26), (82.41, 1, 0.24)],
        bars=4,
        bpm=132,
    )
    dump("bgm", "fight_a_loop", mix(fight_a, fight_bass))

    fight_b = loop_phrase(
        [
            (164.81, 0.5, 0.3),
            (196.00, 0.5, 0.28),
            (220.00, 0.5, 0.3),
            (246.94, 0.5, 0.28),
            (220.00, 0.5, 0.28),
            (196.00, 0.5, 0.26),
            (174.61, 0.5, 0.28),
            (164.81, 0.5, 0.26),
        ],
        bars=4,
        bpm=128,
    )
    dump("bgm", "fight_b_loop", mix(fight_b, fight_bass))

    fight_c = loop_phrase(
        [
            (130.81, 0.5, 0.3),
            (155.56, 0.5, 0.28),
            (196.00, 0.5, 0.3),
            (233.08, 0.5, 0.28),
            (196.00, 0.5, 0.28),
            (155.56, 0.5, 0.26),
            (146.83, 0.5, 0.28),
            (130.81, 0.5, 0.26),
        ],
        bars=4,
        bpm=124,
    )
    dump("bgm", "fight_c_loop", mix(fight_c, fight_bass))

    dump("bgm", "victory", chime((392, 523.25, 659.25, 783.99, 1046.5), 1.4, 0.5))
    dump("bgm", "defeat", concat(tone(311.13, 0.28, 0.42, 5), tone(233.08, 0.32, 0.4, 4), tone(155.56, 0.7, 0.45, 2.4)))

    dump("vo", "vo_welcome", chime((392, 523.25, 659.25), 0.7, 0.4))
    dump("vo", "vo_round", tone(494, 0.16, 0.45, 8))
    dump("vo", "vo_fight", concat(tone(392, 0.1, 0.45, 10), tone(587, 0.18, 0.48, 8)))
    dump("vo", "vo_ko", concat(tone(220, 0.14, 0.45, 8), tone(110, 0.28, 0.5, 5)))

    print("Done.")


if __name__ == "__main__":
    main()
