import { diffScores } from '../app/patch';
import type { Entity } from '../data/meta';

function makeEntity(overrides: Partial<Entity> & { id: string; name: string; category: string; score: number }): Entity {
  return {
    tier: 'B',
    stats: { rpm: 700, mag: 30, bulletVel: 600, adsTime: 200, recoilV: 0.5, fireMode: 'auto', damageCurve: [[0, 25]] },
    build: [],
    slots: [],
    rationale: { ttkByRange: [[10, 0.3]], recoilPenalty: 0.1 },
    ...overrides,
  };
}

const entities: Entity[] = [
  makeEntity({ id: 'm4', name: 'M4A1', category: 'Assault Rifle', score: 300 }),
  makeEntity({ id: 'ak', name: 'AK-47', category: 'Assault Rifle', score: 500 }),
  makeEntity({ id: 'mp5', name: 'MP5', category: 'SMG', score: 400 }),
];

test('first launch (no stored snapshot) yields no changes, not fabricated zero deltas', () => {
  expect(diffScores(entities, null)).toEqual([]);
});

test('unchanged scores are filtered out', () => {
  const prev = { m4: 300, ak: 500, mp5: 400 };
  expect(diffScores(entities, prev)).toEqual([]);
});

test('changed scores produce deltas sorted biggest riser first', () => {
  const prev = { m4: 280, ak: 520, mp5: 400 };
  const result = diffScores(entities, prev);
  expect(result.map((c) => [c.e.id, c.delta])).toEqual([
    ['m4', 20],
    ['ak', -20],
  ]);
});

test('a weapon missing from the previous snapshot is treated as unchanged, not a fabricated delta', () => {
  const prev = { m4: 300 };
  expect(diffScores(entities, prev)).toEqual([]);
});
