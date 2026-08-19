import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { codeHash } from '../code-hash.js';
import { fileURLToPath } from 'node:url';

const SOURCE_PATH = fileURLToPath(new URL('../../data/arc-tierlist.json', import.meta.url));

// RaidTheory/arcraiders-data (MIT) katalog kok URL'i. Her silah kendi dosyasinda:
// https://raw.githubusercontent.com/RaidTheory/arcraiders-data/main/items/<slug>_iv.json
const CATALOG_BASE_URL = 'https://raw.githubusercontent.com/RaidTheory/arcraiders-data/main/items/';

// Tier taban skorlari. hd2-tierlist.js'deki scoreForTier ile AYNI mantik --
// buraya kopyalandi, import EDILMEDI (ARC'in HD2'ye bagimliligi olmasin).
const TIER_BASE = { S: 5000, A: 4000, B: 3000, C: 2000, D: 1000 };

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Silah adi -> katalog dosya adi. "Il Toro" -> "il_toro".
function slugifyWeaponName(name) {
  return name.toLowerCase().replace(/[\s-]+/g, '_');
}

// Tier bandi + tier icindeki pozisyon -> nihai skor. pos 0 = tier'in en iyisi.
// bkz. hd2-tierlist.js/scoreForTier icin ayni yorum: bir bandin skoru komsu
// banda ASLA tasmaz (bkz. arc-tierlist.test.js).
export function scoreForTier(tier, posInTier, tierCount) {
  const base = TIER_BASE[tier];
  if (base === undefined) throw new Error(`arc tierlist: bilinmeyen tier "${tier}"`);
  const addition = tierCount <= 1
    ? 999
    : Math.round((999 * (tierCount - 1 - posInTier)) / (tierCount - 1));
  return base + addition;
}

async function fetchJson(fetchImpl, url) {
  const res = await fetchImpl(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`arc katalog: ${url} icin HTTP ${res.status}`);
  return res.json();
}

// Tek bir silahin katalog verisini ceker. Once <slug>_iv.json, o yoksa
// <slug>.json (legendary'lerin tek seviyesi bu isimle gelir, bkz. veri
// dosyasindaki _varyant notu). Ikisi de yoksa FIRLAR -- sessiz veri kaybi bu
// projede once gercek bir bug oldu, oyle birakilmiyor.
//
// Bazi silahlarin effects blogu BOS gelir (Dolabra, Canto, Burletta gercek
// katalogda dogrulandi). Zirh delme (ARC Armor Penetration) o zaman alt
// varyantlarda aranir: iv zaten denendi, sirayla iii -> ii -> i denenir, ilk
// bulunan deger kullanilir. Legendary'lerin numarali varyanti hic olmadigi
// icin bu istekler 404 doner ve dongu sessizce atlar -- AP satiri hic
// eklenmez. AMMO/FIRING MODE/MAGAZINE icin boyle bir geri dusme YOK, sadece
// ana girdinin effects'inden okunur (spesifikasyonda sadece AP icin istendi).
async function fetchWeaponEntry(fetchImpl, name) {
  const slug = slugifyWeaponName(name);
  const entry = (await fetchJson(fetchImpl, `${CATALOG_BASE_URL}${slug}_iv.json`))
    ?? (await fetchJson(fetchImpl, `${CATALOG_BASE_URL}${slug}.json`));
  if (!entry) {
    throw new Error(`arc katalog: "${name}" icin ne ${slug}_iv.json ne de ${slug}.json bulundu`);
  }

  const effects = entry.effects ?? {};
  let ap = effects['ARC Armor Penetration']?.value ?? null;
  if (ap == null) {
    for (const variant of ['iii', 'ii', 'i']) {
      const alt = await fetchJson(fetchImpl, `${CATALOG_BASE_URL}${slug}_${variant}.json`);
      const altAp = alt?.effects?.['ARC Armor Penetration']?.value;
      if (altAp != null) {
        ap = altAp;
        break;
      }
    }
  }

  return {
    category: entry.type,
    ap,
    ammoType: effects['Ammo Type']?.value ?? null,
    firingMode: effects['Firing Mode']?.value ?? null,
    magazineSize: effects['Magazine Size']?.value ?? null,
  };
}

