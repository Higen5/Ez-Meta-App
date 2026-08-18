import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useLanguage } from '../../i18n/LanguageContext';
import { useMeta } from '../../data/meta';
import { useVault } from '../../data/vault';
import { ttkAtRange, scoreWithBuild } from '../../lib/ttk';

const RANGES = [10, 30, 60];

export default function WeaponDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { meta, currentGame } = useMeta();
  const { toggle, has } = useVault();
  const [picked, setPicked] = useState<Record<string, string>>({});

  const e = meta?.entities.find((w) => w.id === id);
  if (!e) return null;

  // BF6'ya ozgu build editoru + canli TTK/skor hesabi sadece slots ve
  // damageCurve varsa calisir (HD2'de ikisi de yok — hazir statLines/rationale
  // kullanilir, asagida).
  const bf6Editable = !!(e.slots?.length && e.stats.damageCurve && e.stats.rpm !== undefined && e.stats.recoilV !== undefined);

  // Baslangic: onerilen eklentiler. Kullanici dokundukca ustune yazilir.
  const selection = bf6Editable
    ? Object.fromEntries(e.slots!.map((s) => [s.slot, picked[s.slot] ?? s.recommended]))
    : {};
  const totalRecoilMod = bf6Editable
    ? e.slots!.reduce((sum, s) => {
        const opt = s.options.find((o) => o.id === selection[s.slot]);
        return sum + (opt?.recoilMod ?? 0);
      }, 0)
    : 0;
  const liveScore = bf6Editable
    ? scoreWithBuild(e.stats.rpm!, e.stats.damageCurve!, e.stats.recoilV!, totalRecoilMod)
    : e.score;
  const liveTtk = bf6Editable
    ? RANGES.map((r) => [r, ttkAtRange(e.stats.rpm!, e.stats.damageCurve!, r)] as const)
    : [];

  const statRows = bf6Editable ? [
    { label: t('stat.rpm'), value: Math.round(e.stats.rpm!), max: 1200 },
    { label: t('stat.damage'), value: e.stats.damageCurve![0][1], max: 60 },
    { label: t('stat.velocity'), value: e.stats.bulletVel ?? 0, max: 1000 },
    { label: t('stat.adsTime'), value: e.stats.adsTime ?? 0, max: 500 },
    { label: t('stat.mag'), value: e.stats.mag ?? 0, max: 100 },
  ] : [];

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
          ...(bf6Editable ? [{ v: `${Math.round(liveTtk[0][1] * 1000)}ms`, l: t('stat.ttk') }] : []),
          { v: String(liveScore), l: t('stat.score') },
          { v: e.tier, l: t('tab.tier') },
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
        {e.statLines ? (
          e.statLines.map((s) => (
            <View key={s.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300 }}>
              <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1, color: theme.colors.neutral700 }}>{s.label}</Text>
              <Text style={{ fontFamily: theme.font.heading, fontSize: 13, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{s.value}</Text>
            </View>
          ))
        ) : (
          statRows.map((s) => (
            <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, marginBottom: theme.space.sm }}>
              <Text style={{ width: 96, fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1, color: theme.colors.neutral700 }}>{s.label}</Text>
              <View style={{ flex: 1, height: 14, backgroundColor: theme.colors.neutral300 }}>
                <View style={{ height: 14, width: `${Math.min(100, (s.value / s.max) * 100)}%`, backgroundColor: theme.colors.accent }} />
              </View>
              <Text style={{ width: 44, textAlign: 'right', fontFamily: theme.font.heading, fontSize: 12, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{s.value}</Text>
            </View>
          ))
        )}
      </View>

      {!!e.build?.length && (
        <View style={{ paddingHorizontal: theme.space.lg, paddingBottom: theme.space.lg }}>
          <Text style={{
            fontFamily: theme.font.headingBlack, fontSize: 11, letterSpacing: 1.8, color: theme.colors.text,
            borderBottomWidth: 2, borderBottomColor: theme.colors.divider, paddingBottom: 6, marginBottom: theme.space.md,
          }}>{t('detail.build')}</Text>
          {e.build.map((b) => (
            <View key={b.slot} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300 }}>
              <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1, color: theme.colors.neutral700 }}>{b.slot}</Text>
              <Text style={{ fontFamily: theme.font.heading, fontSize: 13, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{b.item}</Text>
            </View>
          ))}
        </View>
      )}

      {bf6Editable && (
        <View style={{ paddingHorizontal: theme.space.lg }}>
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
            borderBottomWidth: 2, borderBottomColor: theme.colors.divider, paddingBottom: 6, marginBottom: theme.space.md,
          }}>
            <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 11, letterSpacing: 1.8, color: theme.colors.text }}>{t('detail.editor')}</Text>
            <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1, color: theme.colors.neutral600 }}>{t('detail.editorHint')}</Text>
          </View>
          {e.slots!.map((s) => (
            <View key={s.slot} style={{ marginBottom: theme.space.md }}>
              <Text style={{ fontFamily: theme.font.bodyBold, fontSize: 9, letterSpacing: 1.4, color: theme.colors.neutral700, marginBottom: 6 }}>
                {s.slot.toUpperCase()}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                {s.options.map((o) => {
                  const active = selection[s.slot] === o.id;
                  return (
                    <Pressable
                      key={o.id}
                      onPress={() => setPicked((p) => ({ ...p, [s.slot]: o.id }))}
                      style={{
                        minHeight: theme.minTouch, minWidth: theme.minTouch, justifyContent: 'center', paddingHorizontal: theme.space.md,
                        backgroundColor: active ? theme.colors.accent : 'transparent',
                        borderWidth: 1, borderColor: active ? theme.colors.accent : theme.colors.neutral400,
                      }}
                    >
                      <Text style={{
                        fontFamily: theme.font.heading, fontSize: 11,
                        color: active ? theme.colors.onAccent : theme.colors.text,
                      }}>{o.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <Text style={{ fontFamily: theme.font.body, fontSize: 11, lineHeight: 17, color: theme.colors.neutral600 }}>
            {t('detail.ttkNote')}
          </Text>
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
        {bf6Editable ? (
          liveTtk.map(([r, ttk]) => (
            <View key={r} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300 }}>
              <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 12, color: theme.colors.neutral700 }}>{r}m</Text>
              <Text style={{ fontFamily: theme.font.heading, fontSize: 13, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{Math.round(ttk * 1000)}ms</Text>
            </View>
          ))
        ) : (
          <>
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
            {e.rationale.bandBreakdown?.map((b) => (
              <View key={b.band} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300 }}>
                <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 12, color: theme.colors.neutral700 }}>{b.band.toUpperCase()}</Text>
                <Text style={{ fontFamily: theme.font.heading, fontSize: 13, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{b.damage}</Text>
              </View>
            ))}
            {e.rationale.bracketBreakdown?.map((b) => (
              <View key={b.bracket} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300 }}>
                <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 12, color: theme.colors.neutral700 }}>{b.bracket.toUpperCase()}</Text>
                <Text style={{ fontFamily: theme.font.heading, fontSize: 13, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{`${b.winRate}%`}</Text>
              </View>
            ))}
            {e.rationale.note && (
              <Text style={{ fontFamily: theme.font.body, fontSize: 11, lineHeight: 17, color: theme.colors.neutral600, marginTop: theme.space.md }}>
                {e.rationale.note}
              </Text>
            )}
          </>
        )}
        <Text style={{ fontFamily: theme.font.body, fontSize: 11, lineHeight: 17, color: theme.colors.neutral600, marginTop: theme.space.md }}>
          {`${t('settings.dataSource')}: ${meta?.sourceHash.slice(0, 8)} · ${meta?.generatedAt.slice(0, 10)}`}
        </Text>
      </View>
    </ScrollView>
  );
}
