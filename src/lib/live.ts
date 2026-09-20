import { Market, type Snapshot } from "./market";
import { BASE_TICKS } from "./market";

export const SEED = 0x5eed;
export const WARM = 1000;
export const BAND = 34;
export const BAND_SIZE = BAND * 2 + 1;
export const STEP_MS = 120;

export type Column = {
  qty: Uint16Array;
  midTicks: number | null;
  tradeTicks: number | null;
  peak: number;
};

export type Listener = (column: Column, snapshot: Snapshot) => void;

let market: Market | null = null;
const history: Column[] = [];
const listeners = new Set<Listener>();

let raf = 0;
let carry = 0;
let last = 0;
let running = false;

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function column(m: Market): Column {
  const qty = new Uint16Array(BAND_SIZE);
  let peak = 1;
  for (const side of ["bid", "ask"] as const) {
    for (const lvl of m.book.depth(side, 64)) {
      const i = lvl.priceTicks - BASE_TICKS + BAND;
      if (i < 0 || i >= BAND_SIZE) continue;
      qty[i] = Math.min(65535, lvl.qty);
      if (lvl.qty > peak) peak = lvl.qty;
    }
  }
  const s = m.snapshot(0);
  return { qty, midTicks: s.midTicks, tradeTicks: s.lastTradeTicks, peak };
}

function ensure(): Market {
  if (market) return market;
  const m = new Market(SEED);
  for (let i = 0; i < WARM; i++) {
    m.step();
    history.push(column(m));
  }
  market = m;
  return m;
}

function frame(now: number) {
  raf = requestAnimationFrame(frame);
  if (!market) return;

  carry += Math.min(now - last, 250);
  last = now;
  if (carry < STEP_MS) return;
  carry = 0;

  market.step();
  const col = column(market);
  history.push(col);
  if (history.length > WARM) history.shift();

  const snap = market.snapshot(7);
  for (const fn of listeners) fn(col, snap);
}

function start() {
  if (running || reduced() || typeof document === "undefined") return;
  if (document.hidden) return;
  running = true;
  last = performance.now();
  carry = 0;
  raf = requestAnimationFrame(frame);
}

function stop() {
  running = false;
  cancelAnimationFrame(raf);
  raf = 0;
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () =>
    document.hidden ? stop() : start(),
  );
}

export function subscribe(fn: Listener) {
  const m = ensure();
  listeners.add(fn);
  fn(history[history.length - 1], m.snapshot(7));
  start();
  return () => {
    listeners.delete(fn);
    if (!listeners.size) stop();
  };
}

export function getHistory(): readonly Column[] {
  ensure();
  return history;
}

export function isStatic() {
  return reduced();
}
