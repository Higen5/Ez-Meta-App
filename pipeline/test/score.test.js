import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignTiers } from '../src/score.js';

test('assignTiers kategori icinde siralar', () => {
  const smgs = [
    { id: 'a', cls: 'SMG', score: 100 }, { id: 'b', cls: 'SMG', score: 90 },
    { id: 'c', cls: 'SMG', score: 80 }, { id: 'd', cls: 'SMG', score: 70 },
    { id: 'e', cls: 'SMG', score: 60 }, { id: 'f', cls: 'SMG', score: 50 },
  ];
  const sniper = [{ id: 'z', cls: 'Sniper Rifle', score: 1 }];
  const out = assignTiers([...smgs, ...sniper]);
  assert.equal(out.find((w) => w.id === 'a').tier, 'S');
  assert.equal(out.find((w) => w.id === 'f').tier, 'C');
  // tek kisilik kategoride en iyi = S, dusuk skor onemli degil
  assert.equal(out.find((w) => w.id === 'z').tier, 'S');
});
