import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Drawer, type DrawerContentComponentProps } from 'expo-router/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useLanguage } from '../../i18n/LanguageContext';

// Sekme cubugu yerine soldan saga kaydirilan cekmece menu. Ilk 3 satir
// drawer'in kendi ekranlari (navigation.navigate), son 3 satir drawer disinda
// Stack ile acilan ekranlar (router.push) — bu yuzden hicbir zaman "secili"
// gorunmuyorlar, drawer state'inde route'lari yok.
function DrawerRow({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: theme.minTouch, justifyContent: 'center', paddingHorizontal: theme.space.lg,
        borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
        backgroundColor: active ? theme.colors.accent : 'transparent',
      }}
    >
      <Text style={{
        fontFamily: theme.font.heading, fontSize: 14, letterSpacing: 0.8,
        color: active ? theme.colors.onAccent : theme.colors.neutral600,
      }}>{label}</Text>
    </Pressable>
  );
}

function DrawerContent(props: DrawerContentComponentProps) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const activeRoute = props.state.routeNames[props.state.index];

  const go = (route: string) => { props.navigation.navigate(route); };
  const push = (href: '/patch' | '/games' | '/settings') => { props.navigation.closeDrawer(); router.push(href); };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.panel, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ padding: theme.space.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.divider }}>
        <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 16, letterSpacing: 0.6, color: theme.colors.text }}>
          {t('nav.title')}
        </Text>
      </View>
      <DrawerRow label={t('tab.meta')} active={activeRoute === 'index'} onPress={() => go('index')} />
      <DrawerRow label={t('tab.browse')} active={activeRoute === 'browse'} onPress={() => go('browse')} />
      <DrawerRow label={t('tab.vault')} active={activeRoute === 'vault'} onPress={() => go('vault')} />
      <DrawerRow label={t('nav.patch')} active={false} onPress={() => push('/patch')} />
      <DrawerRow label={t('nav.games')} active={false} onPress={() => push('/games')} />
      <DrawerRow label={t('nav.settings')} active={false} onPress={() => push('/settings')} />
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: theme.colors.panel },
      }}
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="index" />
      <Drawer.Screen name="browse" />
      <Drawer.Screen name="vault" />
    </Drawer>
  );
}
