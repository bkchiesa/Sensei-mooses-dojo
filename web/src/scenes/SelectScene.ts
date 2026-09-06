import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD } from "../config";
import { defaultFighter, dummyOpponent, slotName, STAGES, stageById, type FighterDef, type StageDef } from "../data/catalog";
import { PIXEL_PLATE_PX, isFramedSelectPlate, selectMapChrome } from "../data/peninsula";
import { arcadeOpponent, arcadeStageId, arcadeStart } from "../game/arcade";
import { installUnlock, playFightLoop, playSfx, unlockAudio } from "../game/audio";
import { go } from "../game/nav";
import { PeninsulaMap } from "../game/peninsulaMap";
import { applyQueryUnlocks, isUnlocked, selectRoster } from "../game/storage";
import { textStyle } from "../game/ui";

interface PlateMeta {
  file?: string | null;
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
  private built = false;

  constructor() {
    super("Select");
  }

  init(data: SelectData): void {
    this.mode = data.mode ?? "arcade";
    this.phase = data.phase ?? "player";
    this.playerPick = data.player ?? null;
    this.opponentPick = data.opponent ?? null;
    this.selected = this.phase === "player" ? (data.player ?? defaultFighter()) : this.phase === "opponent" ? null : (data.player ?? null);
    this.selectedStage = null;
    this.cards.clear();
    this.map = undefined;
    this.fightLabel = undefined as unknown as Phaser.GameObjects.Text;
    this.goTimer = undefined;
    this.built = false;
  }

