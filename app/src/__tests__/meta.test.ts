import { parseMeta, loadMeta, cacheKeyForGame } from '../data/meta';

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
