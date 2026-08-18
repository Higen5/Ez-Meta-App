import { ScrollView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../theme';
import { useLanguage } from '../../i18n/LanguageContext';
import { useMeta, type Entity } from '../../data/meta';
import type { StringKey } from '../../i18n/strings';
import { TopBar } from '../../components/TopBar';
import { TierBadge } from '../../components/TierBadge';
import { Splash } from '../../components/Splash';
import { DataError } from '../../components/DataError';

// Iki semada da bulunan ortak "ikincil stat" satiri: BF6'da TTK, HD2'de ilk
// statLines girdisi (statLines'in ilk elemani en onemli olani olacak sekilde
// pipeline tarafindan sirali uretiliyor).
function secondaryStat(e: Entity, t: (k: StringKey) => string): string | null {
  if (e.rationale.ttkByRange?.length) return `${t('stat.ttk')} ${Math.round(e.rationale.ttkByRange[0][1] * 1000)}ms`;
  if (e.statLines?.length) return `${e.statLines[0].label} ${e.statLines[0].value}`;
  return null;
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
  const { meta, loading, reload } = useMeta();

  if (loading && !meta) return <Splash />;
  if (!meta) return <DataError onRetry={reload} />;

  const sorted = [...meta.entities].sort((a, b) => b.score - a.score);
  const open = (e: Entity) => router.push(`/weapon/${e.id}`);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <TopBar title={t('tab.meta')} subtitle={`${meta.gameName.toUpperCase()} · ${meta.entities.length} ${t('feed.weapons')}`} />
      <ScrollView>
        <View style={{ padding: theme.space.lg }}>
          <SectionHead label={t('feed.top')} />
          {sorted.slice(0, 5).map((e) => (
            <Pressable key={e.id} onPress={() => open(e)} style={{
              flexDirection: 'row', alignItems: 'center', gap: theme.space.md,
              paddingVertical: 13, minHeight: theme.minTouch,
              borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300,
            }}>
              <TierBadge tier={e.tier} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: theme.font.heading, fontSize: 16, color: theme.colors.text }}>{e.name}</Text>
                <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 10, letterSpacing: 1, color: theme.colors.neutral600 }}>{e.category}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: theme.font.heading, fontSize: 14, color: theme.colors.text }}>{e.score}</Text>
                {secondaryStat(e, t) && (
                  <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1, color: theme.colors.neutral600 }}>
                    {secondaryStat(e, t)}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}
