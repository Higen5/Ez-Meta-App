import { filterAndSort } from '../app/(drawer)/browse';
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

test('composes category filter and search query — both must match', () => {
  const result = filterAndSort(entities, 'm', 'Assault Rifle');
  expect(result.map((e) => e.id)).toEqual(['m4']);
});

test('search is case-insensitive', () => {
  const result = filterAndSort(entities, 'ak-47', null);
  expect(result.map((e) => e.id)).toEqual(['ak']);
});

test('search trims leading/trailing whitespace', () => {
  const result = filterAndSort(entities, '  mp5  ', null);
  expect(result.map((e) => e.id)).toEqual(['mp5']);
});

test('results are sorted by score descending', () => {
  const result = filterAndSort(entities, '', null);
  expect(result.map((e) => e.id)).toEqual(['ak', 'mp5', 'm4']);
});
