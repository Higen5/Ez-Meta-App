import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildMeta } from '../src/build-meta.js';
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
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

