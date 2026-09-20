export type Side = "bid" | "ask";

export type Trade = {
  priceTicks: number;
  qty: number;
  aggressor: Side;
  makerId: number;
  takerId: number;
};

export type DepthLevel = {
  priceTicks: number;
  qty: number;
};

type Order = {
  id: number;
  side: Side;
  priceTicks: number;
  qty: number;
  levelPtr: number;
  open: boolean;
};

type Level = {
  sprice: number;
  qty: number;
  fifo: number[];
  head: number;
  free: boolean;
};

type PriceLevel = {
  sprice: number;
  ptr: number;
};

const signed = (side: Side, priceTicks: number) =>
  side === "bid" ? priceTicks : -priceTicks;

export class OrderBook {
  private levels: Level[] = [];
  private freeList: number[] = [];
  private orders = new Map<number, Order>();
  private bids: PriceLevel[] = [];
  private asks: PriceLevel[] = [];
  private seq = 0;

  qtyAdded = 0;
  qtyTraded = 0;
  qtyCancelled = 0;

  private side(side: Side): PriceLevel[] {
    return side === "bid" ? this.bids : this.asks;
  }

  private locate(arr: PriceLevel[], sprice: number) {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].sprice > sprice) lo = mid + 1;
      else hi = mid;
    }
    return { found: lo < arr.length && arr[lo].sprice === sprice, idx: lo };
  }

  private allocLevel(sprice: number): number {
    const ptr = this.freeList.pop();
    if (ptr !== undefined) {
      const lvl = this.levels[ptr];
      lvl.sprice = sprice;
      lvl.qty = 0;
      lvl.fifo.length = 0;
      lvl.head = 0;
      lvl.free = false;
      return ptr;
    }
    this.levels.push({ sprice, qty: 0, fifo: [], head: 0, free: false });
    return this.levels.length - 1;
  }

  private releaseLevel(side: Side, ptr: number) {
    const lvl = this.levels[ptr];
    const arr = this.side(side);
    const { found, idx } = this.locate(arr, lvl.sprice);
    if (found) arr.splice(idx, 1);
    lvl.free = true;
    lvl.fifo.length = 0;
    lvl.head = 0;
    this.freeList.push(ptr);
  }

  private levelFor(side: Side, priceTicks: number): number {
    const arr = this.side(side);
    const sprice = signed(side, priceTicks);
    const { found, idx } = this.locate(arr, sprice);
    if (found) return arr[idx].ptr;
    const ptr = this.allocLevel(sprice);
    arr.splice(idx, 0, { sprice, ptr });
    return ptr;
  }

  private trimQueue(lvl: Level) {
    while (lvl.head < lvl.fifo.length) {
      const o = this.orders.get(lvl.fifo[lvl.head]);
      if (o && o.open && o.qty > 0) break;
      lvl.head++;
    }
    if (lvl.head > 32 && lvl.head * 2 >= lvl.fifo.length) {
      lvl.fifo = lvl.fifo.slice(lvl.head);
      lvl.head = 0;
    }
  }

  private consume(side: Side, want: number, takerId: number, out: Trade[]) {
    const arr = this.side(side);
    if (!arr.length) return 0;
    const ptr = arr[0].ptr;
    const lvl = this.levels[ptr];
    const priceTicks = side === "bid" ? lvl.sprice : -lvl.sprice;

    let taken = 0;
    while (taken < want) {
      this.trimQueue(lvl);
      if (lvl.head >= lvl.fifo.length) break;

      const maker = this.orders.get(lvl.fifo[lvl.head]);
      if (!maker) break;

      const fill = Math.min(maker.qty, want - taken);
      maker.qty -= fill;
      lvl.qty -= fill;
      taken += fill;
      this.qtyTraded += fill;

      out.push({
        priceTicks,
        qty: fill,
        aggressor: side === "bid" ? "ask" : "bid",
        makerId: maker.id,
        takerId,
      });

      if (maker.qty === 0) {
        maker.open = false;
        lvl.head++;
      }
    }

    if (lvl.qty === 0) this.releaseLevel(side, ptr);
    return taken;
  }

  limit(side: Side, priceTicks: number, qty: number) {
    const id = ++this.seq;
    const trades: Trade[] = [];
    let left = qty;
    this.qtyAdded += qty;

    const opposite: Side = side === "bid" ? "ask" : "bid";
    const oppArr = this.side(opposite);

    while (left > 0 && oppArr.length) {
      const lvl = this.levels[oppArr[0].ptr];
      const bestTicks = opposite === "bid" ? lvl.sprice : -lvl.sprice;
      const crosses =
        side === "bid" ? bestTicks <= priceTicks : bestTicks >= priceTicks;
      if (!crosses) break;
      const took = this.consume(opposite, left, id, trades);
      if (took === 0) break;
      left -= took;
    }

    if (left > 0) {
      const ptr = this.levelFor(side, priceTicks);
      const lvl = this.levels[ptr];
      const order: Order = {
        id,
        side,
        priceTicks,
        qty: left,
        levelPtr: ptr,
        open: true,
      };
      this.orders.set(id, order);
      lvl.fifo.push(id);
      lvl.qty += left;
    }

    return { id, trades, rested: left };
  }

  market(side: Side, qty: number) {
    const worst = side === "bid" ? Number.MAX_SAFE_INTEGER : -Number.MAX_SAFE_INTEGER;
    const { trades } = this.limit(side, worst, qty);

    const filled = trades.reduce((n, t) => n + t.qty, 0);
    this.qtyAdded -= qty - filled;
    const id = this.seq;
    const resting = this.orders.get(id);
    if (resting) {
      const lvl = this.levels[resting.levelPtr];
      lvl.qty -= resting.qty;
      resting.qty = 0;
      resting.open = false;
      if (lvl.qty === 0) this.releaseLevel(side, resting.levelPtr);
      this.orders.delete(id);
    }
    return trades;
  }

  cancel(id: number) {
    const o = this.orders.get(id);
    if (!o || !o.open || o.qty === 0) return 0;
    const lvl = this.levels[o.levelPtr];
    const gone = o.qty;
    lvl.qty -= gone;
    this.qtyCancelled += gone;
    o.qty = 0;
    o.open = false;
    if (lvl.qty === 0) this.releaseLevel(o.side, o.levelPtr);
    return gone;
  }

  replace(id: number, priceTicks: number, qty: number) {
    const o = this.orders.get(id);
    if (!o || !o.open) return null;
    const side = o.side;
    this.cancel(id);
    return this.limit(side, priceTicks, qty);
  }

  bestBidTicks(): number | null {
    return this.bids.length ? this.bids[0].sprice : null;
  }

  bestAskTicks(): number | null {
    return this.asks.length ? -this.asks[0].sprice : null;
  }

  spreadTicks(): number | null {
    const b = this.bestBidTicks();
    const a = this.bestAskTicks();
    return b === null || a === null ? null : a - b;
  }

  midTicks(): number | null {
    const b = this.bestBidTicks();
    const a = this.bestAskTicks();
    return b === null || a === null ? null : (a + b) / 2;
  }

  depth(side: Side, n: number): DepthLevel[] {
    const arr = this.side(side);
    const out: DepthLevel[] = [];
    for (let i = 0; i < arr.length && out.length < n; i++) {
      const lvl = this.levels[arr[i].ptr];
      if (lvl.qty <= 0) continue;
      out.push({
        priceTicks: side === "bid" ? lvl.sprice : -lvl.sprice,
        qty: lvl.qty,
      });
    }
    return out;
  }

  qtyAt(side: Side, priceTicks: number): number {
    const arr = this.side(side);
    const { found, idx } = this.locate(arr, signed(side, priceTicks));
    return found ? this.levels[arr[idx].ptr].qty : 0;
  }

  insideOrders(side: Side, ticks: number): number[] {
    const ids: number[] = [];
    for (const o of this.orders.values()) {
      if (!o.open || o.qty === 0 || o.side !== side) continue;
      if (side === "bid" ? o.priceTicks > ticks : o.priceTicks < ticks) {
        ids.push(o.id);
      }
    }
    return ids;
  }

  openOrderIds(): number[] {
    const ids: number[] = [];
    for (const o of this.orders.values()) if (o.open && o.qty > 0) ids.push(o.id);
    return ids;
  }

  get restingQty() {
    let n = 0;
    for (const o of this.orders.values()) if (o.open) n += o.qty;
    return n;
  }

  validate(): string[] {
    const bad: string[] = [];

    for (const [name, arr] of [
      ["bids", this.bids],
      ["asks", this.asks],
    ] as const) {
      for (let i = 1; i < arr.length; i++) {
        if (arr[i].sprice >= arr[i - 1].sprice) {
          bad.push(`${name} not strictly descending at ${i}`);
        }
      }
      for (const pl of arr) {
        const lvl = this.levels[pl.ptr];
        if (lvl.free) bad.push(`${name} references a freed level`);
        if (lvl.sprice !== pl.sprice) bad.push(`${name} sprice mismatch`);
        if (lvl.qty <= 0) bad.push(`${name} holds an empty level`);

        let sum = 0;
        for (let i = lvl.head; i < lvl.fifo.length; i++) {
          const o = this.orders.get(lvl.fifo[i]);
          if (o && o.open) sum += o.qty;
        }
        if (sum !== lvl.qty) {
          bad.push(`aggregate ${lvl.qty} != sum of orders ${sum}`);
        }
      }
    }

    const b = this.bestBidTicks();
    const a = this.bestAskTicks();
    if (b !== null && a !== null && b >= a) {
      bad.push(`crossed book: bid ${b} >= ask ${a}`);
    }

    if (new Set(this.freeList).size !== this.freeList.length) {
      bad.push("free list contains a duplicate");
    }
    for (const ptr of this.freeList) {
      if (!this.levels[ptr].free) bad.push("free list holds a live level");
    }

    for (const o of this.orders.values()) {
      if (!o.open) continue;
      const lvl = this.levels[o.levelPtr];
      if (lvl.free) bad.push(`order ${o.id} points at a freed level`);
      if (lvl.sprice !== signed(o.side, o.priceTicks)) {
        bad.push(`order ${o.id} points at the wrong level`);
      }
    }

    const conserved =
      this.restingQty + 2 * this.qtyTraded + this.qtyCancelled;
    if (conserved !== this.qtyAdded) {
      bad.push(
        `quantity not conserved: added ${this.qtyAdded}, resting+2*traded+cancelled ${conserved}`,
      );
    }

    return bad;
  }
}