  create(): void {
    applyQueryUnlocks();
    this.input.enabled = true;
    this.cameras.main.setBackgroundColor(0x2c2a58);
    installUnlock(this);
    playFightLoop(this);
    const hadMap = this.textureWide("ui-select-map");
    try {
      this.buildLayout();
    } catch (err) {
      console.error("Select layout failed", err);
      this.add
        .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, "SELECT FAILED — tap Title", textStyle(22, GOLD))
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerup", () => this.scene.start("Title"));
    }
    if (!hadMap) this.loadMapPlateThenReload();
  }

  shutdown(): void {
    this.goTimer?.remove(false);
    this.input.enabled = false;
  }

  /** Map plate C only — never the full locked select-screen composite. */
  private loadMapPlateThenReload(): void {
    void fetch("assets/ui/select/plate.json")
      .then((res) => (res.ok ? res.json() : { file: "select-map-plate-C.png" }))
      .catch(() => ({ file: "select-map-plate-C.png" }))
      .then((meta: PlateMeta) => {
        if (!this.sys.isActive() || this.textureWide("ui-select-map")) return;
        const file = meta.file || "select-map-plate-C.png";
        const url = `assets/ui/select/${file}`;
        if (file.endsWith(".svg")) this.load.svg("ui-select-map", url, PIXEL_PLATE_PX);
        else this.load.image("ui-select-map", url);
        this.load.once("complete", () => {
          if (!this.sys.isActive() || !this.textureWide("ui-select-map") || !this.built) return;
          this.map?.destroy();
          this.buildMap();
          this.syncMapHighlight();
        });
        this.load.start();
      });
  }

  private textureWide(key: string): boolean {
    try {
      if (!this.textures.exists(key)) return false;
      const src = this.textures.get(key).getSourceImage() as { width?: number } | undefined;
      return Boolean(src?.width && src.width >= 8);
    } catch {
      return false;
    }
  }

  private buildLayout(): void {
    if (this.built) return;
    this.built = true;
    this.buildWash();
    this.buildNav();
    this.buildPortraits();
    this.buildMap();
    this.buildPlayerSelectLabel();
    if (this.phase === "stage") this.buildStageHint();
    else this.buildGrid();
    this.fightLabel = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 20, this.idlePrompt(), {
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
    if (this.phase === "opponent") return "TAP A PORTRAIT  ·  SELECT OPPONENT";
    return "TAP A PORTRAIT  ·  SELECT A FIGHTER";
  }

  private buildWash(): void {
    this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x1a1430, 1);
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
      this.phase === "stage" || this.phase === "opponent" ? "FREE PLAY" : this.mode === "arcade" ? "ARCADE" : "FREE PLAY";
    this.add.text(DESIGN_WIDTH / 2, 22, heading, textStyle(18, GOLD)).setOrigin(0.5);

    const back = this.add.text(28, 14, "← TITLE", textStyle(14, "#d9d9d9")).setInteractive({ useHandCursor: true });
    back.on("pointerup", () => {
      playSfx(this, "menu_confirm");
      go(this, "Title");
    });

    if (this.mode === "arcade") {
      const free = this.add
        .text(DESIGN_WIDTH - 28, 14, "FREE PLAY →", textStyle(14, "#d9d9d9"))
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      free.on("pointerup", () => {
        playSfx(this, "menu_move");
        go(this, "Select", { mode: "freePlay" });
      });
    } else if (this.phase === "stage") {
      const backOpp = this.add
        .text(DESIGN_WIDTH - 28, 14, "← OPPONENT", textStyle(14, "#d9d9d9"))
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      backOpp.on("pointerup", () => {
        playSfx(this, "menu_move");
        go(this, "Select", { mode: "freePlay", phase: "opponent", player: this.playerPick });
      });
    } else if (this.phase === "opponent") {
      const backPick = this.add
        .text(DESIGN_WIDTH - 28, 14, "← FIGHTER", textStyle(14, "#d9d9d9"))
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      backPick.on("pointerup", () => {
        playSfx(this, "menu_move");
        go(this, "Select", { mode: "freePlay" });
      });
    } else {
      const arcade = this.add
        .text(DESIGN_WIDTH - 28, 14, "← ARCADE", textStyle(14, "#d9d9d9"))
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      arcade.on("pointerup", () => {
        playSfx(this, "menu_move");
        go(this, "Select", { mode: "arcade" });
      });
    }
  }

  private buildPortraits(): void {
    const left = this.selected ?? this.playerPick;
    const right =
      this.phase === "player"
        ? this.mode === "arcade"
          ? arcadeOpponent(arcadeStart(left ?? defaultFighter()))
          : this.opponentPick
        : this.phase === "opponent"
          ? this.selected
          : this.opponentPick;
    this.drawBust(154, 196, left, true, "1P  ·  YOU");
    this.drawBust(
      DESIGN_WIDTH - 154,
      196,
      right,
      false,
      this.phase === "player" && this.mode === "arcade" ? "CPU" : "2P  ·  CPU",
    );
  }

  private drawBust(x: number, y: number, fighter: FighterDef | null | undefined, isP1: boolean, tag: string): void {
    const color = isP1 ? 0xd43c3c : 0xffd651;
    // Brandon lock: +40% vs original 200×268 bust / 16–20px name.
    this.add.rectangle(x, y, 280, 375, 0x141028, 0.92).setStrokeStyle(4, color);
    if (fighter && this.hasTex(fighter.portrait)) {
      const img = this.add.image(x, y - 22, fighter.portrait);
      const s = Math.min(246 / img.width, 263 / img.height);
      img.setScale(s);
    } else if (fighter && this.hasTex(fighter.idle)) {
      const img = this.add.image(x, y - 12, fighter.idle);
      const s = Math.min(224 / img.width, 246 / img.height);
      img.setScale(s);
    } else {
      this.add.rectangle(x, y - 22, 196, 235, 0x2a2438);
      this.add.text(x, y - 22, "?", textStyle(80, "#666")).setOrigin(0.5);
    }
    const name = fighter?.displayName.toUpperCase() ?? "…";
    this.add
      .text(x, y + 146, name, {
        fontFamily: FONT,
        fontSize: name.length > 12 ? "22px" : "28px",
        color: isP1 ? "#ff8a7a" : GOLD,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add.text(x, y + 174, tag, textStyle(14, isP1 ? "#ffb0a4" : "#ffe7a0")).setOrigin(0.5);
    if (fighter) {
      this.add.text(x, y + 196, stageById(fighter.stageId).displayName.toUpperCase(), textStyle(12, "#c8c0d4")).setOrigin(0.5);
    }
  }

  private buildMap(): void {
    const src = this.textureWide("ui-select-map")
      ? (this.textures.get("ui-select-map").getSourceImage() as { width?: number; height?: number })
      : null;
    const framed = isFramedSelectPlate(src?.width, src?.height);
    const chrome = selectMapChrome(framed);
    const stagePick = this.phase === "stage";
    const w = stagePick ? chrome.w : Math.round(chrome.w * 0.72);
    const h = stagePick ? chrome.h : Math.round(chrome.h * 0.7);
    const y = stagePick ? 196 : 158;
    this.map = new PeninsulaMap(this, { x: DESIGN_WIDTH / 2, y, w, h }, (id) => this.onMapDot(id), stagePick);
  }

  private buildPlayerSelectLabel(): void {
    this.add
      .text(DESIGN_WIDTH / 2, 392, "PLAYER SELECT", {
        fontFamily: FONT,
        fontSize: "26px",
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
          ? "FULL ROSTER  ·  LOCKED GREYED  ·  TAP TO PICK OPPONENT"
          : "FULL ROSTER  ·  AUSTIN + SENSEI MOOSE OPEN  ·  TAP TO PICK";
    this.add.text(DESIGN_WIDTH / 2, 416, sub, textStyle(13, "#c8c0d4")).setOrigin(0.5);
  }

  private buildStageHint(): void {
    this.add
      .text(DESIGN_WIDTH / 2, 456, `${this.playerPick?.displayName ?? "You"}  vs  ${this.opponentPick?.displayName ?? "CPU"}`, textStyle(16))
      .setOrigin(0.5);
    this.add
      .text(DESIGN_WIDTH / 2, 482, "Tap a landmark on map plate C. Dots stay on real lon/lat.", {
        fontFamily: FONT,
        fontSize: "12px",
        color: "#9aa0c8",
      })
      .setOrigin(0.5);
  }

  /** Full staff roster, including locked finals. Scratch starters are not listed. */
  private roster(): FighterDef[] {
    applyQueryUnlocks();
    return selectRoster().all;
  }

  private buildGrid(): void {
    const fighters = this.roster().filter((f) => !(this.phase === "opponent" && this.playerPick && f.id === this.playerPick.id));
    const columns = Math.min(8, Math.max(fighters.length, 1));
    // Brandon lock: +40% vs original 88 / 104 tiles.
    const slot = fighters.length > 8 ? 123 : 146;
    const gap = 12;
    const gridW = Math.min(columns, fighters.length) * slot + Math.max(Math.min(columns, fighters.length) - 1, 0) * gap;
    const startX = (DESIGN_WIDTH - gridW) / 2 + slot / 2;
    const startY = 448;

    fighters.forEach((fighter, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const locked = !isUnlocked(fighter.id);
      const card = this.makeHead(fighter, slot, locked);
      card.setPosition(startX + col * (slot + gap), startY + row * (slot + 12));
      this.cards.set(slotName(fighter), card);
    });

    const { locked, playable } = selectRoster();
    if (this.phase === "player" && locked.length > 0) {
      this.add
        .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 42, "BEAT RYAN IN ARCADE TO UNLOCK", textStyle(12, "#9aa0c8"))
        .setOrigin(0.5);
    } else if (this.phase === "player" && playable.length > 0) {
      this.add
        .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 42, "ALL FIGHTERS UNLOCKED", textStyle(12, "#9fff9f"))
        .setOrigin(0.5);
    }
  }

  private makeHead(fighter: FighterDef, size: number, locked: boolean): Phaser.GameObjects.Container {
    const root = this.add.container(0, 0);
    root.setData("locked", locked);
    const panel = this.add.rectangle(0, 0, size, size, locked ? 0x12101a : 0x1a1528, 0.96).setStrokeStyle(3, locked ? 0x4a4658 : fighter.accent);
    root.add(panel);
    const key = this.hasTex(fighter.portrait) ? fighter.portrait : this.hasTex(fighter.idle) ? fighter.idle : null;
    if (key) {
      const img = this.add.image(0, -6, key);
      img.setDisplaySize(size - 16, size - 28);
      if (locked) {
        img.setTint(0x5a5a5a);
        img.setAlpha(0.42);
      }
      root.add(img);
    } else {
      const fill = this.add.rectangle(0, -6, size - 18, size - 28, fighter.accent);
      if (locked) fill.setAlpha(0.28);
      root.add(fill);
    }
    root.add(
      this.add
        .text(0, size / 2 - 16, fighter.displayName.toUpperCase(), textStyle(16, locked ? "#7a7488" : "#f2f2f2"))
        .setOrigin(0.5),
    );
    const hit = this.add.rectangle(0, 0, size + 6, size + 6, 0x000000, 0.001);
    if (!locked) {
      hit.setInteractive({ useHandCursor: true });
      hit.on("pointerdown", () => this.selectFighter(fighter));
      hit.on("pointerup", () => this.selectFighter(fighter));
    }
    root.add(hit);
    if (locked) root.setAlpha(0.78);
    return root;
  }

  private selectFighter(fighter: FighterDef): void {
    if (!isUnlocked(fighter.id)) return;
    unlockAudio(this);
    playSfx(this, "character_select");
    this.selected = fighter;
    for (const [key, node] of this.cards) {
      if (node.getData("locked")) {
        node.setScale(1);
        continue;
      }
      const on = key === slotName(fighter);
      node.setScale(on ? 1.08 : 1);
      node.setAlpha(on ? 1 : 0.72);
    }
    this.syncMapHighlight();
    const verb = this.phase === "opponent" ? "NEXT" : this.mode === "arcade" ? "ARCADE" : "NEXT";
    this.fightLabel.setText(`${verb}  —  ${fighter.displayName.toUpperCase()}`);
    this.fightLabel.setColor(GOLD);
    this.goTimer?.remove(false);
    this.goTimer = this.time.delayedCall(220, () => this.advance(fighter));
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
    this.goTimer = this.time.delayedCall(220, () => this.startOnStage(stage));
  }

  private syncMapHighlight(): void {
    if (this.phase === "stage") {
      this.map?.highlight(this.selectedStage?.id ?? this.opponentPick?.stageId ?? null);
      return;
    }
    const fighter = this.selected ?? this.playerPick;
    if (this.mode === "arcade" && this.phase === "player" && fighter) {
      this.map?.highlight(arcadeStageId(arcadeStart(fighter)));
      return;
    }
    this.map?.highlight(fighter?.stageId ?? null);
  }

  private confirm(): void {
    if (this.phase === "stage" && this.selectedStage) this.startOnStage(this.selectedStage);
    else if (this.selected) this.advance(this.selected);
  }

  private advance(fighter: FighterDef): void {
    this.goTimer?.remove(false);
    playSfx(this, "character_locked");
    applyQueryUnlocks();
    if (!isUnlocked(fighter.id)) return;
    if (this.mode === "arcade") {
      go(this, "Fight", { arcade: arcadeStart(fighter) });
      return;
    }
    if (this.phase === "player") {
      go(this, "Select", { mode: "freePlay", phase: "opponent", player: fighter });
      return;
    }
    go(this, "Select", {
      mode: "freePlay",
      phase: "stage",
      player: this.playerPick ?? defaultFighter(),
      opponent: fighter,
    });
  }

  private startOnStage(stage: StageDef): void {
    this.goTimer?.remove(false);
    playSfx(this, "menu_confirm");
    const player = this.playerPick ?? defaultFighter();
    const opponent = this.opponentPick ?? dummyOpponent(player);
    go(this, "Fight", {
      playerId: player.id,
      opponentId: opponent.id,
      stageId: stage.id,
    });
  }

  private hasTex(key: string): boolean {
    return this.textureWide(key);
  }
}
