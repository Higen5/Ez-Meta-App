import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreForTier,
  validateArcTierlist,
  buildArcTierlistEntities,
  fetchArcTierlistSource,
  catalogBaseUrl,
} from '../src/games/arc-tierlist.js';

function fixtureTierlist() {
  return {
    tierOlcegi: ['S', 'A', 'B', 'C', 'D'],
    modlar: {
      pve: {
        ad: 'PvE',
        aciklama: 'ARC robotlarina karsi',
        S: ['Hullcracker', 'Equalizer'],
        A: ['Bettina'],
        D: ['Canto'],
      },
      pvp: {
        ad: 'PvP',
        aciklama: 'Oyunculara karsi',
        S: ['Canto'],
        A: ['Equalizer'],
        D: ['Hullcracker', 'Bettina'],
      },
    },
  };
}

function fixtureKatalog() {
  return {
    Hullcracker: { category: 'Special', ap: 'Very Strong', ammoType: 'Launcher Ammo', firingMode: 'Pump-Action', magazineSize: 5 },
    Equalizer: { category: 'LMG', ap: 'Very Strong', ammoType: 'Energy Clip', firingMode: 'Fully-Automatic', magazineSize: 50 },
    Bettina: { category: 'Assault Rifle', ap: 'Strong', ammoType: 'Heavy Ammo', firingMode: 'Fully-Automatic', magazineSize: 20 },
    // Canto: gercek katalogda effects tum varyantlarda BOS gelir -- AP/AMMO/
    // FIRING MODE/MAGAZINE hicbiri bulunamaz (bkz. arc-tierlist.js).
    Canto: { category: 'SMG', ap: null, ammoType: null, firingMode: null, magazineSize: null },
  };
}

