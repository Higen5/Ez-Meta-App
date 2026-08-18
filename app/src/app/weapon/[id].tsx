import { ScrollView, View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useLanguage } from '../../i18n/LanguageContext';
import { useMeta, effectiveTier, effectiveScore } from '../../data/meta';
import { useVault } from '../../data/vault';

export default function WeaponDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { meta, currentGame, currentFaction } = useMeta();
  const { toggle, has } = useVault();

  const e = meta?.entities.find((w) => w.id === id);
  if (!e) return null;

  const liveScore = effectiveScore(e, currentFaction);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ backgroundColor: theme.colors.panel, padding: theme.space.lg, paddingTop: insets.top + theme.space.md }}>
        <Pressable onPress={() => router.back()} style={{ width: theme.minTouch, height: theme.minTouch, justifyContent: 'center' }}>
          <Text style={{ fontFamily: theme.font.heading, fontSize: 20, color: theme.colors.text }}>←</Text>
        </Pressable>
        <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1.6, color: theme.colors.accent }}>{e.category}</Text>
        <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 38, color: theme.colors.text, marginTop: 6 }}>{e.name}</Text>
      </View>

      <View style={{ flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: theme.colors.divider }}>
        {[
          { v: String(liveScore), l: t('stat.score') },
          { v: effectiveTier(e, currentFaction), l: t('tab.tier') },
        ].map((s, i, arr) => (
          <View key={s.l} style={{
            flex: 1, padding: theme.space.md,
            borderRightWidth: i < arr.length - 1 ? 1 : 0, borderRightColor: theme.colors.neutral300,
          }}>
            <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 22, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{s.v}</Text>
            <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1, color: theme.colors.neutral600 }}>{s.l}</Text>
          </View>
        ))}
      </View>

      <View style={{ padding: theme.space.lg }}>
        <Text style={{
          fontFamily: theme.font.headingBlack, fontSize: 11, letterSpacing: 1.8, color: theme.colors.text,
          borderBottomWidth: 2, borderBottomColor: theme.colors.divider, paddingBottom: 6, marginBottom: theme.space.md,
        }}>{t('detail.stats')}</Text>
        {e.statLines?.map((s, i) => (
          <View key={`${s.label}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300 }}>
            <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1, color: theme.colors.neutral700 }}>{s.label}</Text>
            <Text style={{ fontFamily: theme.font.heading, fontSize: 13, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{s.value}</Text>
          </View>
        ))}
      </View>

      {!!e.build?.length && (
        <View style={{ paddingHorizontal: theme.space.lg, paddingBottom: theme.space.lg }}>
          <Text style={{
            fontFamily: theme.font.headingBlack, fontSize: 11, letterSpacing: 1.8, color: theme.colors.text,
            borderBottomWidth: 2, borderBottomColor: theme.colors.divider, paddingBottom: 6, marginBottom: theme.space.md,
          }}>{t('detail.build')}</Text>
          {e.build.map((b, i) => (
            <View key={`${b.slot}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300 }}>
              <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1, color: theme.colors.neutral700 }}>{b.slot}</Text>
              <Text style={{ fontFamily: theme.font.heading, fontSize: 13, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{b.item}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ paddingHorizontal: theme.space.lg, paddingTop: theme.space.sm }}>
        <Pressable onPress={() => toggle(currentGame, e.id)} style={{
          minHeight: theme.minTouch, minWidth: theme.minTouch, justifyContent: 'center', paddingHorizontal: theme.space.lg,
          backgroundColor: has(currentGame, e.id) ? theme.colors.accent : 'transparent',
          borderWidth: 1, borderColor: has(currentGame, e.id) ? theme.colors.accent : theme.colors.neutral400,
        }}>
          <Text style={{
            fontFamily: theme.font.headingBlack, fontSize: 11, letterSpacing: 1.2,
            color: has(currentGame, e.id) ? theme.colors.onAccent : theme.colors.text,
          }}>{has(currentGame, e.id) ? t('detail.saved') : t('detail.save')}</Text>
        </Pressable>
      </View>

      <View style={{ padding: theme.space.lg }}>
        <Text style={{
          fontFamily: theme.font.headingBlack, fontSize: 11, letterSpacing: 1.8, color: theme.colors.text,
          borderBottomWidth: 2, borderBottomColor: theme.colors.divider, paddingBottom: 6, marginBottom: theme.space.md,
        }}>{t('detail.why')}</Text>
        {e.rationale.effectiveDamage !== undefined && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300 }}>
            <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 12, color: theme.colors.neutral700 }}>{t('stat.effectiveDamage')}</Text>
            <Text style={{ fontFamily: theme.font.heading, fontSize: 13, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{e.rationale.effectiveDamage}</Text>
          </View>
        )}
        {e.rationale.effectiveDps !== undefined && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300 }}>
            <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 12, color: theme.colors.neutral700 }}>{t('stat.effectiveDps')}</Text>
            <Text style={{ fontFamily: theme.font.heading, fontSize: 13, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{e.rationale.effectiveDps}</Text>
          </View>
        )}
        {e.rationale.bandBreakdown?.map((b, i) => (
          <View key={`${b.band}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300 }}>
            <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 12, color: theme.colors.neutral700 }}>{b.band.toUpperCase()}</Text>
            <Text style={{ fontFamily: theme.font.heading, fontSize: 13, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{b.damage}</Text>
          </View>
        ))}
        {e.rationale.bracketBreakdown?.map((b, i) => (
          <View key={`${b.bracket}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300 }}>
            <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 12, color: theme.colors.neutral700 }}>{b.bracket.toUpperCase()}</Text>
            <Text style={{ fontFamily: theme.font.heading, fontSize: 13, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{`${b.winRate}%`}</Text>
          </View>
        ))}
        {e.rationale.note && (
          <Text style={{ fontFamily: theme.font.body, fontSize: 11, lineHeight: 17, color: theme.colors.neutral600, marginTop: theme.space.md }}>
            {e.rationale.note}
          </Text>
        )}
        <Text style={{ fontFamily: theme.font.body, fontSize: 11, lineHeight: 17, color: theme.colors.neutral600, marginTop: theme.space.md }}>
          {`${t('settings.dataSource')}: ${meta?.sourceHash.slice(0, 8)} · ${meta?.generatedAt.slice(0, 10)}`}
        </Text>
      </View>
    </ScrollView>
  );
}
