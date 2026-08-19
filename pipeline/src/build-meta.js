import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fetchBf6TierlistSource, buildBf6TierlistEntities } from './games/bf6-tierlist.js';
import { fetchDota2Source, buildDota2Entities } from './games/dota2.js';
import { fetchHd2TierlistSource, buildHd2TierlistEntities } from './games/hd2-tierlist.js';
import { fetchArcTierlistSource, buildArcTierlistEntities } from './games/arc-tierlist.js';

const DATA_DIR = fileURLToPath(new URL('../../data/', import.meta.url));

// scoreNote: skorun NEYI olctugu ve bilinen siniri. Cikti dosyasina yazilir ki
// sinir veriyle birlikte tasinsin, sadece README'de kalmasin.
const GAMES = [
  {
    id: 'bf6', gameName: 'Battlefield 6', file: 'bf6.json',
    fetchRaw: fetchBf6TierlistSource, buildEntities: buildBf6TierlistEntities,
    scoreNote:
      "Score is derived from a weapon's position in a third-party tier list's overall ranking, "
      + 'not from measured stats. Rank 1 of 62 scores 10000 and the rest scale down by position. '
      + 'Nothing here is calculated from weapon statistics — it reflects that list\'s editorial '
      + 'ordering.',
  },
  {
    id: 'dt2', gameName: 'Dota 2', file: 'dt2.json',
    fetchRaw: fetchDota2Source, buildEntities: buildDota2Entities,
    scoreNote:
      "Score is the measured win rate in ranked public matches (rank-bracketed "
      + "only), from OpenDota's rolling ~7 day window. Nothing is simulated and no "
      + 'weights are hand-tuned. Caveat: a high pub win rate means the hero wins '
      + 'more games in ranked matchmaking, not that it is strongest in optimal or '
      + 'professional play. Per-position win rates are not available from any free '
      + 'source, so heroes are grouped by primary attribute, not by position.',
  },
  {
    id: 'hd2', gameName: 'Helldivers 2', file: 'hd2.json',
    fetchRaw: fetchHd2TierlistSource, buildEntities: buildHd2TierlistEntities,
    // Kaynak tablodaki sutun sirasi. id degerleri entity.factions anahtarlariyla
    // birebir ayni olmali (bkz. games/hd2-tierlist.js). Uygulama faction
    // cubugunu bu alanin VARLIGINA gore gosterir -- bf6/dt2'de bu alan yok.
    factions: [
      { id: 'automaton', name: 'Automaton' },
      { id: 'terminid', name: 'Terminid' },
      { id: 'illuminate', name: 'Illuminate' },
    ],
    // Skor mutlak tier'dan geliyor ve tier ici sira kategori bazinda
    // hesaplaniyor -- her kategorinin en iyi S+ ogesi 6999 alir, yani
    // "skora gore ilk 5" birden fazla kategoriden gelen esit skorlar
    // yuzunden keyfi gorunur. Uygulama bu alanin VARLIGINA gore (oyun
    // id'sine gore degil) META ekranini kategori-basina-bir-oge modunda
    // gosterir.
    feedMode: 'topPerCategory',
    // Arsiv ekrani skor yerine statLines[0].value gostersin -- feedMode HANGI
    // ogelerin listelenecegini, listValue NE gosterilecegini kontrol eder, ikisi
    // ayri kavram. Uygulama bu alanin VARLIGINA gore (oyun id'sine gore degil)
    // karar verir -- bf6/dt2'de bu alan yok.
    listValue: 'stat',
    scoreNote:
      'Tiers come straight from a third-party tier list, one per faction (Automaton, '
      + 'Terminid, Illuminate) — they are not calculated. Score is derived from the '
      + 'tier, with position inside a tier broken by DPS, armor penetration or health '
      + 'where the source publishes it. Five categories (Backpack, Eagle, Booster, '
      + "Armor Passive, Orbital) publish no such stat, so within a tier the source's "
      + 'own order is kept — that order is correct for Illuminate only. Nothing here '
      + 'is a measurement of in-game performance.',
  },
  {
    id: 'arc', gameName: 'Arc Raiders', file: 'arc.json',
    fetchRaw: fetchArcTierlistSource, buildEntities: buildArcTierlistEntities,
    // ARC'ta HD2'nin aksine "kategori-basina-bir-oge" modu (feedMode) istenmiyor
    // -- bilerek EKLENMEDI.
    factions: [
      { id: 'pve', name: 'PvE' },
      { id: 'pvp', name: 'PvP' },
    ],
    listValue: 'stat',
    scoreNote:
      'Tiers come straight from a third-party tier list, one per mode (PvE, PvP) — they are '
      + 'not calculated. The ranking was transcribed from screenshots the user supplied; it was '
      + 'not pulled programmatically from any site. Score is derived from the tier, with position '
      + "inside a tier following that list's own order (no measured stat breaks ties). PvE and "
      + "PvP are independent rankings for the same weapon set; a weapon's PvE and PvP tiers can "
      + 'be nearly opposite. Weapon stats (armor penetration, ammo type, firing mode, magazine '
      + 'size) come from the RaidTheory/arcraiders-data catalog (MIT license), pinned to a fixed '
      + 'commit. Nothing here is a measurement of in-game performance.',
  },
];

async function readExistingHash(outPath) {
  try {
    const raw = await readFile(outPath, 'utf8');
    return JSON.parse(raw).sourceHash;
  } catch {
    return null;
  }
}

