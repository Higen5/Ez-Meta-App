const PLAYER_HEALTH = 100;

export function damageAtRange(curve: [number, number][], range: number): number {
  let damage = curve[0]?.[1];
  for (const [r, d] of curve) if (r <= range) damage = d;
  return damage;
}

export function ttkAtRange(rpm: number, curve: [number, number][], range: number): number {
  const btk = Math.ceil(PLAYER_HEALTH / damageAtRange(curve, range));
  return (btk - 1) * (60 / rpm);
}

export const RANGE_BANDS = [
  { range: 10, weight: 0.35 },
  { range: 30, weight: 0.40 },
  { range: 60, weight: 0.25 },
];
export const RECOIL_WEIGHT = 0.15;
// ponytail: adsRecoilTierMod bir "kademe" birimi; recoilV ile ayni olcekte degil.
// Kademe basina %5 varsayiyoruz. Kalibrasyon sabiti, olcum cikarsa degistirilir.
const RECOIL_TIER_STEP = 0.05;

/** Pipeline'daki skor formulunun aynisi, secili eklentilerin recoil etkisiyle. */
export function scoreWithBuild(
  rpm: number,
  curve: [number, number][],
  recoilV: number,
  totalRecoilMod: number
): number {
  const weightedTtk = RANGE_BANDS.reduce(
    (sum, b) => sum + b.weight * ttkAtRange(rpm, curve, b.range),
    0
  );
  const adjustedRecoil = recoilV * (1 + totalRecoilMod * RECOIL_TIER_STEP);
  const effectiveTtk = weightedTtk * (1 + adjustedRecoil * RECOIL_WEIGHT);
  return effectiveTtk === 0 ? 100000 : Math.round(100 / effectiveTtk);
}
