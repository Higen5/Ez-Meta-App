import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codeHash } from '../code-hash.js';
import { assignTiers } from '../score.js';

const SOURCE_PATH = fileURLToPath(new URL('../../data/bf6-tierlist.json', import.meta.url));
const BUILDS_PATH = fileURLToPath(new URL('../../data/bf6-builds.json', import.meta.url));

// Kaynaktaki sinif degerleri BUYUK harfle geliyor (ekran goruntusu basliklari).
// SMG kisaltmasi disinda Title Case'e cevrilir. Bilinmeyen bir sinif
// validateBf6Tierlist'te firlatir, burada sessizce gecmez.
const CATEGORY_MAP = {
  'ASSAULT RIFLE': 'Assault Rifle',
  CARBINE: 'Carbine',
  SMG: 'SMG',
  'SNIPER RIFLE': 'Sniper Rifle',
  LMG: 'LMG',
  DMR: 'DMR',
  SHOTGUN: 'Shotgun',
  SECONDARY: 'Secondary',
};

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function categoryLabel(sinif) {
  return CATEGORY_MAP[sinif];
}

// Genel (kategoriler arasi) sira -> skor. 1. sira 10000 alir, sonuncu sira
// 10000/total'a duser. Kaynak GENEL bir siralama oldugu icin artik kategoriler
// arasi beraberlik yok; yine de beraberligi kirmaya calisan bir hile (isim
// hash'i, epsilon vb.) EKLENMEZ.
export function scoreFromRank(rank, total) {
  return Math.round((10000 * (total - rank + 1)) / total);
}

export function validateBf6Tierlist(tierlist) {
  const siralama = tierlist?.siralama;
  if (!Array.isArray(siralama) || siralama.length === 0) {
    throw new Error('bf6 tierlist: siralama bos ya da dizi degil');
  }
  const total = siralama.length;
  const seenRanks = new Set();
  for (const item of siralama) {
    if (!item.ad || typeof item.ad !== 'string') {
      throw new Error(`bf6 tierlist: rank ${item.rank} icin ad eksik`);
    }
    if (!CATEGORY_MAP[item.sinif]) {
      throw new Error(`bf6 tierlist: "${item.ad}" icin bilinmeyen sinif "${item.sinif}"`);
    }
    if (!Number.isInteger(item.rank) || item.rank < 1 || item.rank > total) {
      throw new Error(`bf6 tierlist: "${item.ad}" rank 1..${total} araliginda degil`);
    }
    if (seenRanks.has(item.rank)) {
      throw new Error(`bf6 tierlist: tekrarlanan rank ${item.rank}`);
    }
    seenRanks.add(item.rank);
  }
  if (seenRanks.size !== total) {
    throw new Error(`bf6 tierlist: rank 1..${total} arasinda bosluk var`);
  }
}

// builds icindeki her silah adi siralama'da gercekten var olmali -- yazim
// hatasi sessizce yutulmasin. Ters yon serbest: build'i olmayan silah normal.
function validateBf6Builds(tierlist, builds) {
  if (!builds) return;
  const knownNames = new Set(tierlist.siralama.map((item) => item.ad));
  for (const name of Object.keys(builds)) {
    if (!knownNames.has(name)) {
      throw new Error(`bf6 builds: "${name}" siralama'da yok`);
    }
  }
}

// Kaynagi iki yerel dosyadan okur, aga hic cikmaz. Hash ikisinin metnini de
// kapsar (bkz. fetch-source.js'deki iki kaynakli hash kalibi) -- yoksa builds
// dosyasi tek basina degisince yeniden uretim tetiklenmez. fetchImpl imza
// uyumlulugu icin alinir ama kullanilmaz (runGameBuild'in fetchRaw cagirim
// seklini bozmamak icin).
export async function fetchBf6TierlistSource(_fetchImpl) {
  const [tierlistText, buildsText] = await Promise.all([
    readFile(SOURCE_PATH, 'utf8'),
    readFile(BUILDS_PATH, 'utf8'),
  ]);
  const hash = createHash('sha256').update(tierlistText).update(buildsText).update(await codeHash()).digest('hex');
  return { tierlist: JSON.parse(tierlistText), builds: JSON.parse(buildsText).builds, hash };
}

export function buildBf6TierlistEntities({ tierlist, builds }) {
  validateBf6Tierlist(tierlist);
  validateBf6Builds(tierlist, builds);

  const total = tierlist.siralama.length;
  const entities = tierlist.siralama.map((item) => {
    const category = categoryLabel(item.sinif);
    const build = builds?.[item.ad];
    return {
      id: slugify(item.ad),
      name: item.ad,
      category,
      score: scoreFromRank(item.rank, total),
      stats: {},
      statLines: [{ label: 'RANK', value: `${item.rank} / ${total}` }],
      ...(build ? { build } : {}),
      rationale: {
        note:
          "Score is derived from this weapon's position in a third-party tier list's overall "
          + 'ranking, not from a measured stat. This is not a measured value.',
      },
      // assignTiers bu alana gore gruplar. BF6'da TEK grup kullaniyoruz, yani
      // tier sinif ici degil GENEL yuzdelikten hesaplaniyor.
      //
      // Sebep: BF6'nin skoru zaten genel siradan (1-62) geliyor. Sinif ici
      // tier ile birlestirince ikisi farkli hikaye anlatiyordu: KORD 6P67
      // genel 4. sirada olmasina ragmen assault rifle'lar icinde 3/11 (%18)
      // oldugu icin A gorunuyor, DRS-IAR ise genel 5. ama LMG'lerde 1/10 (%0)
      // oldugu icin S gorunuyordu. Liste skora gore sirali oldugundan bu
      // ekranda dogrudan celiski olarak okunuyor.
      //
      // Bedeli: zayif siniflarin en iyisi artik S olmuyor (orn. P18 en iyi
      // secondary ama genelde 57. sirada, C aliyor). Bu dogru olan: kaynak
      // onu 62 silah icinde oraya koymus.
      cls: 'ALL',
    };
  });

  assignTiers(entities);
  for (const e of entities) delete e.cls;
  return entities;
}
