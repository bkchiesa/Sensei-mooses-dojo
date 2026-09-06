# Sensei Moose's Dojo — Audio INDEX

**Project:** Phaser web fighter (SF2-style)  
**Style:** Japanese countryside / rural folk–flavored arcade (shamisen · koto · fue vibes). Original procedural synthesis only — no ripped games, songs, samples, or licensed VO.  
**Tech:** 44.1 kHz · OGG (libvorbis) for web delivery · WAV masters in `masters/`  
**Generator:** `generate_batch1.py` (BGM/SFX) · `generate_batch1b.py` (VO) · `generate_batch2.py` (BGM/SFX/VO Batch 2)

---


## Select BGM decision (Brandon LOCKED 2026-09-05)

**Custom `select_loop` DROPPED.** Character select uses the **same audio as fight theme A**.

- Cue `select` / character select → play `bgm/fight_a_loop.ogg` (or the identical `bgm/select_loop.ogg` copy kept for path compatibility).
- `bgm/select_loop.ogg`, `masters/select_loop.wav`, and `listen/select_loop.m4a` are **byte copies of fight_a_loop** — not a separate composition.
- **No further select_loop iterations.**

## Batch status

| Batch | Status | Notes |
|-------|--------|-------|
| **Batch 1** | **READY** | Fight theme A (+ select aliases it) + core combat/UI SFX |
| **Batch 1b** | **READY — listen / lock** | Splash announcer VO + shared fighter grunts (male/female/moose) |
| **Batch 2** | **READY — listen / lock** | Title/attract + fight B/C + victory/defeat stings + movement/UI/ult SFX + announcer shorts |
| Batch 3 | Not started | Suggested: stage ambience beds, special move SFX per fighter, taunts |

> **Brandon:** BGM themes especially need listen/lock before coding wires them as final.  
> **iPad listen copies:** `listen/<basename>.m4a` (AAC) for BGM + VO.  
> **Announcer LOCKED:** male, DEEP, EXCITED arcade — pitch-down + hype processing (not flat espeak).

---

## Folder layout

```
dojo-audio/
  bgm/          Web-ready OGG loops + stingers
  sfx/          Web-ready OGG one-shots
  vo/           Splash + grunts + announcer shorts
  listen/       iPad AAC/M4A listen copies (BGM + VO)
  masters/grunts/  WAV masters for grunt VO
  masters/      WAV masters (same basenames)
  INDEX.md
  generate_batch1.py / generate_batch1b.py / generate_batch2.py
```

---

## BGM (Batch 1 — READY)

| File | Duration | Loop | Cue / intensity | Listen note |
|------|----------|------|-----------------|-------------|
| `bgm/select_loop.ogg` (= copy of `fight_a_loop`) | 32.0 s | **Yes** | Character select — **same audio as fight A** (custom select BGM dropped). Prefer cueing `fight_a_loop` directly. | **LOCKED: alias fight A** |
| `bgm/fight_a_loop.ogg` (+ `masters/fight_a_loop.wav`) | 32.0 s | **Yes** — seamless crossfade seam | Main fight theme A. Energetic arcade ~148 BPM feel, shamisen/koto plucks, driving bass pulse, kick/snare groove, warm major/pentatonic. | **Needs Brandon listen/lock** |

---

## SFX — Core combat (Batch 1 — READY)

| File | Duration | Type | Cue / intensity |
|------|----------|------|-----------------|
| `sfx/punch_hit.ogg` | ~140 ms | One-shot | Punch connects. Sharp mid crack + thud. Medium. |
| `sfx/punch_miss.ogg` | ~120 ms | One-shot | Punch whiff / air whoosh. Light. |
| `sfx/kick_hit.ogg` | ~220 ms | One-shot | Kick connects. Lower thud + body whoosh. Medium-heavy. |
| `sfx/kick_miss.ogg` | ~160 ms | One-shot | Kick whiff. Lower whoosh. Light. |
| `sfx/sweep.ogg` | ~220 ms | One-shot | Sweep / low attack scrape-whoosh. Medium. |
| `sfx/block.ogg` | ~220 ms | One-shot | Guard / block clang + light thud. Medium. |
| `sfx/hit_light.ogg` | ~90 ms | One-shot | Generic light hit confirm (chip / jab). Light. |
| `sfx/hit_heavy.ogg` | ~280 ms | One-shot | Heavy hit / launcher confirm. Heavy. |
| `sfx/ko.ogg` | ~1.35 s | One-shot | KO moment — boom + metallic ring + resolve. High drama. |

---

## SFX — Ultimate & UI (Batch 1 — READY)