// tierOlcegi sirasinda PvE tier'larini gezip silah adlarini deterministik bir
// dizide toplar. validateArcTierlist bu asamada henuz cagrilmadi -- fetch,
// dogrulamadan ONCE calisir (bkz. runGameBuild: fetchRaw sonra buildEntities).
// Yine de katalog insertion sirasi (dolayisiyla hash) hep ayni olsun diye
// sabit bir sira gerekli; pve tierOlcegi sirasi bu amaca yeter.
function weaponNamesInOrder(tierlist) {
  const seen = new Set();
  const names = [];
  for (const tier of tierlist.tierOlcegi) {
    for (const name of tierlist.modlar.pve[tier] ?? []) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}

// Kaynagi yerel dosyadan okur, sonra her silah icin katalog verisini AG
// UZERINDEN ceker (fetchImpl). hash yerel dosya metni + katalogun deterministik
// serilestirmesi + codeHash'i kapsar -- katalog degisirse de yeniden uretim
// tetiklensin diye.
export async function fetchArcTierlistSource(fetchImpl) {
  const text = await readFile(SOURCE_PATH, 'utf8');
  const tierlist = JSON.parse(text);

  const katalog = {};
  for (const name of weaponNamesInOrder(tierlist)) {
    katalog[name] = await fetchWeaponEntry(fetchImpl, name);
  }

  const hash = createHash('sha256')
    .update(text)
    .update(JSON.stringify(katalog))
    .update(await codeHash())
    .digest('hex');

  return { tierlist, katalog, hash };
}

// pve ve pvp AYNI silah kumesini icermeli, kullanilan tier'lar tierOlcegi
// icinde olmali, bir modda tekrarlanan ad olmamali.
export function validateArcTierlist(tierlist) {
  const tierScale = tierlist?.tierOlcegi;
  if (!Array.isArray(tierScale) || tierScale.length === 0) {
    throw new Error('arc tierlist: tierOlcegi bos ya da dizi degil');
  }
  const tierSet = new Set(tierScale);
  const modlar = tierlist?.modlar;
  if (!modlar?.pve || !modlar?.pvp) {
    throw new Error('arc tierlist: modlar.pve ve modlar.pvp gerekli');
  }

  const namesByMode = {};
  for (const modeId of ['pve', 'pvp']) {
    const mode = modlar[modeId];
    for (const key of Object.keys(mode)) {
      if (key === 'ad' || key === 'aciklama') continue;
      if (!tierSet.has(key)) {
        throw new Error(`arc tierlist: ${modeId} icinde gecersiz tier "${key}"`);
      }
    }
    const seen = new Set();
    for (const tier of tierScale) {
      for (const name of mode[tier] ?? []) {
        if (seen.has(name)) {
          throw new Error(`arc tierlist: ${modeId} icinde tekrarlanan ad "${name}"`);
        }
        seen.add(name);
      }
    }
    namesByMode[modeId] = seen;
  }

  const pveOnly = [...namesByMode.pve].filter((n) => !namesByMode.pvp.has(n));
  const pvpOnly = [...namesByMode.pvp].filter((n) => !namesByMode.pve.has(n));
  if (pveOnly.length || pvpOnly.length) {
    throw new Error(
      'arc tierlist: pve ve pvp ayni silah kumesini icermiyor '
      + `(pve'de fazla: ${pveOnly.join(', ') || '-'}, pvp'de fazla: ${pvpOnly.join(', ') || '-'})`,
    );
  }
}

// Bir moddaki tum silahlar icin ad -> {tier,score} haritasi uretir. Tier ici
// sira kaynagin dizi sirasidir (dps/ap gibi bir tiebreak YOK, HD2'nin
// aksine) -- her mod kendi array sirasini kullanir.
function computeModeScores(tierlist, modeId) {
  const mode = tierlist.modlar[modeId];
  const scores = new Map();
  for (const tier of tierlist.tierOlcegi) {
    const names = mode[tier] ?? [];
    names.forEach((name, pos) => {
      scores.set(name, { tier, score: scoreForTier(tier, pos, names.length) });
    });
  }
  return scores;
}

export function buildArcTierlistEntities({ tierlist, katalog }) {
  validateArcTierlist(tierlist);

  const pveScores = computeModeScores(tierlist, 'pve');
  const pvpScores = computeModeScores(tierlist, 'pvp');

  return weaponNamesInOrder(tierlist).map((name) => {
    const cat = katalog[name];
    if (!cat) throw new Error(`arc tierlist: "${name}" icin katalog verisi eksik`);

    // Sira onemli: uygulama statLines[0]'i gosterir, AP en basta olmali.
    const statLines = [];
    // AP satiri katalogda deger olmasa BILE eklenir. Uygulama listValue='stat'
    // modunda statLines[0]'i gosteriyor; satiri hic koymayinca Dolabra ve
    // Canto'nun yaninda diger 21 silahta AP etiketi varken BOSLUK kaliyordu ve
    // bu hata gibi duruyordu. "—" veri yok demektir, uydurulmus bir deger
    // degil -- kaynak bu iki silah icin hicbir varyantinda AP yayinlamiyor.
    statLines.push({ label: 'AP', value: cat.ap ?? '—' });
    if (cat.ammoType != null) statLines.push({ label: 'AMMO', value: cat.ammoType });
    if (cat.firingMode != null) statLines.push({ label: 'FIRING MODE', value: cat.firingMode });
    if (cat.magazineSize != null) statLines.push({ label: 'MAGAZINE', value: String(cat.magazineSize) });

    const pve = pveScores.get(name);
    return {
      id: slugify(name),
      name,
      category: cat.category,
      tier: pve.tier, // varsayilan mod: PvE
      score: pve.score,
      factions: {
        pve,
        pvp: pvpScores.get(name),
      },
      statLines,
      rationale: {
        note:
          "Tier comes straight from a third-party tier list's ranking, not a measured value. "
          + 'PvE and PvP are separate lists — a weapon can rank near the top against ARC and near '
          + 'the bottom against players, or the reverse. Weapon stats (armor penetration, ammo '
          + 'type, firing mode, magazine size) come from the RaidTheory/arcraiders-data catalog '
          + '(MIT license), not from the tier list source.',
      },
    };
  });
}
