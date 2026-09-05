import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD, GOLD_NUM } from "../config";
import { dummyOpponent, slotName, STARTERS, STAGES, stageById, type FighterDef, type StageDef } from "../data/catalog";
import { PIXEL_PLATE_PX, isFramedSelectPlate, selectMapChrome } from "../data/peninsula";
import { arcadeStart } from "../game/arcade";
import { PeninsulaMap } from "../game/peninsulaMap";
import { applyQueryUnlocks, selectRoster } from "../game/storage";
import { textStyle } from "../game/ui";

interface PlateMeta {
  file?: string | null;
  screen?: string | null;
  variant?: string | null;
}

export type SelectMode = "arcade" | "freePlay";
export type SelectPhase = "player" | "opponent" | "stage";

interface SelectData {
  mode?: SelectMode;
  phase?: SelectPhase;
  player?: FighterDef;
  opponent?: FighterDef;
}

export class SelectScene extends Phaser.Scene {
  private mode: SelectMode = "arcade";
  private phase: SelectPhase = "player";
  private playerPick: FighterDef | null = null;
  private opponentPick: FighterDef | null = null;
  private selected: FighterDef | null = null;
  private selectedStage: StageDef | null = null;
  private cards = new Map<string, Phaser.GameObjects.Container>();
  private map?: PeninsulaMap;
  private fightLabel!: Phaser.GameObjects.Text;
  private goTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super("Select");
  }

  init(data: SelectData): void {
    this.mode = data.mode ?? "arcade";
    this.phase = data.phase ?? "player";
    this.playerPick = data.player ?? null;
    this.opponentPick = data.opponent ?? null;
    this.selected = this.phase === "player" ? (data.player ?? STARTERS[0]) : this.phase === "opponent" ? null : (data.player ?? null);
    this.selectedStage = null;
    this.cards.clear();
    this.map = undefined;
    this.fightLabel = undefined as unknown as Phaser.GameObjects.Text;
    this.goTimer = undefined;
  }

  create(): void {
    applyQueryUnlocks();
    this.cameras.main.setBackgroundColor(0x2c2a58);
    this.maybeLoadMapArt(() => this.buildLayout());
  }

  private maybeLoadMapArt(then: () => void): void {
    if (this.hasSelectArt()) {
      then();
      return;
    }
    void fetch("assets/ui/select/plate.json")
      .then((res) => (res.ok ? res.json() : { file: "hampton-roads-map.svg" }))
      .catch(() => ({ file: "hampton-roads-map.svg" }))
      .then((meta: PlateMeta) => {
        if (!this.sys.isActive() || this.fightLabel) return;
        if (this.hasSelectArt()) {
          then();
          return;
        }
        let queued = 0;
        const enqueue = (key: string, file: string) => {
          if (this.textures.exists(key) && this.textureWide(key)) return;
          const url = `assets/ui/select/${file}`;
          if (file.endsWith(".svg")) this.load.svg(key, url, PIXEL_PLATE_PX);
          else this.load.image(key, url);
          queued += 1;
        };
        const plate = meta.file || "select-map-plate-C.png";
        const screen = meta.screen || "select-screen-C.png";
        enqueue("ui-select-map", plate);
        enqueue("ui-select-screen", screen);
        if (!queued) {
          then();
          return;
        }
        this.load.once("complete", () => then());
        this.load.once("loaderror", () => then());
        this.load.start();
      });
  }

  private hasSelectArt(): boolean {
    return this.textureWide("ui-select-map") || this.textureWide("ui-select-screen");
  }

  private textureWide(key: string): boolean {
    if (!this.textures.exists(key)) return false;
    const src = this.textures.get(key).getSourceImage() as { width?: number };
    return Boolean(src?.width && src.width >= 8);
  }

  private buildLayout(): void {
    if (!this.sys.isActive() || this.fightLabel) return;
    this.buildWash();
    this.buildNav();
    this.buildPortraits();
    this.buildMap();
    this.buildPlayerSelectLabel();
    if (this.phase === "stage") this.buildStageHint();
    else this.buildGrid();
    this.fightLabel = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 22, this.idlePrompt(), {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#b8b0c8",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.fightLabel.on("pointerup", () => this.confirm());
    this.syncMapHighlight();
  }

  private idlePrompt(): string {
    if (this.phase === "stage") return "TAP A MAP DOT  ·  CHOOSE STAGE";
    if (this.phase === "opponent") return "SELECT OPPONENT";
    return "SELECT A FIGHTER";
  }

  private buildWash(): void {
    this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x2c2a58, 1);
    if (this.textureWide("ui-select-screen")) {
      const src = this.textures.get("ui-select-screen").getSourceImage() as { width: number; height: number };
      const art = this.add.image(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, "ui-select-screen");
      const scale = Math.max(DESIGN_WIDTH / src.width, DESIGN_HEIGHT / src.height);
      art.setDisplaySize(src.width * scale, src.height * scale);
      art.setAlpha(0.88);
      this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x140d1f, 0.28);
      return;
    }
    for (let i = 0; i < 7; i++) {
      this.add
        .text(-80 + i * 220, 40 + (i % 2) * 80, "SENSEI MOOSE'S DOJO", {
          fontFamily: FONT,
          fontSize: "22px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setAlpha(0.045)
        .setAngle(-18);
    }
  }

  private buildNav(): void {
    const heading =
      this.phase === "stage"
        ? "FREE PLAY"
        : this.phase === "opponent"
          ? "FREE PLAY"
          : this.mode === "arcade"
            ? "ARCADE"
            : "FREE PLAY";
    this.add.text(DESIGN_WIDTH / 2, 22, heading, textStyle(18, GOLD)).setOrigin(0.5);

    const back = this.add.text(28, 14, "← TITLE", textStyle(14, "#d9d9d9")).setInteractive({ useHandCursor: true });
    back.on("pointerup", () => this.scene.start("Title"));

    if (this.mode === "arcade") {
      const free = this.add
        .text(DESIGN_WIDTH - 28, 14, "FREE PLAY →", textStyle(14, "#d9d9d9"))
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      free.on("pointerup", () => this.scene.start("Select", { mode: "freePlay" }));
    } else if (this.phase === "stage") {
      const backOpp = this.add
        .text(DESIGN_WIDTH - 28, 14, "← OPPONENT", textStyle(14, "#d9d9d9"))
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      backOpp.on("pointerup", () =>
        this.scene.start("Select", { mode: "freePlay", phase: "opponent", player: this.playerPick }),
      );
    } else if (this.phase === "opponent") {
      const backPick = this.add
        .text(DESIGN_WIDTH - 28, 14, "← FIGHTER", textStyle(14, "#d9d9d9"))
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      backPick.on("pointerup", () => this.scene.start("Select", { mode: "freePlay" }));
    } else {
      const arcade = this.add
        .text(DESIGN_WIDTH - 28, 14, "← ARCADE", textStyle(14, "#d9d9d9"))
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      arcade.on("pointerup", () => this.scene.start("Select", { mode: "arcade" }));
    }
  }

  private buildPortraits(): void {
    const left = this.selected ?? this.playerPick;
    const right =
      this.phase === "player"
        ? this.mode === "arcade"
          ? dummyOpponent(left ?? STARTERS[0])
          : this.opponentPick
        : this.phase === "opponent"
          ? this.selected
          : this.opponentPick;
    this.drawBust(160, 210, left, true, this.phase === "player" ? "1P  ·  YOU" : "1P  ·  YOU");
    this.drawBust(
      DESIGN_WIDTH - 160,
      210,
      right,
      false,
      this.phase === "player" && this.mode === "arcade" ? "CPU" : "2P  ·  CPU",
    );
  }

  private drawBust(x: number, y: number, fighter: FighterDef | null | undefined, isP1: boolean, tag: string): void {
    const color = isP1 ? 0xd43c3c : GOLD_NUM;
    const frame = this.add.rectangle(x, y, 220, 300, 0x141028, 0.92).setStrokeStyle(4, color);
    void frame;
    if (fighter && this.hasTex(fighter.portrait)) {
      const img = this.add.image(x, y - 18, fighter.portrait);
      const s = Math.min(200 / img.width, 210 / img.height);
      img.setScale(s);
    } else if (fighter && this.hasTex(fighter.idle)) {
      const img = this.add.image(x, y - 10, fighter.idle);
      const s = Math.min(180 / img.width, 200 / img.height);
      img.setScale(s);
    } else {
      this.add.rectangle(x, y - 20, 160, 190, 0x2a2438);
      this.add.text(x, y - 20, "?", textStyle(64, "#666")).setOrigin(0.5);
    }
    const name = fighter?.displayName.toUpperCase() ?? "…";
    this.add
      .text(x, y + 118, name, {
        fontFamily: FONT,
        fontSize: name.length > 12 ? "18px" : "22px",
        color: isP1 ? "#ff8a7a" : GOLD,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add.text(x, y + 142, tag, textStyle(13, isP1 ? "#ffb0a4" : "#ffe7a0")).setOrigin(0.5);
    if (fighter) {
      this.add.text(x, y + 160, stageById(fighter.stageId).displayName.toUpperCase(), textStyle(11, "#c8c0d4")).setOrigin(0.5);
    }
  }

  private buildMap(): void {
    const src = this.textureWide("ui-select-map")
      ? (this.textures.get("ui-select-map").getSourceImage() as { width?: number; height?: number })
      : null;
    const framed = isFramedSelectPlate(src?.width, src?.height);
    const chrome = selectMapChrome(framed);
    const interactive = this.phase === "stage";
    this.map = new PeninsulaMap(
      this,
      { x: DESIGN_WIDTH / 2, y: framed ? 198 : 205, w: chrome.w, h: chrome.h },
      (id) => this.onMapDot(id),
      interactive,
    );
  }

  private buildPlayerSelectLabel(): void {
    this.add
      .text(DESIGN_WIDTH / 2, 400, "PLAYER SELECT", {
        fontFamily: FONT,
        fontSize: "28px",
        color: GOLD,
        fontStyle: "bold",
        stroke: "#1a1020",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    const sub =
      this.phase === "stage"
        ? "HAMPTON ROADS  ·  TAP A LANDMARK"
        : this.phase === "opponent"
          ? "CHOOSE OPPONENT"
          : this.mode === "arcade"
            ? "CHOOSE YOUR FIGHTER"
            : "CHOOSE YOUR FIGHTER";
    this.add.text(DESIGN_WIDTH / 2, 426, sub, textStyle(13, "#c8c0d4")).setOrigin(0.5);
  }

  private buildStageHint(): void {
    this.add
      .text(DESIGN_WIDTH / 2, 468, `${this.playerPick?.displayName ?? "You"}  vs  ${this.opponentPick?.displayName ?? "CPU"}`, textStyle(16))
      .setOrigin(0.5);
    this.add
      .text(DESIGN_WIDTH / 2, 494, "Tap a Lower Peninsula landmark to choose the stage.", {
        fontFamily: FONT,
        fontSize: "12px",
        color: "#9aa0c8",
      })
      .setOrigin(0.5);
  }

  private roster(): FighterDef[] {
    const { starters, unlockedBosses } = selectRoster();
    if (this.mode === "arcade") return starters;
    return [...starters, ...unlockedBosses];
  }

  private buildGrid(): void {
    const fighters = this.roster().filter((f) => !(this.phase === "opponent" && this.playerPick && f.id === this.playerPick.id));
    const columns = Math.min(10, Math.max(fighters.length, 1));
    const slot = fighters.length > 8 ? 72 : 88;
    const gap = 8;
    const rows = Math.ceil(fighters.length / columns);
    const gridW = Math.min(columns, fighters.length) * slot + Math.max(Math.min(columns, fighters.length) - 1, 0) * gap;
    const startX = (DESIGN_WIDTH - gridW) / 2 + slot / 2;
    const startY = 490;
    if (this.textureWide("ui-select-screen")) {
      const panelH = rows * (slot + 10) + 16;
      this.add.rectangle(DESIGN_WIDTH / 2, startY + (rows - 1) * (slot + 10) * 0.5, gridW + 28, panelH, 0x120c1c, 0.72);
    }

    fighters.forEach((fighter, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const card = this.makeHead(fighter, slot);
      card.setPosition(startX + col * (slot + gap), startY + row * (slot + 10));
      this.cards.set(slotName(fighter), card);
    });

    if (this.mode === "freePlay" && selectRoster().unlockedBosses.length === 0 && this.phase === "player") {
      this.add
        .text(DESIGN_WIDTH / 2, 640, "Win arcade fights to unlock bosses on this grid.", {
          fontFamily: FONT,
          fontSize: "13px",
          color: "#999",
        })
        .setOrigin(0.5);
    } else if (this.mode === "freePlay" && this.phase === "player" && selectRoster().unlockedBosses.length > 0) {
      this.add
        .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 44, `${selectRoster().unlockedBosses.length} BOSSES UNLOCKED`, textStyle(12, "#9fff9f"))
        .setOrigin(0.5);
    }
    void rows;
  }

  private makeHead(fighter: FighterDef, size: number): Phaser.GameObjects.Container {
    const root = this.add.container(0, 0);
    const panel = this.add.rectangle(0, 0, size, size, 0x1a1528, 0.95).setStrokeStyle(2, fighter.accent);
    root.add(panel);
    const key = this.hasTex(fighter.portrait) ? fighter.portrait : this.hasTex(fighter.idle) ? fighter.idle : null;
    if (key) {
      const img = this.add.image(0, -4, key);
      img.setDisplaySize(size - 14, size - 22);
      root.add(img);
    } else {
      root.add(this.add.rectangle(0, -4, size - 16, size - 22, fighter.accent));
    }
    root.add(this.add.text(0, size / 2 - 9, fighter.displayName, textStyle(10)).setOrigin(0.5));
    const hit = this.add.rectangle(0, 0, size, size, 0x000000, 0.001);
    hit.setInteractive({ useHandCursor: true });
    hit.on("pointerup", () => this.selectFighter(fighter));
    root.add(hit);
    return root;
  }

  private selectFighter(fighter: FighterDef): void {
    this.selected = fighter;
    for (const [key, node] of this.cards) {
      const on = key === slotName(fighter);
      node.setScale(on ? 1.08 : 1);
      node.setAlpha(on ? 1 : 0.7);
    }
    this.syncMapHighlight();
    const verb = this.phase === "opponent" ? "NEXT" : this.mode === "arcade" ? "ARCADE" : "NEXT";
    this.fightLabel.setText(`${verb}  —  ${fighter.displayName.toUpperCase()}`);
    this.fightLabel.setColor(GOLD);
    this.goTimer?.remove(false);
    this.goTimer = this.time.delayedCall(280, () => this.advance(fighter));
  }

  private onMapDot(id: string): void {
    const stage = STAGES.find((s) => s.id === id);
    if (!stage) return;
    this.selectStage(stage);
  }

  private selectStage(stage: StageDef): void {
    this.selectedStage = stage;
    this.map?.highlight(stage.id);
    this.fightLabel.setText(`FIGHT  —  ${stage.displayName.toUpperCase()}`);
    this.fightLabel.setColor(GOLD);
    this.goTimer?.remove(false);
    this.goTimer = this.time.delayedCall(280, () => this.startOnStage(stage));
  }

  private syncMapHighlight(): void {
    if (this.phase === "stage") {
      this.map?.highlight(this.selectedStage?.id ?? this.opponentPick?.stageId ?? null);
      return;
    }
    const fighter = this.selected ?? this.playerPick;
    const stageId =
      this.mode === "arcade" && this.phase === "player" ? "lionsBridge" : (fighter?.stageId ?? null);
    this.map?.highlight(stageId);
  }

  private confirm(): void {
    if (this.phase === "stage" && this.selectedStage) this.startOnStage(this.selectedStage);
    else if (this.selected) this.advance(this.selected);
  }

  private advance(fighter: FighterDef): void {
    this.goTimer?.remove(false);
    if (this.mode === "arcade") {
      this.scene.start("Fight", { arcade: arcadeStart(fighter) });
      return;
    }
    if (this.phase === "player") {
      this.scene.start("Select", { mode: "freePlay", phase: "opponent", player: fighter });
      return;
    }
    this.scene.start("Select", {
      mode: "freePlay",
      phase: "stage",
      player: this.playerPick ?? STARTERS[0],
      opponent: fighter,
    });
  }

  private startOnStage(stage: StageDef): void {
    this.goTimer?.remove(false);
    const player = this.playerPick ?? STARTERS[0];
    const opponent = this.opponentPick ?? STARTERS[1];
    this.scene.start("Fight", {
      playerId: player.id,
      opponentId: opponent.id,
      stageId: stage.id,
    });
  }

  private hasTex(key: string): boolean {
    return this.textures.exists(key) && this.textures.get(key).getSourceImage().width > 1;
  }
}
