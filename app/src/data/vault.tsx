import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'vault';

export type VaultStore = Record<string, string[]>;

export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

// Oyun secimi eklenmeden once kasa oyunsuz, duz bir id dizisiydi ({KEY}: string[]).
// Artik kayitlar oyun kimligiyle ayrilir; eski duz dizi gorulurse bf6'nin kaydi
// sayilir ki kullanicinin mevcut kayitlari kaybolmasin.
//
// Pure guard for the hydration race: a toggle() firing before the one-time
// AsyncStorage read resolves must win over that read, or the save gets
// silently discarded and the stale cached list re-applied. `touched` is true
// once any toggle() has happened. Do not remove as redundant — this is the
// only thing stopping hydrate-after-save data loss.
export function hydrate(raw: string | null, touched: boolean): VaultStore | null {
  if (touched || !raw) return null;
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? { bf6: parsed } : parsed;
}

const VaultContext = createContext<{
  idsFor: (gameId: string) => string[];
  toggle: (gameId: string, id: string) => void;
  has: (gameId: string, id: string) => boolean;
}>({ idsFor: () => [], toggle: () => {}, has: () => false });

export function VaultProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<VaultStore>({});
  const touched = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      const next = hydrate(raw, touched.current);
      if (next) setStore(next);
    });
  }, []);

  const toggle = (gameId: string, id: string) => {
    touched.current = true;
    setStore((prev) => {
      const next = { ...prev, [gameId]: toggleId(prev[gameId] ?? [], id) };
      AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const idsFor = (gameId: string) => store[gameId] ?? [];

  return (
    <VaultContext.Provider value={{ idsFor, toggle, has: (gameId, id) => idsFor(gameId).includes(id) }}>
      {children}
    </VaultContext.Provider>
  );
}

export const useVault = () => useContext(VaultContext);
