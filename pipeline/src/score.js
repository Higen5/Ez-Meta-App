import { TIER_CUTS } from './config.js';

export function assignTiers(scored) {
  const byClass = new Map();
  for (const w of scored) {
    if (!byClass.has(w.cls)) byClass.set(w.cls, []);
    byClass.get(w.cls).push(w);
  }
  for (const group of byClass.values()) {
    group.sort((a, b) => b.score - a.score);
    group.forEach((w, i) => {
      const percentile = i / group.length;
      w.tier = TIER_CUTS.find((c) => percentile <= c.maxPercentile).tier;
    });
  }
  return scored;
}
