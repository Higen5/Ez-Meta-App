import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../theme';
import { useLanguage } from '../../i18n/LanguageContext';
import { useMeta, effectiveTier, effectiveScore, type Entity } from '../../data/meta';
import { TopBar } from '../../components/TopBar';
import { TierBadge, TIER_BG } from '../../components/TierBadge';
import { FactionBar } from '../../components/FactionBar';
import { Splash } from '../../components/Splash';
import { DataError } from '../../components/DataError';

export function filterAndSort(entities: Entity[], query: string, category: string | null, faction: string | null = null): Entity[] {
  return entities
    .filter((e) => !category || e.category === category)
    .filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => effectiveScore(b, faction) - effectiveScore(a, faction));
}

const TIERS = ['S+', 'S', 'A', 'B', 'C', 'D'] as const;

export default function Browse() {
  const { t } = useLanguage();
  const { meta, loading, reload, currentFaction } = useMeta();
  const [mode, setMode] = useState<'list' | 'tier'>('list');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(meta?.entities.map((e) => e.category) ?? [])],
    [meta]
  );

  const results = useMemo(
    () => filterAndSort(meta?.entities ?? [], query, category, currentFaction),
    [meta, query, category, currentFaction]
  );

  if (loading && !meta) return <Splash />;
  if (!meta) return <DataError onRetry={reload} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* v2'de bu basligin altinda sonuc sayaci yoktu, kaldirildi */}
      <TopBar title={t('tab.browse')} subtitle="" />
      <FactionBar />

      <View style={{ padding: theme.space.lg, borderBottomWidth: 2, borderBottomColor: theme.colors.divider }}>
        <View style={{ flexDirection: 'row', gap: 2, marginBottom: mode === 'list' ? theme.space.md : 0 }}>
          {(['list', 'tier'] as const).map((m) => {
            const active = mode === m;
            return (
              <Pressable key={m} onPress={() => setMode(m)} style={{
                flex: 1, minHeight: theme.minTouch, alignItems: 'center', justifyContent: 'center',
                backgroundColor: active ? theme.colors.accent : theme.colors.surface,
              }}>
                <Text style={{
                  fontFamily: theme.font.heading, fontSize: 11, letterSpacing: 0.8,
                  color: active ? theme.colors.onAccent : theme.colors.neutral600,
                }}>{m === 'list' ? t('browse.modeList') : t('browse.modeTier')}</Text>
              </Pressable>
            );
          })}
        </View>

        {mode === 'list' && (
          <>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('browse.search')}
              placeholderTextColor={theme.colors.neutral500}
              style={{
                height: 48, paddingHorizontal: theme.space.md, backgroundColor: theme.colors.surface,
                borderWidth: 1, borderColor: theme.colors.neutral400, borderRadius: theme.radius,
                fontFamily: theme.font.bodyMedium, fontSize: 14, color: theme.colors.text,
              }}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginTop: theme.space.sm }}>
              {[null, ...categories].map((c) => {
                const active = category === c;
                const label = c ?? t('browse.all');
                return (
                  <Pressable key={c ?? 'all'} onPress={() => setCategory(c)} style={{
                    minHeight: theme.minTouch, minWidth: theme.minTouch, justifyContent: 'center', paddingHorizontal: theme.space.md,
                    backgroundColor: active ? theme.colors.accent : 'transparent',
                    borderWidth: 1, borderColor: active ? theme.colors.accent : theme.colors.neutral400,
                  }}>
                    <Text style={{
                      fontFamily: theme.font.heading, fontSize: 10, letterSpacing: 0.8,
                      color: active ? theme.colors.onAccent : theme.colors.text,
                    }}>{label.toUpperCase()}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </View>

      {mode === 'list' ? (
        <FlatList
          data={results}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ paddingHorizontal: theme.space.lg, paddingBottom: theme.space.xl }}
          ListEmptyComponent={
            <View style={{ borderWidth: 2, borderColor: theme.colors.divider, padding: theme.space.xl, marginTop: theme.space.lg }}>
              <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 14, color: theme.colors.text, marginBottom: 6 }}>{t('browse.noResults')}</Text>
              <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 12, color: theme.colors.neutral600 }}>{t('browse.noResultsHint')}</Text>
            </View>
          }
          renderItem={({ item: e }: { item: Entity }) => (
            <Pressable onPress={() => router.push(`/weapon/${e.id}`)} style={{
              flexDirection: 'row', alignItems: 'center', gap: theme.space.md,
              paddingVertical: theme.space.md, minHeight: 64,
              borderTopWidth: 1, borderTopColor: theme.colors.neutral300,
            }}>
              <TierBadge tier={effectiveTier(e, currentFaction)} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: theme.font.heading, fontSize: 15, color: theme.colors.text }}>{e.name}</Text>
                <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 10, letterSpacing: 0.8, color: theme.colors.neutral600 }}>{e.category}</Text>
              </View>
              <View style={{ width: meta.listValue === 'stat' ? 110 : 84, alignItems: 'flex-end' }}>
                <Text numberOfLines={1} style={{ fontFamily: theme.font.heading, fontSize: 14, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>
                  {meta.listValue === 'stat' ? (e.statLines?.[0]?.value ?? '') : effectiveScore(e, currentFaction)}
                </Text>
                <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 0.8, color: theme.colors.neutral600 }} numberOfLines={1}>
                  {meta.listValue === 'stat'
                    ? (e.statLines?.[0]?.label ?? '')
                    : e.statLines?.length ? `${e.statLines[0].label} ${e.statLines[0].value}` : ''}
                </Text>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <ScrollView>
          {TIERS.map((tier) => {
            const items = meta.entities
              .filter((e) => effectiveTier(e, currentFaction) === tier)
              .sort((a, b) => effectiveScore(b, currentFaction) - effectiveScore(a, currentFaction));
            return (
              <View key={tier} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300 }}>
                <View style={{ width: 56, backgroundColor: TIER_BG[tier], alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 22, color: tier === 'S' ? theme.colors.onAccent : theme.colors.bg }}>{tier}</Text>
                </View>
                <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: theme.space.sm, minHeight: 60 }}>
                  {items.map((e) => (
                    <Pressable key={e.id} onPress={() => router.push(`/weapon/${e.id}`)} style={{
                      minHeight: theme.minTouch, minWidth: theme.minTouch, justifyContent: 'center', paddingHorizontal: theme.space.sm,
                      borderWidth: 1, borderColor: theme.colors.neutral400,
                    }}>
                      <Text style={{ fontFamily: theme.font.heading, fontSize: 11, color: theme.colors.text }}>{e.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
          <Text style={{ padding: theme.space.lg, fontFamily: theme.font.bodyMedium, fontSize: 10, lineHeight: 16, color: theme.colors.neutral600 }}>
            {`${t('settings.dataSource')}: ${meta.sourceHash.slice(0, 8)} · ${meta.generatedAt.slice(0, 10)}`}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