// Tek bir oyunun kaynagini ceker, degistiyse (hash farkliysa) dogrular ve
// dosyayi yazar. Degismediyse ya da dogrulama basarisizsa mevcut dosyaya
// dokunmaz.
async function runGameBuild({ id, gameName, scoreNote, fetchRaw, buildEntities, factions, feedMode, listValue, now, fetch: fetchImpl = fetch, outPath }) {
  const raw = await fetchRaw(fetchImpl);

  if (raw.hash === (await readExistingHash(outPath))) {
    console.log(`${id}: kaynak degismedi, cikiliyor.`);
    return { changed: false };
  }

  const entities = buildEntities(raw);

  const meta = { game: id, gameName, scoreNote, sourceHash: raw.hash, generatedAt: now(), entities };
  if (factions) meta.factions = factions; // sadece birden fazla faction'i olan oyunlar tasir (bkz. hd2)
  if (feedMode) meta.feedMode = feedMode; // sadece kategori-basina-bir-oge modu isteyen oyunlar tasir (bkz. hd2)
  if (listValue) meta.listValue = listValue; // sadece liste satirinda skor yerine stat gosterecek oyunlar tasir (bkz. hd2)
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(meta, null, 2), 'utf8');
  console.log(`${outPath} yazildi: ${entities.length} varlik`);
  return { changed: true, count: entities.length };
}

// Geriye uyumluluk icin korunan isim/imza: mevcut testler bunu dogrudan
// cagiriyor. BF6 hattini calistirir.
export async function buildMeta({ now = () => new Date().toISOString(), fetch: fetchImpl = fetch, outPath = join(DATA_DIR, 'bf6.json') } = {}) {
  const bf6 = GAMES.find((g) => g.id === 'bf6');
  return runGameBuild({ id: bf6.id, gameName: bf6.gameName, scoreNote: bf6.scoreNote, fetchRaw: bf6.fetchRaw, buildEntities: bf6.buildEntities, now, fetch: fetchImpl, outPath });
}

export async function buildDota2Meta({ now = () => new Date().toISOString(), fetch: fetchImpl = fetch, outPath = join(DATA_DIR, 'dt2.json') } = {}) {
  const dt2 = GAMES.find((g) => g.id === 'dt2');
  return runGameBuild({ id: dt2.id, gameName: dt2.gameName, scoreNote: dt2.scoreNote, fetchRaw: dt2.fetchRaw, buildEntities: dt2.buildEntities, now, fetch: fetchImpl, outPath });
}

export async function buildHd2Meta({ now = () => new Date().toISOString(), fetch: fetchImpl = fetch, outPath = join(DATA_DIR, 'hd2.json') } = {}) {
  const hd2 = GAMES.find((g) => g.id === 'hd2');
  return runGameBuild({ id: hd2.id, gameName: hd2.gameName, scoreNote: hd2.scoreNote, fetchRaw: hd2.fetchRaw, buildEntities: hd2.buildEntities, factions: hd2.factions, feedMode: hd2.feedMode, listValue: hd2.listValue, now, fetch: fetchImpl, outPath });
}

export async function buildArcMeta({ now = () => new Date().toISOString(), fetch: fetchImpl = fetch, outPath = join(DATA_DIR, 'arc.json') } = {}) {
  const arc = GAMES.find((g) => g.id === 'arc');
  return runGameBuild({ id: arc.id, gameName: arc.gameName, scoreNote: arc.scoreNote, fetchRaw: arc.fetchRaw, buildEntities: arc.buildEntities, factions: arc.factions, listValue: arc.listValue, now, fetch: fetchImpl, outPath });
}

async function writeGamesIndex() {
  const index = GAMES.map((g) => ({ id: g.id, name: g.gameName, file: g.file }));
  await writeFile(join(DATA_DIR, 'games.json'), JSON.stringify(index, null, 2), 'utf8');
}

// ponytail: process.argv[1]'i file:// ile elle birlestirmek Windows'ta hicbir
// zaman eslesmez (ters egik cizgi + URL-encode yok). pathToFileURL platformdan
// bagimsiz calisir.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    // Her oyun BAGIMSIZ calisir. Onceden hepsi tek try/catch icindeydi ve bir
    // oyunun kaynagi patlayinca sonraki oyunlar hic denenmiyordu, games.json
    // bile yazilmiyordu. Dota 2 kaynagi canli bir API (OpenDota) — gecici
    // kesinti ya da rate limit normaldir ve BF6 ciktisini bozmamali.
    // BF6 agdan hic veri cekmiyor: pipeline/data/bf6-tierlist.json
    // icindeki elle bakimli, kullanicinin kendi ekran goruntulerinden
    // olusturdugu bir sira listesini okuyor (bkz. games/bf6-tierlist.js).
    const steps = [
      ['bf6', buildMeta],
      ['dt2', buildDota2Meta],
      ['hd2', buildHd2Meta],
      ['arc', buildArcMeta],
    ];

    const failed = [];
    for (const [id, run] of steps) {
      try {
        await run();
      } catch (err) {
        failed.push(id);
        console.error(`${id}: basarisiz — ${err.message}`);
      }
    }

    // Indeks her durumda yazilir: icerigi GAMES sabitinden gelir, o gunku
    // cekme sonucundan degil.
    await writeGamesIndex();

    if (failed.length) process.exit(1);
  })();
}
