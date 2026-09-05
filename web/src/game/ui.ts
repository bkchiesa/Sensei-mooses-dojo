import { FONT, GOLD } from "../config";
import { lastDisplayName } from "./storage";

export function hexColor(n: number): string {
  return `#${n.toString(16).padStart(6, "0")}`;
}

export function promptName(score: number): Promise<string | null> {
  const modal = document.getElementById("name-modal");
  const form = document.getElementById("name-form") as HTMLFormElement | null;
  const input = document.getElementById("name-input") as HTMLInputElement | null;
  const scoreEl = document.getElementById("name-score");
  const cancel = document.getElementById("name-cancel");
  if (!modal || !form || !input || !scoreEl || !cancel) {
    return Promise.resolve(lastDisplayName() || "Sensei");
  }
  scoreEl.textContent = `Score ${score}. Name for the Top 10:`;
  input.value = lastDisplayName();
  modal.hidden = false;
  input.focus();

  return new Promise((resolve) => {
    const finish = (value: string | null) => {
      modal.hidden = true;
      form.removeEventListener("submit", onSubmit);
      cancel.removeEventListener("click", onCancel);
      resolve(value);
    };
    const onSubmit = (e: Event) => {
      e.preventDefault();
      finish(input.value);
    };
    const onCancel = () => finish(null);
    form.addEventListener("submit", onSubmit);
    cancel.addEventListener("click", onCancel);
  });
}

export const textStyle = (size: number, color = "#ffffff", extra: Phaser.Types.GameObjects.Text.TextStyle = {}) => ({
  fontFamily: FONT,
  fontSize: `${size}px`,
  color,
  fontStyle: "bold" as const,
  ...extra,
});

export { GOLD, FONT };
