import { parseMeta, loadMeta, cacheKeyForGame, effectiveTier, effectiveScore, displayTier, type Entity } from '../data/meta';

const TEST_URL = 'https://example.test/bf6.json';

function makeRaw(sourceHash: string) {
  return JSON.stringify({
    game: 'bf6', gameName: 'Battlefield 6', scoreNote: 'test', sourceHash, generatedAt: '2026-08-15T00:00:00.000Z',
    entities: [{
      id: 'm433', name: 'M433', category: 'Assault Rifle', tier: 'S', score: 412,
      stats: { rpm: 830, mag: 31, bulletVel: 630, adsTime: 250, recoilV: 0.79, fireMode: 'auto', damageCurve: [[0, 26.05]] },
      build: [{ slot: 'muzzle', item: 'Flash Hider' }],
      slots: [{ slot: 'muzzle', recommended: 'flash_hider', options: [{ id: 'flash_hider', name: 'Flash Hider', recoilMod: 0 }] }],
      rationale: { ttkByRange: [[10, 0.2167]], recoilPenalty: 0.119 },
    }],
  });
}

const raw = makeRaw('abc');
const cachedRaw = makeRaw('cached-hash');
const freshRaw = makeRaw('fresh-hash');

test('parseMeta gecerli veriyi cozer', () => {
  const m = parseMeta(raw);
  expect(m.entities).toHaveLength(1);
  expect(m.entities[0].tier).toBe('S');
});

test('parseMeta entities yoksa firlatir', () => {
  expect(() => parseMeta('{"game":"bf6"}')).toThrow(/entities/);
});

test('parseMeta bozuk JSON icin firlatir', () => {
  expect(() => parseMeta('{{{')).toThrow();
});

describe('loadMeta', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('soguk baslangic, onbellek yok, ag hata verir -> meta null, offline true', async () => {
    const getCached = jest.fn(async () => null);
    const setCached = jest.fn(async () => {});
    const fetchImpl = jest.fn(async () => { throw new Error('network down'); }) as unknown as typeof fetch;

    const result = await loadMeta({ fetchImpl, url: TEST_URL, getCached, setCached });

    expect(result.meta).toBeNull();
    expect(result.offline).toBe(true);
    expect(setCached).not.toHaveBeenCalled();
  });

  test('soguk baslangic, onbellek yok, ag basarili -> meta cozulur, offline false, setCached cagrilir', async () => {
    const getCached = jest.fn(async () => null);
    const setCached = jest.fn(async () => {});
    const fetchImpl = jest.fn(async () => ({ ok: true, text: async () => freshRaw })) as unknown as typeof fetch;

    const result = await loadMeta({ fetchImpl, url: TEST_URL, getCached, setCached });

    expect(result.meta?.sourceHash).toBe('fresh-hash');
    expect(result.offline).toBe(false);
    expect(setCached).toHaveBeenCalledWith(freshRaw);
  });

  test('sicak baslangic, onbellek var, ag hata verir -> onbellekteki meta doner, offline true', async () => {
    const getCached = jest.fn(async () => cachedRaw);
    const setCached = jest.fn(async () => {});
    const fetchImpl = jest.fn(async () => { throw new Error('network down'); }) as unknown as typeof fetch;

    const result = await loadMeta({ fetchImpl, url: TEST_URL, getCached, setCached });

    expect(result.meta?.sourceHash).toBe('cached-hash');
    expect(result.offline).toBe(true);
    expect(setCached).not.toHaveBeenCalled();
  });

  test('sicak baslangic, onbellek var, ag 200 + bozuk JSON doner -> onbellek korunur, setCached cagrilmaz', async () => {
    const getCached = jest.fn(async () => cachedRaw);
    const setCached = jest.fn(async () => {});
    const fetchImpl = jest.fn(async () => ({ ok: true, text: async () => '{{{' })) as unknown as typeof fetch;

    const result = await loadMeta({ fetchImpl, url: TEST_URL, getCached, setCached });

    expect(result.meta?.sourceHash).toBe('cached-hash');
    expect(result.offline).toBe(true);
    expect(setCached).not.toHaveBeenCalled();
  });
});

