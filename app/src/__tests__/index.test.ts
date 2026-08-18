import { selectFeedItems } from '../app/(drawer)/index';
import type { Entity } from '../data/meta';

function makeEntity(overrides: Partial<Entity> & { id: string; name: string; category: string; score: number }): Entity {
  return {
    tier: 'B',
    stats: {},
    rationale: {},
    ...overrides,
  };
}

test('feedMode yok -> skora gore ilk 5', () => {
  const entities: Entity[] = [
    makeEntity({ id: 'a', name: 'A', category: 'Assault Rifle', score: 100 }),
    makeEntity({ id: 'b', name: 'B', category: 'SMG', score: 500 }),
    makeEntity({ id: 'c', name: 'C', category: 'SMG', score: 300 }),
    makeEntity({ id: 'd', name: 'D', category: 'Sniper', score: 200 }),
    makeEntity({ id: 'e', name: 'E', category: 'Sniper', score: 400 }),
    makeEntity({ id: 'f', name: 'F', category: 'Shotgun', score: 50 }),
  ];
  expect(selectFeedItems(entities, undefined, null).map((e) => e.id)).toEqual(['b', 'e', 'c', 'd', 'a']);
});

test('feedMode topPerCategory -> her kategoriden en yuksek skorlu tek oge, skora gore sirali', () => {
  const entities: Entity[] = [
    makeEntity({ id: 'a1', name: 'A1', category: 'Assault Rifle', score: 400 }),
    makeEntity({ id: 'a2', name: 'A2', category: 'Assault Rifle', score: 900 }),
    makeEntity({ id: 's1', name: 'S1', category: 'SMG', score: 700 }),
    makeEntity({ id: 'sn1', name: 'SN1', category: 'Sniper', score: 800 }),
  ];
  const result = selectFeedItems(entities, 'topPerCategory', null);
  expect(result.map((e) => e.id)).toEqual(['a2', 'sn1', 's1']);
});

test('feedMode topPerCategory -> beraberlikte dizideki ilk oge kazanir', () => {
  const entities: Entity[] = [
    makeEntity({ id: 'first', name: 'First', category: 'Assault Rifle', score: 900 }),
    makeEntity({ id: 'second', name: 'Second', category: 'Assault Rifle', score: 900 }),
  ];
  expect(selectFeedItems(entities, 'topPerCategory', null).map((e) => e.id)).toEqual(['first']);
});

test('feedMode topPerCategory -> secili faction skoruna gore hesaplar', () => {
  const entities: Entity[] = [
    makeEntity({
      id: 'a1', name: 'A1', category: 'Assault Rifle', score: 100,
      factions: { automaton: { tier: 'S', score: 900 } },
    }),
    makeEntity({
      id: 'a2', name: 'A2', category: 'Assault Rifle', score: 800,
      factions: { automaton: { tier: 'A', score: 200 } },
    }),
  ];
  expect(selectFeedItems(entities, 'topPerCategory', null).map((e) => e.id)).toEqual(['a2']);
  expect(selectFeedItems(entities, 'topPerCategory', 'automaton').map((e) => e.id)).toEqual(['a1']);
});
