// Artik yalnizca tier esikleri ve Dota 2 kaynak URL'si var: eski oyun
// sabitleri (BF6 eski TTK yolu, Helldivers 2) lisans nedeniyle kaldirildi.

export const TIER_CUTS = [
  { tier: 'S', maxPercentile: 0.15 },
  { tier: 'A', maxPercentile: 0.40 },
  { tier: 'B', maxPercentile: 0.70 },
  { tier: 'C', maxPercentile: 1.00 },
];

// --- Dota 2 ---

// Tek endpoint, anahtar gerekmez. Skor dogrudan bu kaynaktaki derece kovasi
// kazanma oranidir (bkz. pipeline/src/games/dota2.js) — agirlik/bant/ceza
// sabiti YOK, cunku gercek sonuc verisi var ve simulasyon gerekmiyor.
export const DOTA2_SOURCE_URL = 'https://api.opendota.com/api/heroStats';
