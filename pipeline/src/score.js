import { TIER_CUTS } from './config.js';

// cuts opsiyonel: verilmezse eski davranis (TIER_CUTS, Dota 2'nin kullandigi
// genel kesim) korunur. BF6 iki kez cagirir -- once cls:'ALL' ile genel
// yuzdelikten, sonra cls:category ile sinif ici yuzdelikten, farkli cuts
// kumeleriyle (bkz. games/bf6-tierlist.js).
export function assignTiers(scored, cuts = TIER_CUTS) {
  const byClass = new Map();
  for (const w of scored) {
    if (!byClass.has(w.cls)) byClass.set(w.cls, []);
    byClass.get(w.cls).push(w);
  }
  for (const group of byClass.values()) {
    group.sort((a, b) => b.score - a.score);
    group.forEach((w, i) => {
      const percentile = i / group.length;
      w.tier = cuts.find((c) => percentile <= c.maxPercentile).tier;
    });
  }
  return scored;
}
