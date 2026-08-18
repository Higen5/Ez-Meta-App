import { ScrollView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../theme';
import { useLanguage } from '../../i18n/LanguageContext';
import { useMeta, effectiveTier, effectiveScore, type Entity, type Meta } from '../../data/meta';
import type { StringKey } from '../../i18n/strings';
import { TopBar } from '../../components/TopBar';
import { TierBadge } from '../../components/TierBadge';
import { FactionBar } from '../../components/FactionBar';
import { Splash } from '../../components/Splash';
import { DataError } from '../../components/DataError';

// Iki semada da bulunan ortak "ikincil stat" satiri: BF6'da TTK, HD2'de ilk
// statLines girdisi (statLines'in ilk elemani en onemli olani olacak sekilde
// pipeline tarafindan sirali uretiliyor).
function secondaryStat(e: Entity, t: (k: StringKey) => string): string | null {
  if (e.statLines?.length) return `${e.statLines[0].label} ${e.statLines[0].value}`;
  return null;
}

// feedMode yoksa (BF6/Dota): skora gore ilk 5. 'topPerCategory' ise (HD2):
// her kategorinin en yuksek skorlu ogesi, hepsi, skora gore sirali. Kategori
// listesi sabit degil, veriden turer. Beraberlikte ilk gorulen kazanir (>
// karsilastirmasi, rastgelelik yok).
export function selectFeedItems(entities: Entity[], feedMode: Meta['feedMode'], faction: string | null): Entity[] {
  if (feedMode === 'topPerCategory') {
    const bestByCategory = new Map<string, Entity>();
    for (const e of entities) {
      const best = bestByCategory.get(e.category);
      if (!best || effectiveScore(e, faction) > effectiveScore(best, faction)) bestByCategory.set(e.category, e);
    }
    return [...bestByCategory.values()].sort((a, b) => effectiveScore(b, faction) - effectiveScore(a, faction));
  }
  return [...entities].sort((a, b) => effectiveScore(b, faction) - effectiveScore(a, faction)).slice(0, 5);
}

const SectionHead = ({ label, note }: { label: string; note?: string }) => (
  <View style={{
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    borderBottomWidth: 2, borderBottomColor: theme.colors.divider, paddingBottom: 6,
  }}>
    <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 11, letterSpacing: 1.8, color: theme.colors.text }}>{label}</Text>
    {note && <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1.2, color: theme.colors.neutral600 }}>{note}</Text>}
  </View>
);

export default function Feed() {
  const { t } = useLanguage();
  const { meta, loading, reload, currentFaction } = useMeta();

  if (loading && !meta) return <Splash />;
  if (!meta) return <DataError onRetry={reload} />;

  const feedItems = selectFeedItems(meta.entities, meta.feedMode, currentFaction);
  const open = (e: Entity) => router.push(`/weapon/${e.id}`);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <TopBar title={t('tab.meta')} subtitle={`${meta.gameName.toUpperCase()} · ${meta.entities.length} ${t('feed.weapons')}`} />
      <FactionBar />
      <ScrollView>
        <View style={{ padding: theme.space.lg }}>
          <SectionHead label={meta.feedMode === 'topPerCategory' ? t('feed.topPerCategory') : t('feed.top')} />
          {feedItems.map((e) => (
            <Pressable key={e.id} onPress={() => open(e)} style={{
              flexDirection: 'row', alignItems: 'center', gap: theme.space.md,
              paddingVertical: 13, minHeight: theme.minTouch,
              borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300,
            }}>
              <TierBadge tier={effectiveTier(e, currentFaction)} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: theme.font.heading, fontSize: 16, color: theme.colors.text }}>{e.name}</Text>
                <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 10, letterSpacing: 1, color: theme.colors.neutral600 }}>{e.category}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', maxWidth: 140 }}>
                {meta.listValue === 'stat' ? (
                  // topPerCategory'de satirin skoru zaten esit (tier bandinin tepesi) —
                  // sayi bilgi tasimiyor. Yerine ayirt edici olan ilk statLine'i (deger ustte, etiket altta) goster.
                  e.statLines?.[0] && (
                    <>
                      <Text numberOfLines={1} style={{ fontFamily: theme.font.heading, fontSize: 14, color: theme.colors.text }}>
                        {e.statLines[0].value}
                      </Text>
                      <Text numberOfLines={1} style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1, color: theme.colors.neutral600 }}>
                        {e.statLines[0].label}
                      </Text>
                    </>
                  )
                ) : (
                  <>
                    <Text style={{ fontFamily: theme.font.heading, fontSize: 14, color: theme.colors.text }}>{effectiveScore(e, currentFaction)}</Text>
                    {secondaryStat(e, t) && (
                      <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1, color: theme.colors.neutral600 }}>
                        {secondaryStat(e, t)}
                      </Text>
                    )}
                  </>
                )}
              </View>
            </Pressable>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}