// Cihazdaki onbellek eski semadan kalmis olabilir; parseMeta eksik alanlari
// tamamlamazsa uygulama ilk karede cokuyordu.
test('parseMeta eski semadaki (gameName olmayan) onbellegi tamamlar', () => {
  const eski = JSON.stringify({ game: 'bf6', sourceHash: 'x', generatedAt: 'y', entities: [] });
  const meta = parseMeta(eski);
  expect(meta.gameName).toBe('BF6');
  expect(typeof meta.gameName).toBe('string');
});

test('parseMeta game alani bile yoksa cokmez', () => {
  const meta = parseMeta(JSON.stringify({ entities: [] }));
  expect(meta.game).toBe('bf6');
  expect(meta.gameName).toBe('BF6');
});

// Onbellek anahtari VARSAYILAN oyuna degil, sabit 'bf6'ya bagli olmali: eskiden
// DEFAULT_GAME ile karsilastiriliyordu ve varsayilan degisince baska bir oyun
// bf6'nin eski onbellegini okuyordu.
test('cacheKeyForGame varsayilan oyun degisse de bf6 disindaki oyunu eski anahtara baglamaz', () => {
  expect(cacheKeyForGame('bf6')).toBe('meta.json');
  expect(cacheKeyForGame('hd2')).toBe('meta.json.hd2');
  expect(cacheKeyForGame('hd2')).not.toBe(cacheKeyForGame('bf6'));
});

describe('effectiveTier / effectiveScore', () => {
  const withFactions: Entity = {
    id: 'w1', name: 'Weapon', category: 'Primary', tier: 'S+', score: 6800,
    stats: {},
    rationale: {},
    factions: {
      automaton: { tier: 'A', score: 4900 },
      terminid: { tier: 'S', score: 5700 },
    },
  };
  const noFactions: Entity = {
    id: 'w2', name: 'BF6 Weapon', category: 'Assault Rifle', tier: 'A', score: 300,
    stats: {}, rationale: {},
  };

  test('faction null -> varsayilan tier/score doner', () => {
    expect(effectiveTier(withFactions, null)).toBe('S+');
    expect(effectiveScore(withFactions, null)).toBe(6800);
  });

  test('faction verisi olmayan entity (BF6/Dota) -> faction gecilse de varsayilana duser', () => {
    expect(effectiveTier(noFactions, 'automaton')).toBe('A');
    expect(effectiveScore(noFactions, 'automaton')).toBe(300);
  });

  test('faction eslesirse o faction degerini doner', () => {
    expect(effectiveTier(withFactions, 'terminid')).toBe('S');
    expect(effectiveScore(withFactions, 'terminid')).toBe(5700);
  });

  test('entity o faction icin veri tasimiyorsa varsayilana duser', () => {
    expect(effectiveTier(withFactions, 'illuminate')).toBe('S+');
    expect(effectiveScore(withFactions, 'illuminate')).toBe(6800);
  });
});

describe('displayTier', () => {
  const bf6Weapon: Entity = {
    id: 'sg553r', name: 'SG-553R', category: 'Carbine', tier: 'S', classTier: 'S',
    score: 500, stats: {}, rationale: {},
  };
  const noClassTier: Entity = {
    id: 'w3', name: 'HD2/Dota Weapon', category: 'Assault Rifle', tier: 'A',
    score: 300, stats: {}, rationale: {},
  };

  test('kategori null -> effectiveTier sonucu (genel tier)', () => {
    expect(displayTier(bf6Weapon, null, null)).toBe('S');
  });

  test('kategori dolu ama classTier yok (HD2/Dota sekli) -> effectiveTier sonucuna duser', () => {
    expect(displayTier(noClassTier, null, 'Assault Rifle')).toBe('A');
  });

  test('kategori dolu ve classTier var -> classTier doner', () => {
    const brod3: Entity = { ...bf6Weapon, id: 'brod3', name: 'BROD 3', tier: 'A', classTier: 'S' };
    expect(displayTier(brod3, null, 'Carbine')).toBe('S');
  });
});
