import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { codeHash } from '../code-hash.js';
import { fileURLToPath } from 'node:url';

const SOURCE_PATH = fileURLToPath(new URL('../../data/hd2-tierlist.json', import.meta.url));

// Tier taban skorlari. Tier icindeki pozisyon 0..999 arasi bir ek alir, bu
// yuzden bir bandin skoru komsu banda ASLA tasmaz (bkz. hd2-tierlist.test.js).
const TIER_BASE = { 'S+': 6000, S: 5000, A: 4000, B: 3000, C: 2000, D: 1000 };

const FACTIONS = ['auto', 'term', 'illum'];
const VALID_TIEBREAKS = new Set(['dps', 'ap', 'health', 'none']);

// Kaynak tablolarinda AP sutunu zaten "2. Light", "3. Medium" vs. bicimde
// yazili -- sayiyi biz veriye alirken sadece rakami sakladik. 1 ve 8 veride
// hic gecmiyor. Siralama mantigi (sortCategory/computeFactionScores) sayisal
// item.ap degerini KULLANMAYA DEVAM EDER; bu harita yalnizca statLine
// GORUNUMU icindir.
const AP_LABELS = { 0: 'None', 2: 'Light', 3: 'Medium', 4: 'Heavy', 5: 'Anti-Tank', 6: 'Anti-Tank', 7: 'Anti-Tank', 9: 'Anti-Tank' };

// Bilinmeyen bir ap degeri gelirse sessizce "Anti-Tank" varsaymadan sayiyi
// oldugu gibi metne cevirir (bkz. validateHd2Tierlist'teki gorunurluk kontrolu).
export function apLabel(ap) {
  return AP_LABELS[ap] ?? String(ap);
}

// tierOlcegi'nin kendisi sabit ve dogrulanmis (bkz. TIER_BASE) -- sortCategory
// tier bandi sirasini bulmak icin bunu kullanir.
const TIER_ORDER = ['S+', 'S', 'A', 'B', 'C', 'D'];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Tier bandi + tier icindeki pozisyon -> nihai skor. pos 0 = tier'in en iyisi
// (en yuksek ek), tierCount-1 = en dusugu (ek 0). Tek oge varsa en yuksek eki
// alir (pos=0 zaten bunu verir, ozel dal sadece bolme-sifira-bolunme icin).
export function scoreForTier(tier, posInTier, tierCount) {
  const base = TIER_BASE[tier];
  if (base === undefined) throw new Error(`hd2 tierlist: bilinmeyen tier "${tier}"`);
  const addition = tierCount <= 1
    ? 999
    : Math.round((999 * (tierCount - 1 - posInTier)) / (tierCount - 1));
  return base + addition;
}

// items'i once tier'a (tierOlcegi sirasi), sonra tier icinde tieBreak alanina
// gore AZALAN siralar. null tieBreak degeri tier icinde en sona gider.
// tieBreak === 'none' ise tier icinde kaynagin dizi sirasi korunur. Esitlikte
// de kaynak sirasi korunur (Array.sort kararli olsa da index'e gore acikca
// kirilir, garanti olsun diye).
export function sortCategory(items, faction, tieBreak) {
  const tierRank = new Map(TIER_ORDER.map((t, i) => [t, i]));
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const rankDiff = tierRank.get(a.item[faction]) - tierRank.get(b.item[faction]);
      if (rankDiff !== 0) return rankDiff;
      if (tieBreak !== 'none') {
        const va = a.item[tieBreak];
        const vb = b.item[tieBreak];
        if (va == null && vb != null) return 1; // null en sona
        if (va != null && vb == null) return -1;
        if (va != null && vb != null && va !== vb) return vb - va; // azalan
      }
      return a.index - b.index; // kaynak sirasi (esitlik / 'none')
    })
    .map((x) => x.item);
}

// Bir kategorideki tum ogeler icin, tek bir faction'a gore ad -> {tier,score}
// haritasi uretir.
function computeFactionScores(items, faction, tieBreak) {
  const sorted = sortCategory(items, faction, tieBreak);
  const scores = new Map();
  let i = 0;
  while (i < sorted.length) {
    const tier = sorted[i][faction];
    let j = i;
    while (j < sorted.length && sorted[j][faction] === tier) j++;
    const tierCount = j - i;
    for (let pos = 0; pos < tierCount; pos++) {
      const item = sorted[i + pos];
      scores.set(item.ad, { tier, score: scoreForTier(tier, pos, tierCount) });
    }
    i = j;
  }
  return scores;
}

