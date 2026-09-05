import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD } from "../config";
import { ARCADE_STAGE_IDS, slotName, STARTERS, STAGES, type FighterDef, type StageDef } from "../data/catalog";
import { arcadeStart } from "../game/arcade";
import { applyQueryUnlocks, selectRoster } from "../game/storage";
import { hexColor, textStyle } from "../game/ui";

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
    this.selected = null;
    this.selectedStage = null;
    this.cards.clear();
  }

  create(): void {
    applyQueryUnlocks();
    this.cameras.main.setBackgroundColor(0x120f1a);
    this.buildHeader();
    if (this.phase === "stage") this.buildStageSlots();
    else this.buildSlots();
    const idle =
      this.phase === "stage" ? "SELECT A STAGE" : this.phase === "opponent" ? "SELECT OPPONENT" : "SELECT A FIGHTER";
    this.fightLabel = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 36, idle, {
        fontFamily: FONT,
        fontSize: "22px",
        color: "#8c8c8c",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.fightLabel.on("pointerup", () => {
      if (this.phase === "stage" && this.selectedStage) this.startOnStage(this.selectedStage);
      else if (this.selected) this.advance(this.selected);
    });
  }

  private roster(): FighterDef[] {
    const { starters, unlockedBosses } = selectRoster();
    if (this.mode === "arcade") return starters;
    return [...starters, ...unlockedBosses];
  }

  private buildHeader(): void {
    const heading =
      this.phase === "stage"
        ? "FREE PLAY  ·  CHOOSE STAGE"
        : this.phase === "opponent"
          ? "FREE PLAY  ·  CHOOSE OPPONENT"
          : this.mode === "arcade"
            ? "ARCADE  ·  CHOOSE YOUR FIGHTER"
            : "FREE PLAY  ·  CHOOSE YOUR FIGHTER";
    this.add.text(DESIGN_WIDTH / 2, 42, heading, textStyle(26, GOLD)).setOrigin(0.5);

    const hint =
      this.phase === "stage"
        ? `${this.playerPick?.displayName ?? "You"} vs ${this.opponentPick?.displayName ?? "CPU"}  ·  Arcade + NN landmarks`
        : this.phase === "opponent"
          ? `${this.playerPick?.displayName ?? "You"} vs …`
          : this.mode === "arcade"
            ? "Starters  ·  Best of 3  ·  Each boss has a home landmark  ·  Next Fight to advance"
            : "Starters + unlocked bosses  ·  then opponent  ·  then a stage";
    this.add
      .text(DESIGN_WIDTH / 2, 72, hint, { fontFamily: FONT, fontSize: "14px", color: "#bfbfbf" })
      .setOrigin(0.5);

    const back = this.add.text(36, 28, "← TITLE", textStyle(16, "#d9d9d9")).setInteractive({ useHandCursor: true });
    back.on("pointerup", () => this.scene.start("Title"));

    if (this.mode === "arcade") {
      const free = this.add
        .text(DESIGN_WIDTH - 36, 28, "FREE PLAY →", textStyle(16, "#d9d9d9"))
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      free.on("pointerup", () => this.scene.start("Select", { mode: "freePlay" }));
    } else if (this.phase === "stage") {
      const backOpp = this.add
        .text(DESIGN_WIDTH - 36, 28, "← CHANGE OPPONENT", textStyle(16, "#d9d9d9"))
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      backOpp.on("pointerup", () =>
        this.scene.start("Select", { mode: "freePlay", phase: "opponent", player: this.playerPick }),
      );
    } else if (this.phase === "opponent") {
      const backPick = this.add
        .text(DESIGN_WIDTH - 36, 28, "← CHANGE FIGHTER", textStyle(16, "#d9d9d9"))
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      backPick.on("pointerup", () => this.scene.start("Select", { mode: "freePlay" }));
    } else {
      const arcade = this.add
        .text(DESIGN_WIDTH - 36, 28, "← ARCADE", textStyle(16, "#d9d9d9"))
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      arcade.on("pointerup", () => this.scene.start("Select", { mode: "arcade" }));
    }
  }

  private buildSlots(): void {
    const fighters = this.roster().filter((f) => !(this.phase === "opponent" && this.playerPick && f.id === this.playerPick.id));
    const columns = Math.min(7, Math.max(fighters.length, 1));
    const many = fighters.length > 5;
    const slotW = many ? 150 : 200;
    const slotH = many ? 200 : 260;
    const gap = 12;
    const gridW = Math.min(columns, fighters.length) * slotW + Math.max(Math.min(columns, fighters.length) - 1, 0) * gap;
    const startX = (DESIGN_WIDTH - gridW) / 2 + slotW / 2;
    const startY = DESIGN_HEIGHT * (many ? 0.38 : 0.46);

    fighters.forEach((fighter, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const card = this.makeCard(fighter, slotW, slotH);
      card.setPosition(startX + col * (slotW + gap), startY + row * (slotH + 16));
      this.cards.set(slotName(fighter), card);
    });

    if (this.mode === "freePlay" && selectRoster().unlockedBosses.length === 0 && this.phase === "player") {
      this.add
        .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 88, "Win arcade fights to unlock bosses here.", {
          fontFamily: FONT,
          fontSize: "14px",
          color: "#999",
        })
        .setOrigin(0.5);
    }
  }

  private buildStageSlots(): void {
    const columns = 4;
    const slotW = 300;
    const slotH = 86;
    const gapX = 14;
    const gapY = 12;
    const gridW = columns * slotW + (columns - 1) * gapX;
    const startX = (DESIGN_WIDTH - gridW) / 2 + slotW / 2;
    const startY = 130;

    STAGES.forEach((stage, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const card = this.makeStageCard(stage, slotW, slotH);
      card.setPosition(startX + col * (slotW + gapX), startY + row * (slotH + gapY));
      this.cards.set(stage.id, card);
    });
  }

  private makeStageCard(stage: StageDef, width: number, height: number): Phaser.GameObjects.Container {
    const root = this.add.container(0, 0);
    const arcade = ARCADE_STAGE_IDS.includes(stage.id);
    const panel = this.add.rectangle(0, 0, width, height, 0x1f1f1f, 0.92).setStrokeStyle(2, arcade ? 0xffd651 : 0x6a5a88);
    const num = this.add.text(-width / 2 + 14, 0, String(stage.number).padStart(2, "0"), textStyle(22, GOLD)).setOrigin(0, 0.5);
    const name = this.add.text(-width / 2 + 52, -10, stage.displayName, textStyle(16)).setOrigin(0, 0.5);
    const tag = this.add
      .text(-width / 2 + 52, 12, arcade ? "ARCADE" : "LANDMARK", {
        fontFamily: FONT,
        fontSize: "11px",
        color: arcade ? GOLD : "#9aa0c8",
      })
      .setOrigin(0, 0.5);
    root.add([panel, num, name, tag]);
    const hit = this.add.rectangle(0, 0, width, height, 0x000000, 0.001);
    hit.setInteractive({ useHandCursor: true });
    hit.on("pointerup", () => this.selectStage(stage));
    root.add(hit);
    return root;
  }

  private makeCard(fighter: FighterDef, width: number, height: number): Phaser.GameObjects.Container {
    const root = this.add.container(0, 0);
    const panel = this.add.rectangle(0, 0, width, height, 0x1f1f1f, 0.92).setStrokeStyle(3, fighter.accent);
    const portraitKey = this.textures.exists(fighter.portrait) ? fighter.portrait : null;
    const idleKey = this.textures.exists(fighter.idle) ? fighter.idle : portraitKey;
    const portraitH = height > 230 ? 110 : 80;
    root.add(panel);
    if (portraitKey) {
      const portrait = this.add.image(0, -height * 0.12, portraitKey);
      const s = portraitH / portrait.height;
      portrait.setScale(s);
      root.add(portrait);
    } else {
      root.add(this.add.rectangle(0, -height * 0.12, portraitH, portraitH, fighter.accent));
    }
    if (idleKey) {
      const idle = this.add.image(0, height * 0.22, idleKey);
      const ih = height > 230 ? 70 : 50;
      idle.setScale(ih / idle.height);
      root.add(idle);
    }
    const name = this.add.text(0, height * 0.42, fighter.displayName, textStyle(width > 180 ? 18 : 13)).setOrigin(0.5);
    const ult = this.add
      .text(0, height * 0.42 + 18, fighter.ultimate.name, {
        fontFamily: FONT,
        fontSize: "11px",
        color: hexColor(fighter.accent),
      })
      .setOrigin(0.5);
    root.add([name, ult]);
    const hit = this.add.rectangle(0, 0, width, height, 0x000000, 0.001);
    hit.setInteractive({ useHandCursor: true });
    hit.on("pointerup", () => this.selectFighter(fighter));
    root.add(hit);
    return root;
  }

  private selectFighter(fighter: FighterDef): void {
    this.selected = fighter;
    for (const [key, node] of this.cards) {
      const highlight = key === slotName(fighter);
      node.setScale(highlight ? 1.06 : 1);
      node.setAlpha(highlight ? 1 : 0.72);
    }
    const verb = this.phase === "opponent" ? "NEXT" : this.mode === "arcade" ? "ARCADE" : "NEXT";
    this.fightLabel.setText(`${verb}  —  ${fighter.displayName.toUpperCase()}`);
    this.fightLabel.setColor(GOLD);
    this.goTimer?.remove(false);
    this.goTimer = this.time.delayedCall(220, () => this.advance(fighter));
  }

  private selectStage(stage: StageDef): void {
    this.selectedStage = stage;
    for (const [key, node] of this.cards) {
      const highlight = key === stage.id;
      node.setScale(highlight ? 1.04 : 1);
      node.setAlpha(highlight ? 1 : 0.7);
    }
    this.fightLabel.setText(`FIGHT  —  ${stage.displayName.toUpperCase()}`);
    this.fightLabel.setColor(GOLD);
    this.goTimer?.remove(false);
    this.goTimer = this.time.delayedCall(220, () => this.startOnStage(stage));
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
}