| File | Duration | Type | Cue / intensity |
|------|----------|------|-----------------|
| `sfx/ult_ready_charge.ogg` | ~1.40 s | One-shot (or short play-on-ready) | Ultimate meter charged / ready. Rising shimmer + pentatonic chime. Pair with lightning VFX. Medium-high. |
| `sfx/fight_banner.ogg` | ~0.95 s | One-shot | FIGHT banner slam at round start. Slam + brass stab. High. |
| `sfx/match_win.ogg` | ~1.35 s | One-shot | Match victory stinger (uplifting pentatonic fanfare). High / positive. |
| `sfx/match_lose.ogg` | ~1.40 s | One-shot | Match defeat stinger (descending). Medium / somber. |
| `sfx/round_win.ogg` | ~0.65 s | One-shot | Round win — shorter upbeat stinger. Medium-high. |
| `sfx/round_lose.ogg` | ~0.55 s | One-shot | Round lose — shorter descending stinger. Medium. |

WAV masters exist for every Batch 1 asset under `masters/<same_basename>.wav`.

---

## VO — Splash & grunts (Batch 1b — READY)

**Splash line LOCKED by Brandon:** ONLY the words “Welcome to Sensei Moose’s Dojo.”  
Do **not** use “Welcome to Axsom’s Street Fighter” or “Welcome to Axsom Martial Arts.”

| File | Duration | Type | Cue / note |
|------|----------|------|------------|
| `vo/splash_welcome.ogg` (+ `masters/splash_welcome.wav`) | ~2.68 s | Announcer one-shot | Title / splash welcome. Clear arcade announcer. **LOCKED copy.** Warm, punchy, iPad Safari–friendly OGG. |

### Grunt cue table (shared voices)

Three shared voice flavors × punch / kick / hit / ko. Peaks normalized ~−1 to −3 dBFS. WAV masters under `masters/grunts/{male,female,moose}/`.

| File | Duration | Flavor | Cue |
|------|----------|--------|-----|
| `vo/grunts/male/grunt_punch.ogg` | ~140 ms | male | PUNCH effort / reaction. Short arcade grunt. |
| `vo/grunts/male/grunt_kick.ogg` | ~180 ms | male | KICK effort / reaction. Short arcade grunt. |
| `vo/grunts/male/grunt_hit.ogg` | ~160 ms | male | HIT effort / reaction. Short arcade grunt. |
| `vo/grunts/male/grunt_ko.ogg` | ~650 ms | male | KO effort / reaction. Short arcade grunt. |
| `vo/grunts/female/grunt_punch.ogg` | ~140 ms | female | PUNCH effort / reaction. Short arcade grunt. |
| `vo/grunts/female/grunt_kick.ogg` | ~180 ms | female | KICK effort / reaction. Short arcade grunt. |
| `vo/grunts/female/grunt_hit.ogg` | ~160 ms | female | HIT effort / reaction. Short arcade grunt. |
| `vo/grunts/female/grunt_ko.ogg` | ~650 ms | female | KO effort / reaction. Short arcade grunt. |
| `vo/grunts/moose/grunt_punch.ogg` | ~140 ms | moose | PUNCH effort / reaction. Short arcade grunt. |
| `vo/grunts/moose/grunt_kick.ogg` | ~180 ms | moose | KICK effort / reaction. Short arcade grunt. |
| `vo/grunts/moose/grunt_hit.ogg` | ~160 ms | moose | HIT effort / reaction. Short arcade grunt. |
| `vo/grunts/moose/grunt_ko.ogg` | ~650 ms | moose | KO effort / reaction. Short arcade grunt. |

**TTS / synthesis method:** Splash = `espeak-ng` (`en-us+m3`) + EQ / compression / light algorithmic reverb. Grunts = original procedural formant + noise synthesis (no celebrity voices, no ripped samples). Generator: `generate_batch1b.py`.

---

## Technical notes

- **Peaks:** SFX ≈ −1.5 to −3 dBFS; BGM ≈ −3.5 to −4 dBFS (headroom for stacking).
- **Channels:** BGM stereo; SFX mono; VO (splash/grunts) stereo masters exported as OGG.
- **Loops:** Select and fight_a use end→start crossfade seams for seamless looping in Phaser (`loop: true`).
- **Safari / iPad:** Short, compressed OGG; avoid muddy low-end on hits.
- **Regen:** `python3 generate_batch1.py` · `python3 generate_batch1b.py` · `python3 generate_batch2.py`. Requires numpy, scipy, ffmpeg; VO needs `espeak-ng`. Batch 2 also writes `listen/*.m4a` (AAC) for BGM/stingers/VO.
- **Skip-safe:** Batch 2 generator skips any web OGG that already exists (will not overwrite Batch 1 combat SFX or prior VO).

---

## BGM (Batch 2 — READY — **Brandon listen/lock**)