// fetchArcTierlistSource GERCEK yerel dosyayi (pipeline/data/arc-tierlist.json)
// okur, bu yuzden sahte fetchImpl'in oradaki 23 silahin TUMUNU karsilamasi
// gerekir. Degerler gercek RaidTheory/arcraiders-data yanitlarindan alindi.
const REAL_CATALOG_ENTRIES = {
  hullcracker_iv: { type: 'Special', effects: { 'Ammo Type': { value: 'Launcher Ammo' }, 'ARC Armor Penetration': { value: 'Very Strong' }, 'Firing Mode': { value: 'Pump-Action' }, 'Magazine Size': { value: 5 } } },
  equalizer: { type: 'LMG', effects: { 'Ammo Type': { value: 'Energy Clip' }, 'ARC Armor Penetration': { value: 'Very Strong' }, 'Firing Mode': { value: 'Fully-Automatic' }, 'Magazine Size': { value: 50 } } },
  jupiter: { type: 'Sniper Rifle', effects: { 'Ammo Type': { value: 'Energy Clip' }, 'ARC Armor Penetration': { value: 'Very Strong' }, 'Firing Mode': { value: 'Bolt-Action' }, 'Magazine Size': { value: 5 } } },
  dolabra: { type: 'Shotgun', effects: {} }, // legendary, effects bos, numarali varyant yok
  bettina_iv: { type: 'Assault Rifle', effects: { 'Ammo Type': { value: 'Heavy Ammo' }, 'ARC Armor Penetration': { value: 'Strong' }, 'Firing Mode': { value: 'Fully-Automatic' }, 'Magazine Size': { value: 20 } } },
  anvil_iv: { type: 'Hand Cannon', effects: { 'Ammo Type': { value: 'Heavy Ammo' }, 'ARC Armor Penetration': { value: 'Strong' }, 'Firing Mode': { value: 'Single-Action' }, 'Magazine Size': { value: 6 } } },
  renegade_iv: { type: 'Battle Rifle', effects: { 'Ammo Type': { value: 'Medium Ammo' }, 'ARC Armor Penetration': { value: 'Moderate' }, 'Firing Mode': { value: 'Lever-Action' }, 'Magazine Size': { value: 8 } } },
  aphelion: { type: 'Special', effects: { 'Ammo Type': { value: 'Energy Clip' }, 'ARC Armor Penetration': { value: 'Very Strong' }, 'Firing Mode': { value: 'Fully-Automatic' } } },
  osprey_iv: { type: 'Sniper Rifle', effects: { 'Ammo Type': { value: 'Medium Ammo' }, 'ARC Armor Penetration': { value: 'Moderate' }, 'Firing Mode': { value: 'Bolt-Action' }, 'Magazine Size': { value: 8 } } },
  ferro_iv: { type: 'Battle Rifle', effects: { 'Ammo Type': { value: 'Heavy Ammo' }, 'ARC Armor Penetration': { value: 'Strong' }, 'Firing Mode': { value: 'Break-Action' }, 'Magazine Size': { value: 1 } } },
  il_toro_iv: { type: 'Shotgun', effects: { 'Ammo Type': { value: 'Shotgun Ammo' }, 'ARC Armor Penetration': { value: 'Weak' }, 'Firing Mode': { value: 'Pump-Action' }, 'Magazine Size': { value: 8 } } },
  vulcano_iv: { type: 'Shotgun', effects: { 'Ammo Type': { value: 'Shotgun Ammo' }, 'ARC Armor Penetration': { value: 'Weak' }, 'Firing Mode': { value: 'Semi-Automatic' }, 'Magazine Size': { value: 6 } } },
  venator_iv: { type: 'Pistol', effects: { 'Ammo Type': { value: 'Medium Ammo' }, 'ARC Armor Penetration': { value: 'Moderate' }, 'Firing Mode': { value: 'Semi-Automatic' }, 'Magazine Size': { value: 10 } } },
  tempest_iv: { type: 'Assault Rifle', effects: { 'Ammo Type': { value: 'Medium Ammo' }, 'ARC Armor Penetration': { value: 'Moderate' }, 'Firing Mode': { value: 'Fully-Automatic' }, 'Magazine Size': { value: 25 } } },
  torrente_iv: { type: 'LMG', effects: { 'Ammo Type': { value: 'Medium Ammo' }, 'ARC Armor Penetration': { value: 'Moderate' }, 'Firing Mode': { value: 'Fully-Automatic' }, 'Magazine Size': { value: 90 } } },
  rattler_iv: { type: 'Assault Rifle', effects: { 'Ammo Type': { value: 'Medium Ammo' }, 'ARC Armor Penetration': { value: 'Moderate' }, 'Firing Mode': { value: 'Fully-Automatic' }, 'Magazine Size': { value: 24 } } },
  arpeggio_iv: { type: 'Assault Rifle', effects: { 'Ammo Type': { value: 'Medium Ammo' }, 'ARC Armor Penetration': { value: 'Moderate' }, 'Firing Mode': { value: '3-Round Burst' }, 'Magazine Size': { value: 24 } } },
  kettle_iv: { type: 'Assault Rifle', effects: { 'Ammo Type': { value: 'Light Ammo' }, 'ARC Armor Penetration': { value: 'Very Weak' }, 'Firing Mode': { value: 'Semi-Automatic' }, 'Magazine Size': { value: 20 } } },
  // Canto: TUM varyantlarda (iv, iii, ii, i) effects bos -- AP hicbir yerde bulunamaz.
  canto_iv: { type: 'SMG', effects: {} },
  canto_iii: { type: 'SMG', effects: {} },
  canto_ii: { type: 'SMG', effects: {} },
  canto_i: { type: 'SMG', effects: {} },
  bobcat_iv: { type: 'SMG', effects: { 'Ammo Type': { value: 'Light Ammo' }, 'ARC Armor Penetration': { value: 'Very Weak' }, 'Firing Mode': { value: 'Fully-Automatic' }, 'Magazine Size': { value: 20 } } },
  stitcher_iv: { type: 'SMG', effects: { 'Ammo Type': { value: 'Light Ammo' }, 'ARC Armor Penetration': { value: 'Very Weak' }, 'Firing Mode': { value: 'Fully-Automatic' }, 'Magazine Size': { value: 20 } } },
  // Burletta: iv/iii/ii bos, ilk AP i'de bulunur -- geriye dogru yuruyusu test eder.
  burletta_iv: { type: 'Pistol', effects: {} },
  burletta_iii: { type: 'Pistol', effects: {} },
  burletta_ii: { type: 'Pistol', effects: {} },
  burletta_i: { type: 'Pistol', effects: { 'Ammo Type': { value: 'Light Ammo' }, 'ARC Armor Penetration': { value: 'Very Weak' }, 'Firing Mode': { value: 'Single-Action' }, 'Magazine Size': { value: 6 } } },
  hairpin_iv: { type: 'Pistol', effects: { 'Ammo Type': { value: 'Light Ammo' }, 'ARC Armor Penetration': { value: 'Very Weak' }, 'Firing Mode': { value: 'Slide-Action' }, 'Magazine Size': { value: 8 } } },
};

