import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreFromRank,
  validateBf6Tierlist,
  buildBf6TierlistEntities,
  fetchBf6TierlistSource,
} from '../src/games/bf6-tierlist.js';
import { assignTiers } from '../src/score.js';

test('scoreFromRank(1, 62) 10000 doner', () => {
  assert.equal(scoreFromRank(1, 62), 10000);
});

test('scoreFromRank sira buyudukce skor kesin azalir', () => {
  const scores = Array.from({ length: 10 }, (_, i) => scoreFromRank(i + 1, 10));
  for (let i = 1; i < scores.length; i++) assert.ok(scores[i] < scores[i - 1]);
});

test('validateBf6Tierlist rank bosluguyla firlar', () => {
  assert.throws(() => validateBf6Tierlist({
    siralama: [
      { rank: 1, ad: 'A', sinif: 'SMG' },
      { rank: 3, ad: 'B', sinif: 'SMG' },
    ],
  }));
});

test('validateBf6Tierlist tekrarlanan rank\'te firlar', () => {
  assert.throws(() => validateBf6Tierlist({
    siralama: [
      { rank: 1, ad: 'A', sinif: 'SMG' },
      { rank: 1, ad: 'B', sinif: 'SMG' },
    ],
  }));
});

test('validateBf6Tierlist bilinmeyen sinifta firlar', () => {
  assert.throws(() => validateBf6Tierlist({
    siralama: [{ rank: 1, ad: 'A', sinif: 'MELEE' }],
  }));
});

test('buildBf6TierlistEntities kucuk sahte bir siralamayla uctan uca calisir', () => {
  const tierlist = {
    siralama: [
      { rank: 1, ad: 'SGX', sinif: 'SMG' },
      { rank: 2, ad: 'QBZ-192', sinif: 'CARBINE' },
      { rank: 3, ad: 'PP-19', sinif: 'SMG' },
      { rank: 4, ad: 'M87A1', sinif: 'SHOTGUN' },
    ],
  };
  const entities = buildBf6TierlistEntities({ tierlist });
  assert.equal(entities.length, 4);

  const sgx = entities.find((e) => e.id === 'sgx');
  assert.equal(sgx.category, 'SMG');
  assert.equal(sgx.score, 10000);
  assert.equal(sgx.statLines[0].value, '1 / 4');
  assert.ok(sgx.tier);

  const qbz = entities.find((e) => e.id === 'qbz-192');
  assert.equal(qbz.category, 'Carbine');
  assert.equal(qbz.score, scoreFromRank(2, 4));
});

const TIERLIST = {
  siralama: [
    { rank: 1, ad: 'SGX', sinif: 'SMG' },
    { rank: 2, ad: 'QBZ-192', sinif: 'CARBINE' },
  ],
};

test('build alani olan silaha ekleniyor, sirasi korunuyor', () => {
  const builds = { SGX: [{ slot: 'BARREL', item: 'X' }, { slot: 'MUZZLE', item: 'Y' }] };
  const entities = buildBf6TierlistEntities({ tierlist: TIERLIST, builds });
  const sgx = entities.find((e) => e.id === 'sgx');
  assert.deepEqual(sgx.build, builds.SGX);
});

test('build alani olmayan silahta undefined kalir', () => {
  const builds = { SGX: [{ slot: 'BARREL', item: 'X' }] };
  const entities = buildBf6TierlistEntities({ tierlist: TIERLIST, builds });
  const qbz = entities.find((e) => e.id === 'qbz-192');
  assert.equal(qbz.build, undefined);
});

test('builds icinde siralamada olmayan silah adi varsa firlar', () => {
  const builds = { 'BILINMEYEN SILAH': [{ slot: 'BARREL', item: 'X' }] };
  assert.throws(() => buildBf6TierlistEntities({ tierlist: TIERLIST, builds }));
});

test('her varlikta hem tier hem classTier var', () => {
  const entities = buildBf6TierlistEntities({ tierlist: TIERLIST });
  for (const e of entities) {
    assert.ok(e.tier, `${e.name}: tier eksik`);
    assert.ok(e.classTier, `${e.name}: classTier eksik`);
  }
});

// Gercek 62 silahlik veriyle: genel tier TUM liste uzerinden, classTier
// SADECE kendi sinifi icinden hesaplanmali -- ayni silah iki farkli tier
// tasiyabilir (bkz. SPEC: "carbine'ler arasinda S ama genelde A").
test('genel tier tum liste uzerinden, classTier kategori icinden hesaplanir', async () => {
  const { tierlist } = await fetchBf6TierlistSource();
  const entities = buildBf6TierlistEntities({ tierlist });

  const generalS = entities.filter((e) => e.tier === 'S');
  assert.equal(generalS.length, 12);
  assert.ok(generalS.some((e) => e.name === 'SG-553R'));
  assert.ok(!generalS.some((e) => e.name === 'BROD 3'));

  const carbineS = entities
    .filter((e) => e.category === 'Carbine' && e.classTier === 'S')
    .map((e) => e.name)
    .sort();
  assert.deepEqual(carbineS, ['BROD 3', 'QBZ-192', 'SG-553R'].sort());

  // Her sinifta 2-3 tane classTier S bekleniyor -- entities'ten gorulen tum
  // kategoriler uzerinden dogrulanir (bos donen bir kategori de yakalanmis olur).
  const categories = new Set(entities.map((e) => e.category));
  for (const cat of categories) {
    const count = entities.filter((e) => e.category === cat && e.classTier === 'S').length;
    assert.ok(count >= 2 && count <= 3, `${cat}: classTier S sayisi ${count}`);
  }
});

// score.js'teki assignTiers artik opsiyonel bir cuts parametresi aliyor;
// parametresiz cagiri (Dota 2'nin kullandigi yol) eski TIER_CUTS davranisini
// aynen korumali.
test('assignTiers varsayilan cuts ile cagrildiginda eski davranisi korur (Dota 2 regresyon korumasi)', () => {
  const items = Array.from({ length: 20 }, (_, i) => ({ id: `w${i}`, cls: 'X', score: 20 - i }));
  const out = assignTiers(items);
  // TIER_CUTS: S maxPercentile 0.15 -> 20 ogede i/20 <= 0.15 olan indeksler 0..3 (4 oge).
  const sIds = out.filter((w) => w.tier === 'S').map((w) => w.id).sort();
  assert.deepEqual(sIds, ['w0', 'w1', 'w2', 'w3']);
});
