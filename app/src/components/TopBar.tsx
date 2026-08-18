import { View, Text, Pressable } from 'react-native';
import { router, useNavigation } from 'expo-router';
// DrawerActions '@react-navigation/native'ten gelirdi ama SDK 56'dan beri
// expo-router o paketin dogrudan import edilmesini reddediyor (paket bundle
// asamasinda hata veriyor, tsc ve jest yakalamiyor). DrawerActions.openDrawer()
// zaten bu action nesnesini uretiyor, elle gondermek ayni isi goruyor.
const OPEN_DRAWER = { type: 'OPEN_DRAWER' } as const;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeta } from '../data/meta';

function MenuIcon() {
  return (
    <View style={{ width: 20, height: 20, justifyContent: 'space-between' }}>
      <View style={{ width: 20, height: 3, backgroundColor: theme.colors.text }} />
      <View style={{ width: 20, height: 3, backgroundColor: theme.colors.text }} />
      <View style={{ width: 20, height: 3, backgroundColor: theme.colors.text }} />
    </View>
  );
}

export function TopBar({ title, subtitle }: { title: string; subtitle: string }) {
  const { t } = useLanguage();
  const { offline } = useMeta();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  return (
    <View style={{ backgroundColor: theme.colors.panel, paddingTop: insets.top }}>
      <View style={{
        height: 56, flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.colors.panel, paddingHorizontal: theme.space.sm, gap: theme.space.sm,
      }}>
        <Pressable
          onPress={() => navigation.dispatch(OPEN_DRAWER)}
          style={{ width: theme.minTouch, height: theme.minTouch, alignItems: 'center', justifyContent: 'center' }}
        >
          <MenuIcon />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: theme.font.heading, fontSize: 15, color: theme.colors.text }}>{title}</Text>
          <Text numberOfLines={1} style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1.4, color: theme.colors.neutral500 }}>{subtitle}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/patch')}
          style={{ height: theme.minTouch, minWidth: theme.minTouch, paddingHorizontal: 10, borderWidth: 1, borderColor: theme.colors.neutral700, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <View style={{ width: 6, height: 6, backgroundColor: theme.colors.accent }} />
          <Text numberOfLines={1} style={{ fontFamily: theme.font.heading, fontSize: 10, letterSpacing: 1, color: theme.colors.text }}>{t('patch.chip')}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/settings')}
          style={{ width: theme.minTouch, height: theme.minTouch, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: theme.font.bodyBold, fontSize: 18, color: theme.colors.text }}>⚙</Text>
        </Pressable>
      </View>
      {offline && (
        <View style={{ backgroundColor: theme.colors.neutral300, padding: theme.space.md }}>
          <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 10, letterSpacing: 1, color: theme.colors.neutral700 }}>{t('error.offline')}</Text>
        </View>
      )}
    </View>
  );
}