// arc-tierlist.js'nin denedigi tum URL'leri karsilar; listede olmayanlar 404
// doner (gercek GitHub raw davranisi).
function fakeFetch() {
  return async (url) => {
    const key = url.slice(url.lastIndexOf('/') + 1).replace(/\.json$/, '');
    const body = REAL_CATALOG_ENTRIES[key];
    if (!body) return { ok: false, status: 404, json: async () => { throw new Error('404'); } };
    return { ok: true, status: 200, json: async () => body };
  };
}

// Sabitlemenin sessizce kaybolmasi tam olarak onlemek istedigimiz hata: URL
// 'main'e duserse katalog altimizda degisir ve biz farkina varmayiz.
test('catalogBaseUrl gecerli SHA icin sabitlenmis URL uretir', () => {
  const sha = '2a4abebb2486a633070f4e260058bcd5ad4511d6';
  assert.equal(
    catalogBaseUrl(sha),
    `https://raw.githubusercontent.com/RaidTheory/arcraiders-data/${sha}/items/`,
  );
});

test('catalogBaseUrl "main" verilirse firlar', () => {
  assert.throws(() => catalogBaseUrl('main'), /40 haneli/);
});

test('catalogBaseUrl eksik ya da bozuk SHA icin firlar', () => {
  for (const kotu of [undefined, null, '', 'abc123', 'ZZZZbebb2486a633070f4e260058bcd5ad4511d6']) {
    assert.throws(() => catalogBaseUrl(kotu), /40 haneli/);
  }
});

test('gercek veri dosyasi gecerli bir _katalogCommit tasir', async () => {
  const { tierlist } = await fetchArcTierlistSource(fakeFetch());
  assert.match(tierlist._katalogCommit, /^[0-9a-f]{40}$/);
});

test('validateArcTierlist pve ve pvp farkli silah kumesinde firlar', () => {
  const bad = fixtureTierlist();
  bad.modlar.pvp.D = ['Hullcracker']; // Bettina pvp'den dustu
  assert.throws(() => validateArcTierlist(bad));
});

test('validateArcTierlist gecersiz tier anahtarinda firlar', () => {
  const bad = fixtureTierlist();
  bad.modlar.pve.Z = ['Bilinmeyen Silah'];
  assert.throws(() => validateArcTierlist(bad));
});

test('validateArcTierlist bir modda tekrarlanan adda firlar', () => {
  const bad = fixtureTierlist();
  bad.modlar.pve.A.push('Hullcracker'); // zaten S'te var
  assert.throws(() => validateArcTierlist(bad));
});

test('scoreForTier skor bandi komsu banda tasmaz', () => {
  const bands = { S: [5000, 5999], A: [4000, 4999], B: [3000, 3999], C: [2000, 2999], D: [1000, 1999] };
  for (const [tier, [lo, hi]] of Object.entries(bands)) {
    for (let pos = 0; pos < 6; pos++) {
      const score = scoreForTier(tier, pos, 6);
      assert.ok(score >= lo && score <= hi, `${tier} pos ${pos}: ${score}`);
    }
  }
});

test('scoreForTier bilinmeyen tier icin firlar', () => {
  assert.throws(() => scoreForTier('X', 0, 1));
});

