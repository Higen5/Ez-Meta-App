import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fetchBf6TierlistSource, buildBf6TierlistEntities } from './games/bf6-tierlist.js';
import { fetchDota2Source, buildDota2Entities } from './games/dota2.js';

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
async function runGameBuild({ id, gameName, scoreNote, fetchRaw, buildEntities, now, fetch: fetchImpl = fetch, outPath }) {
  const raw = await fetchRaw(fetchImpl);

  if (raw.hash === (await readExistingHash(outPath))) {
    console.log(`${id}: kaynak degismedi, cikiliyor.`);
    return { changed: false };
  }

  const entities = buildEntities(raw);

  const meta = { game: id, gameName, scoreNote, sourceHash: raw.hash, generatedAt: now(), entities };
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(meta, null, 2), 'utf8');
  console.log(`${outPath} yazildi: ${entities.length} varlik`);
  return { changed: true, count: entities.length };
}

// Geriye uyumluluk icin korunan isim/imza: mevcut testler bunu dogrudan
// cagiriyor. BF6 hattini calistirir.
export async function buildMeta({ now = () => new Date().toISOString(), fetch: fetchImpl = fetch, outPath = join(DATA_DIR, 'bf6.json') } = {}) {
  const bf6 = GAMES[0];
  return runGameBuild({ id: bf6.id, gameName: bf6.gameName, scoreNote: bf6.scoreNote, fetchRaw: bf6.fetchRaw, buildEntities: bf6.buildEntities, now, fetch: fetchImpl, outPath });
}

export async function buildDota2Meta({ now = () => new Date().toISOString(), fetch: fetchImpl = fetch, outPath = join(DATA_DIR, 'dt2.json') } = {}) {
  const dt2 = GAMES[1];
  return runGameBuild({ id: dt2.id, gameName: dt2.gameName, scoreNote: dt2.scoreNote, fetchRaw: dt2.fetchRaw, buildEntities: dt2.buildEntities, now, fetch: fetchImpl, outPath });
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
