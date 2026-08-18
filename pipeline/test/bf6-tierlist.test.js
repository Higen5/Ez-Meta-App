import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreFromRank,
  validateBf6Tierlist,
  buildBf6TierlistEntities,
} from '../src/games/bf6-tierlist.js';

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