test('buildArcTierlistEntities ayni silah PvE ve PvP arasinda farkli tier/skor tasir', () => {
  const entities = buildArcTierlistEntities({ tierlist: fixtureTierlist(), katalog: fixtureKatalog() });
  const hc = entities.find((e) => e.name === 'Hullcracker');
  assert.equal(hc.factions.pve.tier, 'S');
  assert.equal(hc.factions.pvp.tier, 'D');
  assert.notEqual(hc.factions.pve.score, hc.factions.pvp.score);
  // varsayilan mod PvE
  assert.equal(hc.tier, 'S');
  assert.equal(hc.score, hc.factions.pve.score);
});

test('buildArcTierlistEntities statLines[0] AP\'si olan silahlarda AP olur', () => {
  const entities = buildArcTierlistEntities({ tierlist: fixtureTierlist(), katalog: fixtureKatalog() });
  const eq = entities.find((e) => e.name === 'Equalizer');
  assert.equal(eq.statLines[0].label, 'AP');
  assert.equal(eq.statLines[0].value, 'Very Strong');
  assert.deepEqual(eq.statLines.map((s) => s.label), ['AP', 'AMMO', 'FIRING MODE', 'MAGAZINE']);
});

// AP bulunamasa bile satir eklenir, degeri "—" olur. Uygulama listValue='stat'
// modunda statLines[0]'i gosterdigi icin satiri hic koymamak Dolabra ve
// Canto'nun yaninda bosluk birakiyordu; "—" veri yok demek, uydurulmus deger
// degil.
test('buildArcTierlistEntities AP bulunamayan silahta AP satiri bos deger ile durur', () => {
  const entities = buildArcTierlistEntities({ tierlist: fixtureTierlist(), katalog: fixtureKatalog() });
  const canto = entities.find((e) => e.name === 'Canto');
  assert.deepEqual(canto.statLines, [{ label: 'AP', value: '—' }]);
});

test('buildArcTierlistEntities katalogda bulunamayan silah sessizce dusmez, firlatir', () => {
  const tierlist = fixtureTierlist();
  const katalog = fixtureKatalog();
  delete katalog.Canto;
  assert.throws(() => buildArcTierlistEntities({ tierlist, katalog }));
});

test('fetchArcTierlistSource gercek yerel dosyayi okur, 23 silah icin katalog uretir', async () => {
  const { tierlist, katalog, hash } = await fetchArcTierlistSource(fakeFetch());
  assert.equal(tierlist.tierOlcegi.length, 5);
  assert.equal(Object.keys(katalog).length, 23);
  assert.equal(typeof hash, 'string');
  assert.ok(hash.length > 0);
});

test('fetchArcTierlistSource Burletta icin AP\'yi geriye dogru varyant yuruyusuyle bulur', async () => {
  const { katalog } = await fetchArcTierlistSource(fakeFetch());
  assert.equal(katalog.Burletta.ap, 'Very Weak');
});

test('fetchArcTierlistSource Canto icin (tum varyantlar bos) AP bulamaz', async () => {
  const { katalog } = await fetchArcTierlistSource(fakeFetch());
  assert.equal(katalog.Canto.ap, null);
});

test('fetchArcTierlistSource Dolabra icin (legendary, numarali varyant yok) AP bulamaz', async () => {
  const { katalog } = await fetchArcTierlistSource(fakeFetch());
  assert.equal(katalog.Dolabra.ap, null);
  assert.equal(katalog.Dolabra.category, 'Shotgun');
});

test('fetchArcTierlistSource katalogda hic olmayan silah icin firlar', async () => {
  const missing = fakeFetch();
  const fetchImpl = async (url) => {
    if (url.includes('hullcracker')) return { ok: false, status: 404, json: async () => { throw new Error('404'); } };
    return missing(url);
  };
  await assert.rejects(() => fetchArcTierlistSource(fetchImpl));
});

test('buildArcTierlistEntities uretilen varlik sayisi tierlist ile eslesir', () => {
  const entities = buildArcTierlistEntities({ tierlist: fixtureTierlist(), katalog: fixtureKatalog() });
  assert.equal(entities.length, 4); // Hullcracker, Equalizer, Bettina, Canto
});
