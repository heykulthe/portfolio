# siddheshkulthe.vercel.app

Personal site and portfolio, built with [Astro](https://astro.build) and Tailwind.

## Content

Everything lives in content collections under `src/content`:

- `work/` holds one file per role. Frontmatter: `company`, `role`, `dateStart`, `dateEnd`.
  `dateEnd` takes a date or a string like `"Present"`.
- `projects/` holds one file per project. Frontmatter: `title`, `description`, `date`,
  and optional `tech`, `demoURL`, `repoURL`, `draft`.

Site wide facts (name, email, socials, education, honours, skills) live in
`src/consts.ts` rather than in the templates.

## The order book

`src/lib/orderbook.ts` is a real Level 2 limit order book with a matching
engine, not an animation. The memory layout follows
[charles-cooper/itch-order-book](https://github.com/charles-cooper/itch-order-book):
signed prices so both sides sort descending and index 0 is always the best
level, a stable level pool with the sorted arrays holding pointers into it, and
orders carrying a direct handle to their level so cancel is one dereference.
Matching adds a per level FIFO for price-time priority. Prices are integer
ticks; there are no floats in the book.

`src/lib/market.ts` generates order flow. A fair value drifts, makers quote
around it, and takers cross when fair value pulls away from the mid, so the
touch moves because liquidity was consumed rather than because a price variable
was assigned to.

`src/lib/live.ts` runs one shared market. The ladder on the home page and the
page background are two views of the same book. Warm-up replays the same seed
and step count the server used, so the server rendered ladder and the client's
first frame are the identical state.

## Design tokens

| Token  | Light     | Dark      |
| ------ | --------- | --------- |
| paper  | `#f6f2eb` | `#0d0c0b` |
| ink    | `#141210` | `#e9e2d9` |

Type is Fraunces for display, Inter for body, Maple Mono for labels and metadata.
All three are self hosted through Fontsource and preloaded.

## Commands

| Command               | Does                                  |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Dev server on `localhost:4321`        |
| `npm run dev:network` | Same, exposed on the LAN              |
| `npm run build`       | `astro check` then a production build |
| `npm run preview`     | Serve the built site                  |
| `npm run lint`        | ESLint                                |

## Deploying

`astro.config.mjs` sets `site` to `https://siddheshkulthe.vercel.app`. The sitemap, RSS
feed and canonical URLs are derived from it, so update it if the domain changes.