// Kategoriye gore degisen ek alanlari statLines'a cevirir. Sadece dolu
// (undefined/null olmayan) alanlar eklenir. Armor Passive'in stats[] ve
// Vehicle'in weapons[] dizileri her biri ayri bir satir olur -- ayni label
// (EFFECT / WEAPON) birden fazla kez gecebilir.
//
// Sira onemli: uygulama satirin sagında statLines[0]'i gosterir. AP'si olan
// kategorilerde (Primary, Secondary, Support Weapon, Throwable, Sentry &
// Emplacement) AP en basta olmali; bu yuzden ilk kontrol o. AP'si olmayan
// kategorilerde ilk sirayi, o kategoride gercekten dolu olan bir sonraki alan
// dogal olarak alir (Eagle->USES, Booster->MEDALS, Orbital->COOLDOWN,
// Vehicle->HEALTH, Armor Passive->ilk EFFECT) -- health, cooldown'dan once
// kontrol edildigi icin Vehicle'da HEALTH kazanir.
function statLinesForItem(item) {
  const lines = [];
  if (item.ap != null) lines.push({ label: 'AP', value: apLabel(item.ap) });
  if (item.dps !== undefined) lines.push({ label: 'DPS', value: String(item.dps) });
  if (item.max !== undefined) lines.push({ label: 'MAX', value: String(item.max) });
  if (item.demo !== undefined) lines.push({ label: 'DEMO', value: String(item.demo) });
  if (item.backpack !== undefined) lines.push({ label: 'BACKPACK', value: item.backpack ? 'Yes' : 'No' });
  if (item.usesStandard !== undefined && item.usesUpgraded !== undefined) {
    lines.push({ label: 'USES', value: `${item.usesStandard} / ${item.usesUpgraded}` });
  }
  if (item.damageType !== undefined) lines.push({ label: 'DAMAGE', value: item.damageType });
  if (item.medals !== undefined) lines.push({ label: 'MEDALS', value: String(item.medals) });
  if (item.health !== undefined) lines.push({ label: 'HEALTH', value: String(item.health) });
  if (item.crew !== undefined) lines.push({ label: 'CREW', value: item.crew });
  if (item.cooldown !== undefined) lines.push({ label: 'COOLDOWN', value: `${item.cooldown}s` });
  if (Array.isArray(item.stats)) for (const s of item.stats) lines.push({ label: 'EFFECT', value: s });
  if (Array.isArray(item.weapons)) for (const w of item.weapons) lines.push({ label: 'WEAPON', value: w });
  return lines;
}

export function validateHd2Tierlist(tierlist) {
  const tierScale = tierlist?.tierOlcegi;
  const kategoriler = tierlist?.kategoriler;
  if (!Array.isArray(tierScale) || tierScale.length === 0) {
    throw new Error('hd2 tierlist: tierOlcegi bos ya da dizi degil');
  }
  if (!kategoriler || typeof kategoriler !== 'object' || Object.keys(kategoriler).length === 0) {
    throw new Error('hd2 tierlist: kategoriler bos');
  }
  const tierSet = new Set(tierScale);
  const seenNames = new Set();
  for (const [catName, cat] of Object.entries(kategoriler)) {
    if (!VALID_TIEBREAKS.has(cat?.tieBreak)) {
      throw new Error(`hd2 tierlist: "${catName}" icin gecersiz tieBreak "${cat?.tieBreak}"`);
    }
    if (!Array.isArray(cat.items) || cat.items.length === 0) {
      throw new Error(`hd2 tierlist: "${catName}" kategorisi bos`);
    }
    for (const item of cat.items) {
      if (!item.ad || typeof item.ad !== 'string') {
        throw new Error(`hd2 tierlist: "${catName}" icinde adi eksik bir oge var`);
      }
      if (seenNames.has(item.ad)) {
        throw new Error(`hd2 tierlist: tekrarlanan ad "${item.ad}"`);
      }
      seenNames.add(item.ad);
      for (const faction of FACTIONS) {
        if (!tierSet.has(item[faction])) {
          throw new Error(`hd2 tierlist: "${item.ad}" icin gecersiz ${faction} tier "${item[faction]}"`);
        }
      }
      // Bilinmeyen ap degeri FIRLATMAZ -- statLine yine de sayiyi metne
      // cevirip devam eder (bkz. apLabel). Sadece gorulebilir olsun diye uyar.
      if (item.ap != null && !(item.ap in AP_LABELS)) {
        console.warn(`hd2 tierlist: "${item.ad}" icin bilinmeyen ap degeri "${item.ap}"`);
      }
    }
  }
}

// Kaynagi yerel dosyadan okur, aga hic cikmaz. fetchImpl imza uyumlulugu icin
// alinir ama kullanilmaz (runGameBuild'in fetchRaw cagirim seklini bozmamak
// icin, bkz. bf6-tierlist.js'deki ayni kalip).
export async function fetchHd2TierlistSource(_fetchImpl) {
  const text = await readFile(SOURCE_PATH, 'utf8');
  const hash = createHash('sha256').update(text).update(await codeHash()).digest('hex');
  return { tierlist: JSON.parse(text), hash };
}

export function buildHd2TierlistEntities({ tierlist }) {
  validateHd2Tierlist(tierlist);

  const entities = [];
  for (const [category, cat] of Object.entries(tierlist.kategoriler)) {
    const perFaction = {
      auto: computeFactionScores(cat.items, 'auto', cat.tieBreak),
      term: computeFactionScores(cat.items, 'term', cat.tieBreak),
      illum: computeFactionScores(cat.items, 'illum', cat.tieBreak),
    };

    for (const item of cat.items) {
      const illum = perFaction.illum.get(item.ad);
      entities.push({
        id: slugify(item.ad),
        name: item.ad,
        category,
        tier: illum.tier, // varsayilan faction: Illuminate (kaynak tablolari ona gore sirali)
        score: illum.score,
        factions: {
          automaton: perFaction.auto.get(item.ad),
          terminid: perFaction.term.get(item.ad),
          illuminate: illum,
        },
        statLines: statLinesForItem(item),
        rationale: {
          note:
            "Tier comes straight from a third-party tier list, one per faction. "
            + 'Score is derived from the tier, not measured in-game.',
        },
      });
    }
  }
  return entities;
}
