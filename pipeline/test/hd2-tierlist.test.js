import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreForTier,
  sortCategory,
  validateHd2Tierlist,
  buildHd2TierlistEntities,
  apLabel,
} from '../src/games/hd2-tierlist.js';

function fixture() {
  return {
    tierOlcegi: ['S+', 'S', 'A', 'B', 'C', 'D'],
    kategoriler: {
      Primary: {
        tieBreak: 'dps',
        items: [
          { ad: 'Weapon A', auto: 'S+', term: 'S+', illum: 'S+', dps: 500, ap: 3 },
          { ad: 'Weapon B', auto: 'S+', term: 'S', illum: 'S+', dps: 700, ap: 3 },
          { ad: 'Weapon C', auto: 'A', term: 'A', illum: 'S+', dps: null, ap: 2 },
          { ad: 'Weapon D', auto: 'D', term: 'D', illum: 'A', dps: 200, ap: 0 },
        ],
      },
      'Armor Passive': {
        tieBreak: 'none',
        items: [
          { ad: 'Armor A', auto: 'S+', term: 'S+', illum: 'S+', stats: ['+2 stim capacity.', '+2.0s duration.'] },
          { ad: 'Armor B', auto: 'S', term: 'S', illum: 'S', stats: ['+50% reload speed.'] },
        ],
      },
    },
  };
}

test('scoreForTier skoru tier bandinin disina tasirmaz', () => {
  for (let pos = 0; pos < 10; pos++) {
    const score = scoreForTier('S+', pos, 10);
    assert.ok(score >= 6000 && score <= 6999, `pos ${pos}: ${score}`);
  }
});

test('scoreForTier her tier bandinda dogru araliktadir', () => {
  const bands = { 'S+': [6000, 6999], S: [5000, 5999], A: [4000, 4999], B: [3000, 3999], C: [2000, 2999], D: [1000, 1999] };
  for (const [tier, [lo, hi]] of Object.entries(bands)) {
    for (let pos = 0; pos < 5; pos++) {
      const score = scoreForTier(tier, pos, 5);
      assert.ok(score >= lo && score <= hi, `${tier} pos ${pos}: ${score}`);
    }
  }
});

test('scoreForTier tek oge en yuksek eki alir', () => {
  assert.equal(scoreForTier('A', 0, 1), 4999);
});

test('scoreForTier bilinmeyen tier icin firlar', () => {
  assert.throws(() => scoreForTier('X', 0, 1));
});

test('sortCategory tier icinde tieBreak alanina gore azalan siralar', () => {
  const items = fixture().kategoriler.Primary.items;
  const sorted = sortCategory(items, 'auto', 'dps'); // auto: S+,S+,A,D -> once iki S+ (dps'e gore azalan), sonra A, sonra D
  assert.deepEqual(sorted.map((i) => i.ad), ['Weapon B', 'Weapon A', 'Weapon C', 'Weapon D']);
});

test('sortCategory null tieBreak degerini tier icinde en sona atar', () => {
  // illum: A,S+,S+,S+ -- S+ ucunun dps'i 500,700,null. null en sona gitmeli.
  const items = fixture().kategoriler.Primary.items;
  const sorted = sortCategory(items, 'illum', 'dps');
  const splusNames = sorted.filter((i) => i.illum === 'S+').map((i) => i.ad);
  assert.deepEqual(splusNames, ['Weapon B', 'Weapon A', 'Weapon C']); // Weapon C'nin dps'i null, en sonda
});

test("sortCategory tieBreak 'none' oldugunda kaynak sirasini korur", () => {
  const items = fixture().kategoriler['Armor Passive'].items;
  const sorted = sortCategory(items, 'illum', 'none');
  assert.deepEqual(sorted.map((i) => i.ad), ['Armor A', 'Armor B']);
});

test('validateHd2Tierlist gecersiz tier degerinde firlar', () => {
  const bad = fixture();
  bad.kategoriler.Primary.items[0].auto = 'Z';
  assert.throws(() => validateHd2Tierlist(bad));
});

test('validateHd2Tierlist gecersiz tieBreak degerinde firlar', () => {
  const bad = fixture();
  bad.kategoriler.Primary.tieBreak = 'bilinmeyen';
  assert.throws(() => validateHd2Tierlist(bad));
});

test('validateHd2Tierlist tekrarlanan adda firlar', () => {
  const bad = fixture();
  bad.kategoriler.Primary.items.push({ ad: 'Weapon A', auto: 'D', term: 'D', illum: 'D', dps: 1, ap: 0 });
  assert.throws(() => validateHd2Tierlist(bad));
});

