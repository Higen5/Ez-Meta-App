import { ScrollView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../theme';
import { useLanguage } from '../../i18n/LanguageContext';
import { useMeta, effectiveTier } from '../../data/meta';
import { useVault } from '../../data/vault';
import { TopBar } from '../../components/TopBar';
import { TierBadge } from '../../components/TierBadge';
import { Splash } from '../../components/Splash';
import { DataError } from '../../components/DataError';

export default function Vault() {
  const { t } = useLanguage();
  const { meta, loading, reload, currentGame, currentFaction } = useMeta();
  const { idsFor } = useVault();

  if (loading && !meta) return <Splash />;
  if (!meta) return <DataError onRetry={reload} />;

  const savedIds = idsFor(currentGame);
  const saved = meta.entities.filter((e) => savedIds.includes(e.id));

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <TopBar title={t('tab.vault')} subtitle={`${saved.length} ${t('vault.savedCount')}`} />
      <ScrollView contentContainerStyle={{ padding: theme.space.lg }}>
        {saved.length === 0 ? (
          <View style={{ borderWidth: 2, borderColor: theme.colors.divider, padding: theme.space.xl }}>
            <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 30, lineHeight: 30, color: theme.colors.text, marginBottom: theme.space.sm }}>
              {t('vault.empty')}
            </Text>
            <Text style={{ fontFamily: theme.font.body, fontSize: 13, lineHeight: 20, color: theme.colors.neutral700, marginBottom: theme.space.lg }}>
              {t('vault.emptyHint')}
            </Text>
            <Pressable onPress={() => router.push('/browse')} style={{
              minHeight: theme.minTouch, minWidth: theme.minTouch, backgroundColor: theme.colors.accent, justifyContent: 'center', paddingHorizontal: theme.space.lg, alignSelf: 'flex-start',
            }}>
              <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 11, letterSpacing: 1.2, color: theme.colors.onAccent }}>{t('vault.goBrowse')}</Text>
            </Pressable>
          </View>
        ) : (
          saved.map((e) => (
            <View key={e.id} style={{
              flexDirection: 'row', alignItems: 'center', gap: theme.space.md,
              borderWidth: 1, borderColor: theme.colors.neutral400, backgroundColor: theme.colors.surface,
              padding: theme.space.md, marginBottom: 2,
            }}>
              <TierBadge tier={effectiveTier(e, currentFaction)} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: theme.font.heading, fontSize: 15, color: theme.colors.text }}>{e.name}</Text>
                <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 10, color: theme.colors.neutral600 }} numberOfLines={1}>
                  {e.build?.length ? e.build.map((b) => b.item).join(' · ') : e.category}
                </Text>
              </View>
              <Pressable onPress={() => router.push(`/weapon/${e.id}`)} style={{
                minHeight: theme.minTouch, minWidth: theme.minTouch, justifyContent: 'center', paddingHorizontal: theme.space.md, backgroundColor: theme.colors.accent,
              }}>
                <Text style={{ fontFamily: theme.font.heading, fontSize: 9, letterSpacing: 1, color: theme.colors.onAccent }}>{t('feed.openBuild')}</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
