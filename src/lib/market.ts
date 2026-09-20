import { OrderBook, type Side, type Trade } from "./orderbook";

export const TICK_SIZE = 0.25;
export const BASE_TICKS = 20925;

export const priceOf = (ticks: number) => ticks * TICK_SIZE;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Snapshot = {
  bids: { priceTicks: number; qty: number }[];
  asks: { priceTicks: number; qty: number }[];
  midTicks: number | null;
  spreadTicks: number | null;
  lastTradeTicks: number | null;
  lastAggressor: Side | null;
  peak: number;
};

export class Market {
  readonly book = new OrderBook();
  private rnd: () => number;
  private fair = BASE_TICKS;
  private vol = 0.5;
  private burst = 0;
  private pressBid = 1;
  private pressAsk = 1;
  private lastTradeTicks: number | null = null;
  private lastAggressor: Side | null = null;

  constructor(seed = 0x5eed) {
    this.rnd = mulberry32(seed);
    this.seedBook();
  }

  private qty() {
    return 4 + Math.floor(this.rnd() * 58);
  }

  private offset() {
    if (this.rnd() < 0.45) return 1 + Math.floor(this.rnd() * 9);
    return 1 + Math.floor(-Math.log(1 - this.rnd() * 0.95) * 1.8);
  }

  private seedBook() {
    for (let d = 1; d <= 8; d++) {
      this.book.limit("bid", BASE_TICKS - d, this.qty());
      this.book.limit("ask", BASE_TICKS + d, this.qty());
    }
  }

  step(): Trade[] {
    const rnd = this.rnd;
    const book = this.book;
    const trades: Trade[] = [];

    if (this.burst === 0) {
      if (rnd() < 0.004) this.burst = 1;
    } else if (rnd() < 0.025) {
      this.burst = 0;
    }

    const drift = (rnd() - 0.5) * 2.0 * (this.burst ? 4 : 1);
    this.fair += drift;
    this.fair = Math.min(BASE_TICKS + 26, Math.max(BASE_TICKS - 26, this.fair));

    this.vol = this.vol * 0.94 + Math.abs(drift) * 0.06;
    const stress = Math.min(1, Math.max(0, (this.vol - 0.55) / 1.1));

    const REVERT = 0.02;
    const KICK = 0.42;
    const target = 0.9 + stress * 2.5;
    this.pressBid = Math.min(
      4,
      Math.max(0, this.pressBid + (target - this.pressBid) * REVERT + (rnd() - 0.5) * KICK),
    );
    this.pressAsk = Math.min(
      4,
      Math.max(0, this.pressAsk + (target - this.pressAsk) * REVERT + (rnd() - 0.5) * KICK),
    );

    const dBid = 1 + Math.floor(this.pressBid);
    const dAsk = 1 + Math.floor(this.pressAsk);
    const bidFloor = Math.floor(this.fair) - dBid + 1;
    const askFloor = Math.ceil(this.fair) + dAsk - 1;

    for (const id of book.insideOrders("bid", bidFloor)) {
      if (rnd() < 0.5) book.cancel(id);
    }
    for (const id of book.insideOrders("ask", askFloor)) {
      if (rnd() < 0.5) book.cancel(id);
    }

    const nb = book.depth("bid", 12).length;
    const na = book.depth("ask", 12).length;
    const pBid = 0.5 + 0.4 * ((na - nb) / Math.max(1, na + nb));

    const quotes = Math.max(1, Math.round((4 + rnd() * 4) * (1 - 0.55 * stress)));
    for (let i = 0; i < quotes; i++) {
      const side: Side = rnd() < pBid ? "bid" : "ask";
      const d = (side === "bid" ? dBid : dAsk) + this.offset() - 1;
      const px =
        side === "bid"
          ? Math.floor(this.fair) - d + 1
          : Math.ceil(this.fair) + d - 1;
      book.limit(side, px, this.qty());
    }

    const ids = book.openOrderIds();
    const toPull = Math.floor(ids.length * (0.06 + 0.1 * stress));
    for (let i = 0; i < toPull; i++) {
      book.cancel(ids[Math.floor(rnd() * ids.length)]);
    }

    if (ids.length > 340) {
      for (const id of ids) {
        if (rnd() < 0.25) book.cancel(id);
      }
    }

    const mid = book.midTicks();
    if (mid !== null) {
      const edge = this.fair - mid;
      if (rnd() < Math.min(0.75, Math.abs(edge) * (0.4 + 0.5 * stress))) {
        const side: Side = edge > 0 ? "bid" : "ask";
        trades.push(...book.market(side, this.qty()));
      }
    }

    if (rnd() < 0.12) {
      trades.push(...book.market(rnd() < 0.5 ? "bid" : "ask", this.qty()));
    }

    if (book.bestBidTicks() === null) {
      book.limit("bid", Math.floor(this.fair) - 1, this.qty());
    }
    if (book.bestAskTicks() === null) {
      book.limit("ask", Math.ceil(this.fair) + 1, this.qty());
    }

    if (trades.length) {
      const last = trades[trades.length - 1];
      this.lastTradeTicks = last.priceTicks;
      this.lastAggressor = last.aggressor;
    }

    return trades;
  }

  snapshot(levels: number): Snapshot {
    const bb = this.book.bestBidTicks();
    const ba = this.book.bestAskTicks();
    const bidTop = bb ?? (ba !== null ? ba - 1 : Math.floor(this.fair));
    const askTop = ba ?? (bb !== null ? bb + 1 : Math.ceil(this.fair));

    const bids = [];
    const asks = [];
    for (let i = 0; i < levels; i++) {
      const bp = bidTop - i;
      const ap = askTop + i;
      bids.push({ priceTicks: bp, qty: this.book.qtyAt("bid", bp) });
      asks.push({ priceTicks: ap, qty: this.book.qtyAt("ask", ap) });
    }

    let peak = 1;
    for (const l of bids) peak = Math.max(peak, l.qty);
    for (const l of asks) peak = Math.max(peak, l.qty);
    return {
      bids,
      asks,
      midTicks: this.book.midTicks(),
      spreadTicks: this.book.spreadTicks(),
      lastTradeTicks: this.lastTradeTicks,
      lastAggressor: this.lastAggressor,
      peak,
    };
  }
}

export function formatPrice(ticks: number) {
  return priceOf(ticks).toFixed(2);
}

export function formatMid(ticks: number) {
  return priceOf(ticks).toFixed(3).replace(/0$/, "");
}
