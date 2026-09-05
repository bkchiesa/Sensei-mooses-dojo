/**
 * DOM match-end buttons, parked over the Phaser canvas (not the viewport
 * letterbox / Safari chrome). html/body use touch-action: none, so iPad
 * Safari often never synthesizes `click` — bind pointerup + touchend too.
 */

export interface OverlayAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

const ROOT_ID = "match-overlay";

let tapAbort: AbortController | null = null;

function overlayRoot(): HTMLElement | null {
  return document.getElementById(ROOT_ID);
}

function resetTaps(): AbortController {
  tapAbort?.abort();
  tapAbort = new AbortController();
  return tapAbort;
}

function bindTap(el: HTMLElement, handler: () => void, signal: AbortSignal): void {
  let fired = false;
  const fire = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (fired) return;
    fired = true;
    handler();
  };
  el.addEventListener("pointerup", fire, { signal });
  el.addEventListener("touchend", fire, { passive: false, signal });
  el.addEventListener("click", fire, { signal });
}

export function hideMatchOverlay(): void {
  tapAbort?.abort();
  tapAbort = null;
  const root = overlayRoot();
  if (!root) return;
  root.hidden = true;
  root.classList.remove("is-open");
  root.replaceChildren();
}

/** Pin the overlay to the FIT-scaled canvas so buttons sit on the win panel. */
export function syncOverlayToCanvas(canvas?: HTMLCanvasElement | null): void {
  const root = overlayRoot();
  if (!root) return;
  const el = canvas ?? (document.querySelector("#game canvas") as HTMLCanvasElement | null);
  if (!el) {
    root.style.left = "0";
    root.style.top = "0";
    root.style.width = "100%";
    root.style.height = "100%";
    return;
  }
  const r = el.getBoundingClientRect();
  root.style.left = `${Math.round(r.left)}px`;
  root.style.top = `${Math.round(r.top)}px`;
  root.style.width = `${Math.round(r.width)}px`;
  root.style.height = `${Math.round(r.height)}px`;
}

export function showMatchOverlay(
  actions: OverlayAction[],
  opts?: { onBackdrop?: () => void; canvas?: HTMLCanvasElement | null },
): boolean {
  const root = overlayRoot();
  if (!root) return false;
  hideMatchOverlay();
  const signal = resetTaps().signal;
  syncOverlayToCanvas(opts?.canvas);

  const onResize = () => syncOverlayToCanvas(opts?.canvas);
  window.addEventListener("resize", onResize, { signal });
  window.addEventListener("orientationchange", onResize, { signal });

  if (opts?.onBackdrop) bindTap(root, opts.onBackdrop, signal);

  const stack = document.createElement("div");
  stack.className = "match-overlay-stack";
  const stop = (e: Event) => e.stopPropagation();
  stack.addEventListener("pointerup", stop, { signal });
  stack.addEventListener("touchend", stop, { signal });
  stack.addEventListener("click", stop, { signal });

  for (const action of actions) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = action.label;
    if (action.primary) btn.classList.add("primary");
    bindTap(btn, action.onClick, signal);
    stack.appendChild(btn);
  }
  root.appendChild(stack);
  root.hidden = false;
  root.classList.add("is-open");
  return true;
}