test('buildHd2TierlistEntities uc faction icin uc ayri skor uretir, tier/score illuminate ile ayni', () => {
  const entities = buildHd2TierlistEntities({ tierlist: fixture() });
  const a = entities.find((e) => e.name === 'Weapon A');
  assert.equal(a.tier, a.factions.illuminate.tier);
  assert.equal(a.score, a.factions.illuminate.score);
  assert.equal(a.factions.automaton.tier, 'S+');
  assert.equal(a.factions.terminid.tier, 'S+');
  assert.equal(a.factions.illuminate.tier, 'S+');
  // Automaton'da B, A dps'e gore B > A oldugu icin farkli skor bekleniyor
  assert.notEqual(a.factions.automaton.score, entities.find((e) => e.name === 'Weapon B').factions.automaton.score);
});

test('buildHd2TierlistEntities Armor Passive stats maddelerini statLines yapar', () => {
  const entities = buildHd2TierlistEntities({ tierlist: fixture() });
  const armorA = entities.find((e) => e.name === 'Armor A');
  assert.deepEqual(armorA.statLines, [
    { label: 'EFFECT', value: '+2 stim capacity.' },
    { label: 'EFFECT', value: '+2.0s duration.' },
  ]);
});

test('buildHd2TierlistEntities ap alani null ise AP statLine olusturmaz', () => {
  const tierlist = fixture();
  tierlist.kategoriler.Primary.items[0].ap = null;
  const entities = buildHd2TierlistEntities({ tierlist });
  const a = entities.find((e) => e.name === 'Weapon A');
  assert.ok(!a.statLines.some((s) => s.label === 'AP'));
});

test('buildHd2TierlistEntities kategori sayisi ve toplam oge sayisi dogru', () => {
  const entities = buildHd2TierlistEntities({ tierlist: fixture() });
  assert.equal(entities.length, 6);
  assert.equal(new Set(entities.map((e) => e.category)).size, 2);
});

test('apLabel kaynagin kelime karsiligini doner', () => {
  assert.equal(apLabel(0), 'None');
  assert.equal(apLabel(2), 'Light');
  assert.equal(apLabel(3), 'Medium');
  assert.equal(apLabel(4), 'Heavy');
  assert.equal(apLabel(5), 'Anti-Tank');
  assert.equal(apLabel(6), 'Anti-Tank');
  assert.equal(apLabel(7), 'Anti-Tank');
  assert.equal(apLabel(9), 'Anti-Tank');
});

test('apLabel bilinmeyen degeri Anti-Tank varsaymadan sayiya cevirir', () => {
  assert.equal(apLabel(1), '1'); // veride hic gecmiyor ama uydurma yok
  assert.equal(apLabel(8), '8');
});

test("buildHd2TierlistEntities AP'si olan kategoride statLines[0] AP olur, deger kelime karsiligi", () => {
  const entities = buildHd2TierlistEntities({ tierlist: fixture() });
  const a = entities.find((e) => e.name === 'Weapon A'); // Primary, ap: 3
  assert.equal(a.statLines[0].label, 'AP');
  assert.equal(a.statLines[0].value, 'Medium');
});

test('buildHd2TierlistEntities Armor Passive gibi AP olmayan kategoride ilk satir kendi anlamli stati kalir', () => {
  const entities = buildHd2TierlistEntities({ tierlist: fixture() });
  const armorA = entities.find((e) => e.name === 'Armor A');
  assert.equal(armorA.statLines[0].label, 'EFFECT');
});

test('sortCategory AP etiketi degil sayisal ap degerine gore azalan siralar', () => {
  // Ayni tier'da ap: 9 (Anti-Tank), 3 (Medium), 2 (Light) -- alfabetik etikete
  // gore degil sayiya gore siralanmali (Anti-Tank > Medium > Light beklenir,
  // ama bu tesadufen alfabetik de dogru gorunebilir; asagidaki 0 vs 9 vakasi
  // bunu net ayirt eder: '0' < '9' string olarak da, sayi olarak da kucuk,
  // 9 = Anti-Tank en yuksek sayi -- azalanda ilk gelmeli).
  const items = [
    { ad: 'X', auto: 'S+', term: 'S+', illum: 'S+', ap: 0 },
    { ad: 'Y', auto: 'S+', term: 'S+', illum: 'S+', ap: 9 },
    { ad: 'Z', auto: 'S+', term: 'S+', illum: 'S+', ap: 3 },
  ];
  const sorted = sortCategory(items, 'illum', 'ap');
  assert.deepEqual(sorted.map((i) => i.ad), ['Y', 'Z', 'X']); // 9 > 3 > 0
});
