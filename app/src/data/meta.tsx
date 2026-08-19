import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Depo public oldugu icin uygulama oyun dosyalarini dogrudan buradan ceker;
// kimlik dogrulama gerekmez. EXPO_PUBLIC_META_URL bu taban dizin URL'sini ezer
// (derleme aninda gomulur), boylece bir dev build yerel bir sunucudan okuyabilir.
const BASE_URL =
  process.env.EXPO_PUBLIC_META_URL ??
  'https://raw.githubusercontent.com/Higen5/Ez-Meta-App/main/data';

// Oyun dosyasinin adi her zaman "<id>.json". Veri hatti ayrica data/games.json
// yaziyor ama UYGULAMA ONU OKUMAZ: oyun secim ekrani kendi statik listesini
// kullanir (bkz. app/games.tsx), cunku logo require() yollari statik olmak
// zorunda ve "yakinda" bayragi veriye degil uygulama surumune bagli.
export const gameJsonUrl = (gameId: string) => `${BASE_URL}/${gameId}.json`;

export const DEFAULT_GAME = 'bf6';
export const GAME_STORAGE_KEY = 'meta.selectedGame';
// Oyun secimi eklenmeden once bf6 verisi 'meta.json' anahtariyla saklaniyordu;
// mevcut kullanicilarin onbellegi kaybolmasin diye bf6 o eski anahtarda kalir.
//
// Bu kural DEFAULT_GAME'e DEGIL, sabit 'bf6'ya baglidir. Onceden DEFAULT_GAME
// ile karsilastiriliyordu; ikisi ayni oldugu surece calisiyordu ama varsayilan
// oyun degistigi anda o oyun bf6'nin eski onbellegini okumaya baslardi, yani
// yanlis oyunun verisi gosterilirdi.
const LEGACY_CACHE_GAME = 'bf6';
export const cacheKeyForGame = (gameId: string) => (gameId === LEGACY_CACHE_GAME ? 'meta.json' : `meta.json.${gameId}`);

// Oyun secimiyle ayni kalipta, ama tek anahtar: faction oyuna degil kullaniciya
// baglidir, oyun basina ayri saklamaya gerek yok (bkz. MetaProvider).
export const FACTION_STORAGE_KEY = 'meta.selectedFaction';

export type FactionInfo = { id: string; name: string };

// Ortak alanlar zorunlu; BF6'ya ozgu (build/slots/damageCurve) ve HD2'ye ozgu
// (statLines, stats.code/rows) alanlar opsiyonel — iki semadan biri hep eksik olur.
export type Entity = {
  id: string; name: string; category: string;
  tier: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D'; score: number;
  // Sadece faction'li oyunlarda (HD2) dolu. tier/score alanlari her zaman
  // varsayilan (illuminate) degerleri tasir; effectiveTier/effectiveScore
  // buradan okur.
  factions?: Record<string, { tier: Entity['tier']; score: number }>;
  // Sadece BF6: kendi kategorisi (sinifi) icindeki sira. tier ise genel
  // (tum silahlar icindeki) sira olarak kalir; displayTier ikisi arasinda secer.
  classTier?: Entity['tier'];
  stats: {
    rpm?: number; mag?: number; bulletVel?: number; adsTime?: number;
    recoilV?: number; fireMode?: string; damageCurve?: [number, number][];
    code?: string; rows?: unknown[];
    heroId?: number; attackType?: string; roles?: string[];
  };
  build?: { slot: string; item: string }[];
  slots?: {
    slot: string;
    recommended: string;
    options: { id: string; name: string; recoilMod: number }[];
  }[];
  statLines?: { label: string; value: string }[];
  rationale: {
    ttkByRange?: [number, number][];
    recoilPenalty?: number;
    effectiveDamage?: number;
    effectiveDps?: number;
    bandBreakdown?: { band: string; weight: number; damage: number }[];
    bracketBreakdown?: { bracket: string; winRate: number; matches: number }[];
    cantPenetrate?: unknown[];
    note?: string;
  };
};

export type Meta = {
  game: string; gameName: string; scoreNote: string;
  sourceHash: string; generatedAt: string; entities: Entity[];
  factions?: FactionInfo[];
  // Sadece HD2: tier-ici sira kategori icinde hesaplandigi icin ayni tier'in
  // en iyisi birden fazla kategoride ayni skoru alabilir ("ilk 5" o zaman
  // rastgele bir alt kume gosterir). Bu modda feed skor yerine kategori basina
  // tek oge gosterir.
  feedMode?: 'topPerCategory';
  // Sadece HD2: tier-ici skor bantlarinda ayirt edici olan sayi degil stat'tir.
  // 'stat' ise liste satirlarinda (META feed + ARSIV) skor yerine
  // statLines[0].value gosterilir. Detay ekrani (weapon/[id].tsx) bundan
  // etkilenmez, skor orada hep gorunur.
  listValue?: 'stat';
};

