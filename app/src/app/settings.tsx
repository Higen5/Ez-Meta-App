import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeta } from '../data/meta';

const NOTIFY_KEY = 'notifyOnMetaChange';
const LANG_LABEL = { en: 'ENGLISH', tr: 'TÜRKÇE' } as const;

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{
      width: 52, height: theme.minTouch, justifyContent: 'center', paddingHorizontal: 4,
      borderWidth: 1, borderColor: on ? theme.colors.accent : theme.colors.neutral400,
      backgroundColor: on ? theme.colors.accent : 'transparent',
      alignItems: on ? 'flex-end' : 'flex-start',
    }}>
      <View style={{ width: 16, height: 16, backgroundColor: on ? theme.colors.onAccent : theme.colors.neutral500 }} />
    </Pressable>
  );
}

function ValueButton({ label, onPress, readOnly }: { label: string; onPress?: () => void; readOnly?: boolean }) {
  return (
    <Pressable onPress={readOnly ? undefined : onPress} style={{
      minHeight: theme.minTouch, justifyContent: 'center', paddingHorizontal: theme.space.md,
      borderWidth: 1, borderColor: readOnly ? 'transparent' : theme.colors.neutral400,
    }}>
      <Text style={{
        fontFamily: theme.font.heading, fontSize: 11, letterSpacing: 0.6,
        color: readOnly ? theme.colors.neutral500 : theme.colors.text,
      }}>{label}</Text>
    </Pressable>
  );
}

export default function Settings() {
  const { lang, setLang, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { meta, currentGame } = useMeta();
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(NOTIFY_KEY).then((v) => { if (v !== null) setNotify(v === '1'); });
  }, []);

  const toggleNotify = () => {
    setNotify((prev) => {
      AsyncStorage.setItem(NOTIFY_KEY, prev ? '0' : '1');
      return !prev;
    });
  };

  const groups = [
    {
      title: t('settings.general'),
      rows: [
        {
          label: t('settings.language'), hint: t('settings.languageHint'),
          control: <ValueButton label={LANG_LABEL[lang]} onPress={() => setLang(lang === 'en' ? 'tr' : 'en')} />,
        },
        {
          label: t('settings.game'), hint: t('settings.gameHint'),
          control: <ValueButton label={(meta?.gameName ?? currentGame).toUpperCase()} onPress={() => router.push('/games')} />,
        },
      ],
    },
    {
      title: t('settings.notifications'),
      rows: [{
        label: t('settings.metaUpdates'), hint: t('settings.metaUpdatesHint'),
        control: <Toggle on={notify} onPress={toggleNotify} />,
      }],
    },
    {
      title: t('settings.data'),
      rows: [
        {
          label: t('settings.sourceVersion'), hint: t('settings.sourceVersionHint'),
          control: <ValueButton readOnly label={meta?.sourceHash.slice(0, 8) ?? '—'} />,
        },
        {
          label: t('settings.lastUpdate'), hint: t('settings.lastUpdateHint'),
          control: <ValueButton readOnly label={meta?.generatedAt.slice(0, 10) ?? '—'} />,
        },
      ],
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ backgroundColor: theme.colors.panel, padding: theme.space.lg, paddingTop: insets.top + theme.space.md }}>
        <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 28, color: theme.colors.text }}>{t('settings.title')}</Text>
      </View>
      {groups.map((g) => (
        <View key={g.title} style={{ paddingHorizontal: theme.space.lg, paddingTop: theme.space.lg }}>
          <Text style={{
            fontFamily: theme.font.headingBlack, fontSize: 11, letterSpacing: 1.8,
            color: theme.colors.text, borderBottomWidth: 2,
            borderBottomColor: theme.colors.divider, paddingBottom: 6,
          }}>{g.title}</Text>

          {g.rows.map((row) => (
            <View key={row.label} style={{
              flexDirection: 'row', alignItems: 'center', gap: theme.space.md,
              paddingVertical: theme.space.md, minHeight: 60,
              borderBottomWidth: 1, borderBottomColor: theme.colors.neutral300,
            }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: theme.font.bodyBold, fontSize: 13, color: theme.colors.text }}>{row.label}</Text>
                <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 10, color: theme.colors.neutral600, marginTop: 2 }}>{row.hint}</Text>
              </View>
              {row.control}
            </View>
          ))}
        </View>
      ))}

      {/* scoreNote skorun neyi olctugunu ve bilinen sinirini anlatir (veriden gelir,
          Ingilizce) — skorun ne oldugunu gizlemiyoruz. meta yuklenene kadar genel
          Turkce/Ingilizce metin gosterilir. */}
      <Text style={{
        fontFamily: theme.font.body, fontSize: 11, lineHeight: 17,
        color: theme.colors.neutral600, padding: theme.space.lg,
      }}>{meta?.scoreNote ?? t('settings.computedNote')}</Text>
    </ScrollView>
  );
}
