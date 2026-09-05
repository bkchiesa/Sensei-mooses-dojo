#!/usr/bin/env python3
"""Structural checks for the Xcode project (no xcodebuild required)."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PBX = ROOT / "SenseiMoosesDojo.xcodeproj" / "project.pbxproj"
SCHEME = ROOT / "SenseiMoosesDojo.xcodeproj" / "xcshareddata" / "xcschemes" / "SenseiMoosesDojo.xcscheme"
SRC = ROOT / "SenseiMoosesDojo"
ASSETS = SRC / "Assets.xcassets"

REQUIRED_SWIFT = [
    "AppDelegate.swift",
    "SceneDelegate.swift",
    "GameViewController.swift",
    "Game/Roster.swift",
    "Game/BossRoster.swift",
    "Game/UnlockStore.swift",
    "Game/ArcadeLadder.swift",
    "Game/Stage.swift",
    "Game/Art.swift",
    "Game/SceneRouter.swift",
    "Game/FighterActor.swift",
    "Game/VirtualControls.swift",
    "Game/LeaderboardService.swift",
    "Scenes/TitleScene.swift",
    "Scenes/CharacterSelectScene.swift",
    "Scenes/FightScene.swift",
    "Scenes/LeaderboardScene.swift",
]

REQUIRED_ASSETS = [
    "moose_title_idle",
    "moose_title_body",
    "moose_title_head",
    "stage1_master",
    "stage1_sky",
    "stage1_far",
    "stage1_mid",
    "stage1_near",
    "stage2_master",
    "stage3_master",
]
for _id in ("matt", "simon", "rich", "amanda", "jb"):
    REQUIRED_ASSETS.append(f"fighter_{_id}_portrait")
    REQUIRED_ASSETS.append(f"fighter_{_id}_idle_00")

SCENE_TOKENS = {
    "Scenes/TitleScene.swift": ["Sensei Moose's Dojo", "TAP FOR ARCADE", "mooseTitle", "leaderboard", "free-play"],
    "Scenes/CharacterSelectScene.swift": ["CHOOSE YOUR FIGHTER", "UnlockStore.starters", "freePlay"],
    "Game/UnlockStore.swift": ["UnlockStore", "UserDefaults", "unlock"],
    "Game/ArcadeLadder.swift": ["BossID.ladder", "lionsBridge"],
    "Game/BossRoster.swift": ["case misty", "case johnk", "case jaylen", "case senseiMoose", "boss_", "batch1", "batch2", "batch3", "ladder"],
    "Game/Roster.swift": ["case matt", "case simon", "case rich", "case amanda", "case jb", "PlayableFighter"],
    "Scenes/FightScene.swift": ["masterName", "REMATCH", "VirtualControls", "submit-score", "UnlockStore.unlock", "NEXT:"],
    "Scenes/LeaderboardScene.swift": ["TOP 10", "LeaderboardService"],
    "Game/LeaderboardService.swift": ["com.sensiemoose.dojo.top10", "GKLocalPlayer", "UserDefaults"],
    "Game/Art.swift": ["moose_title_idle", "moose_title_body", "moose_title_head"],
    "Game/Stage.swift": ["lionsBridge", "hiltonElementary", "axsomDojo", "stage1"],
    "Game/VirtualControls.swift": ["PUNCH", "KICK", "JUMP"],
}


def fail(msg: str) -> None:
    print(f"FAIL: {msg}")
    raise SystemExit(1)


def main() -> None:
    if not PBX.is_file():
        fail(f"missing {PBX}")
    pbx = PBX.read_text()
    if "isa = PBXProject" not in pbx or "SenseiMoosesDojo" not in pbx:
        fail("project.pbxproj does not look like an Xcode project")
    if not SCHEME.is_file():
        fail(f"missing shared scheme {SCHEME}")

    for rel in REQUIRED_SWIFT:
        path = SRC / rel
        if not path.is_file():
            fail(f"missing source {rel}")
        name = Path(rel).name
        if f"path = {name};" not in pbx:
            fail(f"{name} not referenced in project.pbxproj")
        if "in Sources" not in pbx or name not in pbx:
            fail(f"{name} not in pbxproj sources")

    if "Assets.xcassets in Resources" not in pbx:
        fail("Assets.xcassets not in Resources build phase")
    if not (SRC / "Info.plist").is_file():
        fail("missing Info.plist")
    if "INFOPLIST_FILE = SenseiMoosesDojo/Info.plist" not in pbx:
        fail("target does not point at Info.plist")
    if "GameKit.framework in Frameworks" not in pbx:
        fail("GameKit.framework is not linked")

    for token_file, tokens in SCENE_TOKENS.items():
        text = (SRC / token_file).read_text()
        for token in tokens:
            if token not in text:
                fail(f"{token_file} missing expected token {token!r}")

    for name in REQUIRED_ASSETS:
        folder = ASSETS / f"{name}.imageset"
        png = folder / f"{name}.png"
        contents = folder / "Contents.json"
        if not contents.is_file():
            fail(f"missing imageset Contents.json for {name}")
        if not png.is_file() or png.stat().st_size < 32:
            fail(f"missing/empty placeholder PNG for {name}")
        if f"{name}.png" not in contents.read_text():
            fail(f"{name} Contents.json does not point at {name}.png")

    # IDs used by code
    roster = (SRC / "Game/Roster.swift").read_text()
    for fid in ("matt", "simon", "rich", "amanda", "jb"):
        if f"case {fid}" not in roster:
            fail(f"Roster missing case {fid}")

    print("OK: Xcode project structure, scenes, roster, and named assets check out.")
    print(f"  sources: {len(REQUIRED_SWIFT)}")
    print(f"  assets:  {len(REQUIRED_ASSETS)}")


if __name__ == "__main__":
    main()