// Tek cozumleyici: ekranlar e.tier/e.score'a dogrudan degil, hep buradan
// erisir. faction null'sa ya da entity o faction icin veri tasimiyorsa
// (BF6/Dota gibi faction'siz oyunlarda hep boyle) varsayilana duser.
export function effectiveTier(e: Entity, faction: string | null): Entity['tier'] {
  if (faction && e.factions?.[faction]) return e.factions[faction].tier;
  return e.tier;
}
// category doluysa (bir sinif filtresi aktifse) ve entity'nin classTier'i varsa
// (sadece BF6) sinif-ici tier'i dondurur; aksi halde effectiveTier'a duser.
// HD2/Dota'da classTier hic olmadigi icin bu fonksiyon onlari etkilemez.
export function displayTier(e: Entity, faction: string | null, category: string | null): Entity['tier'] {
  if (category && e.classTier) return e.classTier;
  return effectiveTier(e, faction);
}
export function effectiveScore(e: Entity, faction: string | null): number {
  if (faction && e.factions?.[faction]) return e.factions[faction].score;
  return e.score;
}

// Onbellekteki veri ESKI semadan gelmis olabilir: cihazda duran kopya, uygulama
// guncellenmeden once yazilmistir ve `gameName` gibi sonradan eklenen alanlari
// tasimaz. Uygulama acilista once onbellegi boyadigi icin bu, ilk karede
// cokmeye yol aciyordu (gameName.toUpperCase() -> undefined). Eksik alanlari
// burada, tek yerde tamamliyoruz; ekranlar normalize edilmis veriyi gorur.
export function parseMeta(raw: string): Meta {
  const data = JSON.parse(raw);
  if (!Array.isArray(data.entities)) throw new Error('meta.json: entities eksik');
  const game = typeof data.game === 'string' ? data.game : 'bf6';
  return {
    ...data,
    game,
    gameName: typeof data.gameName === 'string' && data.gameName ? data.gameName : game.toUpperCase(),
  } as Meta;
}

export async function loadMeta(deps: {
  fetchImpl: typeof fetch;
  url: string;
  getCached: () => Promise<string | null>;
  setCached: (raw: string) => Promise<void>;
  onCached?: (meta: Meta) => void;
}): Promise<{ meta: Meta | null; offline: boolean }> {
  const { fetchImpl, url, getCached, setCached, onCached } = deps;
  let meta: Meta | null = null;

  const cached = await getCached();
  if (cached) {
    try {
      meta = parseMeta(cached);
      onCached?.(meta);
    } catch (err) {
      console.warn('[meta] onbellekteki veri cozulemedi:', err);
    }
  }

  try {
    const res = await fetchImpl(url);
    if (!res.ok) throw new Error(String(res.status));
    const text = await res.text();
    meta = parseMeta(text);
    await setCached(text);
    return { meta, offline: false };
  } catch (err) {
    console.warn('[meta] veri yenilenemedi, son onbellek kullaniliyor:', err);
    return { meta, offline: true };
  }
}

const MetaContext = createContext<{
  meta: Meta | null;
  loading: boolean;
  offline: boolean;
  reload: () => void;
  currentGame: string;
  setGame: (id: string) => void;
  currentFaction: string | null;
  setFaction: (id: string) => void;
}>({
  meta: null, loading: true, offline: false, reload: () => {},
  currentGame: DEFAULT_GAME, setGame: () => {},
  currentFaction: null, setFaction: () => {},
});

export function MetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [currentGame, setCurrentGame] = useState(DEFAULT_GAME);
  const [currentFaction, setCurrentFaction] = useState<string | null>(null);

  const load = (gameId: string) => {
    setLoading(true);
    (async () => {
      const result = await loadMeta({
        fetchImpl: fetch,
        url: gameJsonUrl(gameId),
        getCached: () => AsyncStorage.getItem(cacheKeyForGame(gameId)),
        setCached: (raw) => AsyncStorage.setItem(cacheKeyForGame(gameId), raw),
        // Onbellekteki kopyayi cozulur cozulmez boya (ag round-trip'ini bekleme) —
        // bu eklemeden onceki stale-while-revalidate davranisiyla ayni.
        onCached: (m) => { setMeta(m); setLoading(false); },
      });
      setMeta(result.meta);
      setOffline(result.offline);
      setLoading(false);
    })();
  };

  const reload = () => load(currentGame);

  const setGame = (id: string) => {
    if (id === currentGame) return;
    setCurrentGame(id);
    AsyncStorage.setItem(GAME_STORAGE_KEY, id);
    load(id);
  };

  const setFaction = (id: string) => {
    setCurrentFaction(id);
    AsyncStorage.setItem(FACTION_STORAGE_KEY, id);
  };

  // Meta her degistiginde (ilk yukleme, oyun degisimi, onbellek->ag gecisi)
  // faction'i yeniden coz: liste yoksa null, varsa mevcut secim listede degilse
  // (baska bir oyundan kalmis olabilir) listenin ilkine dus.
  useEffect(() => {
    if (!meta) return;
    const factions = meta.factions;
    if (!factions?.length) { setCurrentFaction(null); return; }
    setCurrentFaction((prev) => (prev && factions.some((f) => f.id === prev) ? prev : factions[0].id));
  }, [meta]);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(GAME_STORAGE_KEY);
      const initial = saved ?? DEFAULT_GAME;
      setCurrentGame(initial);
      const savedFaction = await AsyncStorage.getItem(FACTION_STORAGE_KEY);
      if (savedFaction) setCurrentFaction(savedFaction);
      load(initial);
    })();
  }, []);

  return (
    <MetaContext.Provider value={{ meta, loading, offline, reload, currentGame, setGame, currentFaction, setFaction }}>
      {children}
    </MetaContext.Provider>
  );
}

export const useMeta = () => useContext(MetaContext);
