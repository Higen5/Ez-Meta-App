import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildMeta, buildHd2Meta } from '../src/build-meta.js';
import { fetchBf6TierlistSource } from '../src/games/bf6-tierlist.js';

// buildMeta artik agdan degil, yerel pipeline/data/bf6-tierlist.json
// dosyasindan okuyor (bkz. SPEC). fetch mocklanamaz, dolayisiyla buradaki
// testler gercek kaynak dosyaya karsi calisir. Bozuk-veri/dogrulama testi
// artik bf6-tierlist.test.js'te (validateBf6Tierlist).

test('kaynak hash degismediyse yazmaz', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'meta-'));
  const outPath = join(dir, 'meta.json');
  try {
    const { hash } = await fetchBf6TierlistSource();
    const before = JSON.stringify({ sourceHash: hash, entities: [] });
    await writeFile(outPath, before, 'utf8');

    const result = await buildMeta({ outPath });

    assert.deepEqual(result, { changed: false });
    assert.equal(await readFile(outPath, 'utf8'), before);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('kaynak hash farkliysa dosyayi yazar', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'meta-'));
  const outPath = join(dir, 'meta.json');
  try {
    const before = JSON.stringify({ sourceHash: 'eski-hash', entities: [{ id: 'eski' }] });
    await writeFile(outPath, before, 'utf8');

    const result = await buildMeta({ outPath });

    assert.equal(result.changed, true);
    assert.ok(result.count > 0);
    const written = JSON.parse(await readFile(outPath, 'utf8'));
    assert.equal(written.game, 'bf6');
    assert.ok(written.entities.length > 0);
    assert.equal('factions' in written, false); // bf6'nin GAMES kaydinda factions yok, ciktida da olmamali
    assert.equal('feedMode' in written, false); // ayni sekilde feedMode de yok
    assert.equal('listValue' in written, false); // ayni sekilde listValue de yok
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// hd2 cikisinda meta seviyesinde `factions` listesi olmali (uygulama faction
// cubugunu bunun VARLIGINA gore gosterir), id'ler entity.factions
// anahtarlariyla (automaton/terminid/illuminate) birebir eslesmeli.
test('hd2 ciktisinda meta.factions, feedMode ve listValue var, id degerleri entity.factions ile eslesir', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'meta-'));
  const outPath = join(dir, 'hd2.json');
  try {
    const before = JSON.stringify({ sourceHash: 'eski-hash', entities: [{ id: 'eski' }] });
    await writeFile(outPath, before, 'utf8');

    const result = await buildHd2Meta({ outPath });

    assert.equal(result.changed, true);
    const written = JSON.parse(await readFile(outPath, 'utf8'));
    assert.deepEqual(written.factions, [
      { id: 'automaton', name: 'Automaton' },
      { id: 'terminid', name: 'Terminid' },
      { id: 'illuminate', name: 'Illuminate' },
    ]);
    const factionIds = written.factions.map((f) => f.id);
    assert.deepEqual(Object.keys(written.entities[0].factions).sort(), [...factionIds].sort());
    assert.equal(written.feedMode, 'topPerCategory');
    assert.equal(written.listValue, 'stat');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