| File | Duration | Loop | Cue / intensity | Listen |
|------|----------|------|-----------------|--------|
| `bgm/title_attract_loop.ogg` (+ masters + `listen/…m4a`) | 30.0 s | **Yes** — crossfade seam | Title / attract. Inviting countryside arcade ~112 BPM, warm yo-scale fue + shamisen, gentle pulse. | **Needs Brandon listen/lock** |
| `bgm/fight_b_loop.ogg` (+ masters + m4a) | 32.0 s | **Yes** | Fight theme B. Distinct from A: A-minor / darker mode, syncopated bass, ~156 BPM, escalate intensity vs A. | **Needs Brandon listen/lock** |
| `bgm/fight_c_loop.ogg` (+ masters + m4a) | 28.0 s | **Yes** | Fight theme C / late arcade. E-minor urgency, ~168 BPM, denser drums + rising motifs. | **Needs Brandon listen/lock** |
| `bgm/victory_sting.ogg` (+ masters + m4a) | 3.2 s | No (one-shot) | Victory stinger — uplifting pentatonic fanfare (longer than `match_win`). | **Needs Brandon listen/lock** |
| `bgm/defeat_sting.ogg` (+ masters + m4a) | 3.4 s | No (one-shot) | Defeat stinger — descending somber resolve (longer than `match_lose`). | **Needs Brandon listen/lock** |

---

## SFX — Ultimate extras (Batch 2 — READY)

| File | Duration | Type | Cue |
|------|----------|------|-----|
| `sfx/ult_activate.ogg` | ~480 ms | One-shot | Ultimate fires / activate whoosh + rising energy. |
| `sfx/ult_impact.ogg` | ~450 ms | One-shot | Ultimate connects — heavy boom + crack. |
| `sfx/ult_meter_tick.ogg` | ~80 ms | One-shot | Meter pip / tick while charging. |

(`ult_ready_charge` remains Batch 1 — not overwritten.)

---

## SFX — Movement (Batch 2 — READY)

| File | Duration | Type | Cue |
|------|----------|------|-----|
| `sfx/jump.ogg` | ~220 ms | One-shot | Jump spring + whoosh. |
| `sfx/land.ogg` | ~140 ms | One-shot | Landing thud. |
| `sfx/crouch.ogg` | ~140 ms | One-shot | Soft crouch / cloth dip. |
| `sfx/footstep.ogg` | ~90 ms | One-shot | Light dojo footstep. |

Skipped (already Batch 1): punch/kick/sweep/block/hit/ko family.

---

## SFX — UI & flow (Batch 2 — READY)

| File | Duration | Type | Cue |
|------|----------|------|-----|
| `sfx/menu_move.ogg` | ~70 ms | One-shot | Menu cursor move blip. |
| `sfx/menu_confirm.ogg` | ~180 ms | One-shot | Menu confirm chime cascade. |
| `sfx/character_select.ogg` | ~280 ms | One-shot | Fighter hover/select pluck. |
| `sfx/character_locked.ogg` | ~350 ms | One-shot | Fighter lock-in. |
| `sfx/fight_countdown_3.ogg` | ~220 ms | One-shot | Beep “3” (tone). Pair with VO. |
| `sfx/fight_countdown_2.ogg` | ~220 ms | One-shot | Beep “2”. |
| `sfx/fight_countdown_1.ogg` | ~220 ms | One-shot | Beep “1”. |
| `sfx/unlock_boss.ogg` | ~1.10 s | One-shot | Boss unlock shimmer + boom. |
| `sfx/next_fight_button.ogg` | ~350 ms | One-shot | Next-fight UI affirm. |

---

## VO — Announcer shorts (Batch 2 — READY)

**Character LOCKED:** male, DEEP, EXCITED arcade announcer (espeak-ng base → pitch-down ≈ −3.5 to −4 semitones + chest EQ + compression + slap reverb). Not flat TTS.

| File | Duration | Cue | Listen |
|------|----------|-----|--------|
| `vo/announcer_3.ogg` | ~0.56 s | Countdown “3” | `listen/announcer_3.m4a` |
| `vo/announcer_2.ogg` | ~0.49 s | Countdown “2” | m4a |
| `vo/announcer_1.ogg` | ~0.57 s | Countdown “1” | m4a |
| `vo/announcer_fight.ogg` | ~0.64 s | “FIGHT!” | m4a |
| `vo/announcer_you_win.ogg` | ~0.90 s | “YOU WIN!” | m4a |
| `vo/announcer_you_lose.ogg` | ~1.02 s | “YOU LOSE!” | m4a |

Splash `vo/splash_welcome.ogg` left for parallel deep-voice re-cut if needed (Batch 1b asset; not overwritten by Batch 2).

---

## Suggested Batch 3

1. **Stage ambience loops:** dojo courtyard, bamboo grove, night festival beds (low-level, loopable).
2. **Per-fighter special / ultimate SFX variants** (still original procedural).
3. **Extra UI:** `menu_back`, `pause_open`, `pause_close`, `timer_beep`, `perfect_sting`, `time_over`.
4. **Combat extras:** `grab`, `throw`, `wall_splat`, `parry`, `dizzy`.
5. **VO:** “Round 1/2/3”, “Perfect”, “Sensei Moose Wins” (same deep/excited announcer), optional taunt stubs.
6. Wire-ready loudness pass / ducking beds once Brandon locks BGM.

---

*Last updated: 2026-09-05 (select_loop aliased to fight_a_loop; splash_welcome LOCKED — do not overwrite)*
