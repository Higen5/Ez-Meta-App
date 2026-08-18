import { useEffect, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeta, type Entity } from '../data/meta';
import { Splash } from '../components/Splash';
import { DataError } from '../components/DataError';

const PREV_KEY = 'meta.prevSnapshot';

type Snapshot = { sourceHash: string; scores: Record<string, number> };

export function diffScores(entities: Entity[], prevScores: Record<string, number> | null) {
  if (!prevScores) return [];
  return entities
    .map((e) => ({ e, delta: e.score - (prevScores[e.id] ?? e.score) }))
    .filter((c) => c.delta !== 0)
    .sort((a, b) => b.delta - a.delta);
}

export default function PatchLog() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { meta, loading, reload } = useMeta();
  // 'loading' until the on-device snapshot has been read. Kept separate from
  // null (no snapshot ever stored — first launch) so the write effect below
  // can never fire before we know what was actually there.
  const [stored, setStored] = useState<Snapshot | null | 'loading'>('loading');

  useEffect(() => {
    AsyncStorage.getItem(PREV_KEY).then((raw) => setStored(raw ? JSON.parse(raw) : null));
  }, []);

  // Only overwrite the stored snapshot once we've both (a) finished reading the old
  // one and (b) confirmed the current meta is actually newer (different sourceHash).
  // Writing unconditionally on every mount would clobber the baseline before the
  // next visit ever gets to diff against it, permanently zeroing the patch log.
  useEffect(() => {
    if (!meta || stored === 'loading') return;
    if (stored?.sourceHash === meta.sourceHash) return;
    const scores = Object.fromEntries(meta.entities.map((e) => [e.id, e.score]));
    AsyncStorage.setItem(PREV_KEY, JSON.stringify({ sourceHash: meta.sourceHash, scores }));
  }, [meta, stored]);

  if (loading && !meta) return <Splash />;
  if (!meta) return <DataError onRetry={reload} />;
  if (stored === 'loading') return null;

  const changes = diffScores(meta.entities, stored?.scores ?? null);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ paddingHorizontal: theme.space.lg, paddingTop: insets.top + theme.space.xl }}>
        <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 10, letterSpacing: 1.8, color: theme.colors.neutral600 }}>
          {meta.gameName.toUpperCase()} · {meta.generatedAt.slice(0, 10)}
        </Text>
        <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 40, letterSpacing: -1.6, color: theme.colors.text, marginTop: 10 }}>
          {t('patch.title')}
        </Text>
      </View>

      <View style={{ padding: theme.space.lg }}>
        {changes.length === 0 ? (
          <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 12, color: theme.colors.neutral600 }}>
            {`${t('settings.dataSource')}: ${meta.sourceHash.slice(0, 8)} · ${t('settings.lastUpdate')}: ${meta.generatedAt.slice(0, 10)}`}
          </Text>
        ) : (
          changes.map(({ e, delta }) => (
            <View key={e.id} style={{
              flexDirection: 'row', alignItems: 'center', gap: theme.space.md,
              paddingVertical: theme.space.md, minHeight: theme.minTouch,
              borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300,
            }}>
              <Text style={{ width: 20, fontFamily: theme.font.headingBlack, fontSize: 16, color: delta > 0 ? theme.colors.accent : theme.colors.neutral500 }}>
                {delta > 0 ? '▲' : '▼'}
              </Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: theme.font.heading, fontSize: 14, color: theme.colors.text }}>{e.name}</Text>
                <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 10, color: theme.colors.neutral600 }}>
                  {e.category} · {delta > 0 ? t('patch.risers') : t('patch.fallers')}
                </Text>
              </View>
              <Text style={{ fontFamily: theme.font.heading, fontSize: 13, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>
                {delta > 0 ? '+' : ''}{delta}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
