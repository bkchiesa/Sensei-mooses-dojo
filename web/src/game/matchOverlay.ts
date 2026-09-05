/**
 * DOM match-end buttons. Phaser GameObjects miss taps on iPad Safari after a
 * fight (leftover Title / pad listeners). These sit above the canvas.
 */

export interface OverlayAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

const ROOT_ID = "match-overlay";

export function hideMatchOverlay(): void {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  root.hidden = true;
  root.replaceChildren();
}

export function showMatchOverlay(actions: OverlayAction[]): void {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  hideMatchOverlay();
  const stack = document.createElement("div");
  stack.className = "match-overlay-stack";
  for (const action of actions) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = action.label;
    if (action.primary) btn.classList.add("primary");
    btn.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        action.onClick();
      },
      { passive: false },
    );
    stack.appendChild(btn);
  }
  root.appendChild(stack);
  root.hidden = false;
}
