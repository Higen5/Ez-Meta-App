import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapAttribute,
  heroWinRate,
  bracketRows,
  validateDota2Source,
  buildDota2Entities,
} from '../src/games/dota2.js';

// Kucuk sahte kova seti: b=1..7 dolu, b=8 (Immortal) hep 0 -- gercek kaynaktaki
// mevcut durumla ayni (bkz. SPEC).
function fakeHero(overrides = {}) {
  return {
    id: 1,
    name: 'npc_dota_hero_wraith_king',
    localized_name: 'Wraith King',
    primary_attr: 'str',
    attack_type: 'Melee',
    roles: ['Carry', 'Durable'],
    pub_pick: 500000,
    pub_win: 260000,
    '1_pick': 1000, '1_win': 550,
    '2_pick': 2000, '2_win': 1100,
    '3_pick': 3000, '3_win': 1600,
    '4_pick': 2000, '4_win': 1100,
    '5_pick': 1000, '5_win': 550,
    '6_pick': 500, '6_win': 280,
    '7_pick': 500, '7_win': 270,
    '8_pick': 0, '8_win': 0,
    ...overrides,
  };
}

test('mapAttribute dort degeri de dogru cevirir', () => {
  assert.equal(mapAttribute('str'), 'Strength');
  assert.equal(mapAttribute('agi'), 'Agility');
  assert.equal(mapAttribute('int'), 'Intelligence');
  assert.equal(mapAttribute('all'), 'Universal');
  assert.equal(mapAttribute('bilinmeyen'), null);
});

test('heroWinRate kova toplamini kullanir, pub_pick/pub_win DEGIL', () => {
  const hero = fakeHero({ pub_pick: 999999999, pub_win: 1 }); // pub alanlari cop olsa da fark etmemeli
  const totalPick = 1000 + 2000 + 3000 + 2000 + 1000 + 500 + 500 + 0;
  const totalWin = 550 + 1100 + 1600 + 1100 + 550 + 280 + 270 + 0;
  assert.equal(heroWinRate(hero), totalWin / totalPick);
});

test('bracketRows bos kovayi (8_pick=0) listeye almaz', () => {
  const rows = bracketRows(fakeHero());
  assert.equal(rows.length, 7);
  assert.ok(!rows.some((r) => r.bracket === 'Immortal'));
  assert.equal(rows[0].bracket, 'Herald');
  assert.equal(rows[0].matches, 1000);
  assert.equal(rows[0].winRate, Number(((550 / 1000) * 100).toFixed(2)));
});

test('ayni kazanma oranina sahip iki kahraman ayni skoru alir, yapay ayristirma yok', () => {
  const a = fakeHero({ id: 1, localized_name: 'Wraith King' });
  const b = fakeHero({ id: 2, localized_name: 'Zeta Farkli Isim', primary_attr: 'int' });
  const entities = buildDota2Entities({ heroes: makeSourceArray(a, b) });
  const ea = entities.find((e) => e.name === 'Wraith King');
  const eb = entities.find((e) => e.name === 'Zeta Farkli Isim');
  assert.equal(ea.score, eb.score);
});

test('validateDota2Source bozuk govdede firlatir', () => {
  assert.throws(() => validateDota2Source(null));
  assert.throws(() => validateDota2Source([fakeHero()])); // 100'den az kahraman
  const missingField = Array.from({ length: 130 }, (_, i) => fakeHero({ id: i, localized_name: undefined }));
  assert.throws(() => validateDota2Source(missingField));
  const lowPicks = Array.from({ length: 130 }, (_, i) =>
    fakeHero({
      id: i,
      '1_pick': 1, '1_win': 0, '2_pick': 0, '3_pick': 0,
      '4_pick': 0, '5_pick': 0, '6_pick': 0, '7_pick': 0, '8_pick': 0,
    })
  );
  assert.throws(() => validateDota2Source(lowPicks));
});

test('buildDota2Entities kucuk sahte govdeyle uctan uca calisir', () => {
  const heroes = makeSourceArray(
    fakeHero({ id: 1, localized_name: 'Wraith King', primary_attr: 'str' }),
    fakeHero({ id: 2, localized_name: "Nature's Prophet", primary_attr: 'int', '1_win': 100 })
  );
  const entities = buildDota2Entities({ heroes });
  assert.equal(entities.length, heroes.length);

  const wk = entities.find((e) => e.id === 'wraith-king');
  assert.ok(wk);
  assert.equal(wk.category, 'Strength');
  assert.equal(wk.rationale.bracketBreakdown.length, 7);
  assert.ok(!wk.rationale.bracketBreakdown.some((r) => r.bracket === 'Immortal'));
  assert.equal(wk.statLines[0].label, 'WIN RATE');
  assert.ok(wk.tier);
});

// validateDota2Source >=100 kahraman istiyor; testler kucuk fixture'i asagidaki
// yardimciyla 100+'e tamamlayip dolduruyor (skor/oran hesaplarini etkilemeden).
function makeSourceArray(...focusHeroes) {
  const filler = Array.from({ length: 130 - focusHeroes.length }, (_, i) =>
    fakeHero({ id: 1000 + i, localized_name: `Filler ${i}`, primary_attr: 'agi' })
  );
  return [...focusHeroes, ...filler];
}
