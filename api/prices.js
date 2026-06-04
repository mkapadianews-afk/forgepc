// api/prices.js — Vercel (Node) serverless function
// ---------------------------------------------------------------------------
// Fetches current Best Buy prices for the RigForge catalog and returns:
//   { updatedAt: "<ISO date>", prices: { <partId>: { bestbuy: <number> }, ... } }
//
// The per-part object is intentionally a map of source -> price, so you can add
// more sources later (e.g. newegg, amazon via a paid scraper API) by merging
// extra keys into each part. The app picks the lowest available price.
//
// SETUP (see PRICING_SETUP.md):
//   1. Get a free Best Buy API key (developer.bestbuy.com) using a domain email.
//   2. In Vercel: Project Settings -> Environment Variables -> BESTBUY_API_KEY.
//   3. Deploy. This becomes available at /api/prices.
//   4. Optional cron (vercel.json) to refresh once a day.
// ---------------------------------------------------------------------------

import { PART_QUERIES } from "../data/part-queries.js";

const BESTBUY_KEY = process.env.BESTBUY_API_KEY;

async function bestBuyPrice({ sku, q }) {
  let url;
  if (sku) {
    // exact SKU lookup (most accurate)
    url =
      `https://api.bestbuy.com/v1/products(sku=${encodeURIComponent(sku)})` +
      `?apiKey=${BESTBUY_KEY}&format=json&show=sku,name,salePrice,onlineAvailability`;
  } else {
    // keyword search, cheapest in-stock match first
    url =
      `https://api.bestbuy.com/v1/products((search=${encodeURIComponent(q)}))` +
      `?apiKey=${BESTBUY_KEY}&format=json&sort=salePrice.asc&pageSize=1` +
      `&show=sku,name,salePrice,onlineAvailability`;
  }
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const p = data.products && data.products[0];
  return p && typeof p.salePrice === "number" && p.salePrice > 0 ? p.salePrice : null;
}

export default async function handler(req, res) {
  if (!BESTBUY_KEY) {
    res.status(500).json({ error: "Missing BESTBUY_API_KEY environment variable" });
    return;
  }

  const prices = {};
  for (const [id, query] of Object.entries(PART_QUERIES)) {
    try {
      const bb = await bestBuyPrice(query);
      if (bb != null) prices[id] = { bestbuy: bb };
      // Best Buy's free tier allows ~5 req/sec; stay well under it.
      await new Promise((r) => setTimeout(r, 220));
    } catch (e) {
      // skip a part that errors; the app keeps its built-in price for it
    }
  }

  // cache at the edge for a day so the app doesn't re-trigger fetches constantly
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=43200");
  res.status(200).json({ updatedAt: new Date().toISOString(), source: "bestbuy", prices });
}
