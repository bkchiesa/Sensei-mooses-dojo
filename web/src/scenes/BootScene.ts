import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD } from "../config";
import { BOSSES, fighterById, STARTERS } from "../data/catalog";
import { fighterAnimUrl, parseAnimIndex, registerAnimPack, type FighterAnimName } from "../game/anims";
import { applyQueryUnlocks } from "../game/storage";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    applyQueryUnlocks();
    this.cameras.main.setBackgroundColor(0x140d1f);
    const barW = 520;
    const cx = DESIGN_WIDTH / 2;
    const cy = DESIGN_HEIGHT / 2;
    this.add
      .text(cx, cy - 70, "Sensei Moose's Dojo", {
        fontFamily: FONT,
        fontSize: "36px",
        color: GOLD,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const track = this.add.rectangle(cx, cy, barW, 18, 0x1a1324).setStrokeStyle(2, 0xffd651);
    const fill = this.add.rectangle(cx - barW / 2 + 2, cy, 4, 12, 0xffd651).setOrigin(0, 0.5);
    this.add
      .text(cx, cy + 36, "Loading portraits + title art…", {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#c8c0d4",
      })
      .setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      fill.width = Math.max(4, (barW - 4) * value);
      void track;
    });

    const keys = new Set<string>([
      "moose_title_idle",
      "moose_title_body",
      "moose_title_head",
      "stage1_sky",
      "stage1_master",
    ]);
    for (const f of [...STARTERS, ...BOSSES]) {
      keys.add(f.portrait);
      keys.add(f.idle);
      keys.add(f.ultimate.frameName);
    }

    for (const key of keys) {
      this.load.image(key, `assets/${key}.png`);
    }
    this.load.json("fighter-anims", "assets/fighters/index.json");
    this.load.json("ui-select-plate", "assets/ui/select/plate.json");
    this.load.image("ui-select-map", "assets/ui/select/select-map-plate-C.png");
    this.load.image("ui-select-screen", "assets/ui/select/select-screen-C.png");
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn("Missing art (placeholder will be used):", file.key);
    });
  }

  create(): void {
    for (const key of this.textures.getTextureKeys()) {
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    for (const f of [...STARTERS, ...BOSSES]) {
      this.ensurePlaceholder(f.portrait, f.accent);
      this.ensurePlaceholder(f.idle, f.accent);
    }
    this.loadFighterAnimsThen();
  }

  private startAfterBoot(): void {
    applyQueryUnlocks();
    const vs = new URLSearchParams(window.location.search).get("vs");
    if (vs) {
      try {
        const opponent = fighterById(vs);
        this.scene.start("Fight", {
          playerId: "matt",
          opponentId: opponent.id,
          stageId: opponent.stageId,
        });
        return;
      } catch {
        /* fall through to title */
      }
    }
    this.scene.start("Title");
  }

  private loadFighterAnimsThen(): void {
    const index = parseAnimIndex(this.cache.json.get("fighter-anims"));
    if (!index) {
      this.startAfterBoot();
      return;
    }
    const pending: { key: string; url: string }[] = [];
    for (const [id, anims] of Object.entries(index.fighters)) {
      const frames: Partial<Record<FighterAnimName, string[]>> = {};
      for (const [anim, files] of Object.entries(anims)) {
        if (!files?.length) continue;
        const keys: string[] = [];
        files.forEach((file, i) => {
          const key = `fanim-${id}-${anim}-${String(i).padStart(2, "0")}`;
          keys.push(key);
          pending.push({ key, url: fighterAnimUrl(id, anim as FighterAnimName, file) });
        });
        frames[anim as FighterAnimName] = keys;
      }
      registerAnimPack({ id, frames });
    }
    const missing = pending.filter((p) => !this.textures.exists(p.key));
    if (!missing.length) {
      this.startAfterBoot();
      return;
    }
    for (const file of missing) this.load.image(file.key, file.url);
    this.load.once("complete", () => this.startAfterBoot());
    this.load.start();
  }

  private ensurePlaceholder(key: string, color: number): void {
    if (this.textures.exists(key) && this.textures.get(key).getSourceImage().width > 1) return;
    const g = this.add.graphics();
    g.setVisible(false);
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, 80, 120, 8);
    g.lineStyle(2, 0xffffff, 0.4);
    g.strokeRoundedRect(0, 0, 80, 120, 8);
    g.generateTexture(key, 80, 120);
    g.destroy();
  }
}
