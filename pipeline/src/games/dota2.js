import { createHash } from 'node:crypto';
import { assignTiers } from '../score.js';
import { codeHash } from '../code-hash.js';
import { DOTA2_SOURCE_URL } from '../config.js';

// Derece kovalari 1..8 = Herald, Guardian, Crusader, Archon, Legend, Ancient,
// Divine, Immortal. Kova 8 su an her kahramanda 0 (bkz. dota2.js spec) — bu
// normal, toplama dahil edilir ama bos kova listede gosterilmez.
const BRACKET_NAMES = ['Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'];

const ATTRIBUTE_MAP = { str: 'Strength', agi: 'Agility', int: 'Intelligence', all: 'Universal' };

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function mapAttribute(attr) {
  return ATTRIBUTE_MAP[attr] ?? null;
}

// Kova toplamindan kazanma orani (0..1). pub_pick/pub_win KULLANILMAZ — bkz.
// config.js/spec: kova toplami (36.15M) pub_pick'ten (39.3M) daha iyi
// tanimli, aradaki fark derecesi bilinmeyen maclar.
export function heroWinRate(hero) {
  let picks = 0;
  let wins = 0;
  for (let b = 1; b <= 8; b++) {
    picks += hero[`${b}_pick`] ?? 0;
    wins += hero[`${b}_win`] ?? 0;
  }
  return picks === 0 ? 0 : wins / picks;
}

// Kova bazinda kazanma orani satirlari, rationale.bracketBreakdown icin.
// Bos kova (pick=0) atlanir.
export function bracketRows(hero) {
  const rows = [];
  for (let b = 1; b <= 8; b++) {
    const matches = hero[`${b}_pick`] ?? 0;
    if (matches === 0) continue;
    const wins = hero[`${b}_win`] ?? 0;
    rows.push({ bracket: BRACKET_NAMES[b - 1], winRate: Number(((wins / matches) * 100).toFixed(2)), matches });
  }
  return rows;
}

// Kaynagi ceker ve hashler. Semaya gore DOGRULAMA YAPMAZ — cagiran taraf
// (build-meta.js) once hash'i mevcut dosyayla karsilastirir, sadece
// degistiyse buildDota2Entities'i (ve dolayisiyla validateDota2Source'u) cagirir.
export async function fetchDota2Source(fetchImpl) {
  const res = await fetchImpl(DOTA2_SOURCE_URL);
  if (!res.ok) throw new Error(`Kaynak cekilemedi ${DOTA2_SOURCE_URL}: HTTP ${res.status}`);
  const text = await res.text();
  const hash = createHash('sha256').update(text).update(await codeHash()).digest('hex');
  return { heroes: JSON.parse(text), hash };
}

export function validateDota2Source(heroes) {
  if (!Array.isArray(heroes) || heroes.length < 100) {
    throw new Error('dota2 heroStats: en az 100 kahraman bekleniyor');
  }
  let totalPicks = 0;
  for (const h of heroes) {
    if (!h.localized_name || !h.primary_attr) {
      throw new Error(`dota2 heroStats: "${h.localized_name ?? h.id ?? '?'}" kaydi eksik/gecersiz`);
    }
    // Valve 7.33'te dorduncu ozelligi (Universal) ekledi; besincisi gelirse
    // mapAttribute null doner ve kategori sessizce bos kalir. Sessiz bozulma
    // yerine burada gurultulu patlasin.
    if (!mapAttribute(h.primary_attr)) {
      throw new Error(`dota2 heroStats: bilinmeyen primary_attr "${h.primary_attr}" (${h.localized_name})`);
    }
    for (let b = 1; b <= 8; b++) totalPicks += h[`${b}_pick`] ?? 0;
  }
  if (totalPicks <= 1e6) {
    throw new Error('dota2 heroStats: toplam kova pick beklenenden dusuk');
  }
}

export function buildDota2Entities({ heroes }) {
  validateDota2Source(heroes);

  // Pick rate icin payda: tum kahramanlarin kova pick toplami, 10'a bolunmus
  // (bir mac 10 kahraman secimi icerir) -> pencerede yaklasik toplam mac sayisi.
  const heroPickTotals = heroes.map((h) => {
    let picks = 0;
    for (let b = 1; b <= 8; b++) picks += h[`${b}_pick`] ?? 0;
    return picks;
  });
  const totalMatchesEstimate = heroPickTotals.reduce((s, p) => s + p, 0) / 10;

  const entities = heroes.map((h, i) => {
    const winRate = heroWinRate(h);
    const score = Math.round(10000 * winRate);
    const breakdown = bracketRows(h);
    const totalPicks = heroPickTotals[i];
    const pickRate = totalMatchesEstimate ? (totalPicks / totalMatchesEstimate) * 100 : 0;

    const category = mapAttribute(h.primary_attr);

    return {
      id: slugify(h.localized_name),
      name: h.localized_name,
      category,
      score,
      stats: { heroId: h.id, attackType: h.attack_type, roles: h.roles ?? [] },
      statLines: [
        { label: 'WIN RATE', value: `${(winRate * 100).toFixed(2)}%` },
        { label: 'PICK RATE', value: `${pickRate.toFixed(2)}%` },
        { label: 'MATCHES', value: totalPicks.toLocaleString('en-US') },
        { label: 'ATTACK', value: h.attack_type },
        { label: 'ROLES', value: (h.roles ?? []).join(' · ') },
      ],
      rationale: {
        bracketBreakdown: breakdown,
        note:
          "Win rate from OpenDota's rank-bracketed public match win/loss counts, rolling window. "
          + 'Pro and unranked pub matches are excluded (too few pro games per hero to be meaningful; '
          + 'unranked matches have no bracket).',
      },
      cls: category, // assignTiers bu alani kullanir
    };
  });

  assignTiers(entities);
  for (const e of entities) delete e.cls;
  return entities;
}
