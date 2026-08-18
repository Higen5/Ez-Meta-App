import { useEffect } from 'react';
import { View, Text, Animated, useAnimatedValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export function Splash() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const width = useAnimatedValue(8);

  useEffect(() => {
    Animated.timing(width, { toValue: 100, duration: 1400, useNativeDriver: false }).start();
  }, [width]);

  return (
    <View style={{
      flex: 1, backgroundColor: theme.colors.accent, padding: theme.space.xl,
      paddingTop: insets.top + theme.space.xl, justifyContent: 'space-between',
    }}>
      <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 13, letterSpacing: 2.6, color: theme.colors.onAccent }}>
        GAMING
      </Text>
      <View>
        <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 84, lineHeight: 69, letterSpacing: -4.2, color: theme.colors.onAccent }}>
          EZ{'\n'}META
        </Text>
        <View style={{ height: 3, backgroundColor: theme.colors.onAccent, marginTop: 22, marginBottom: 16 }} />
        <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 9, letterSpacing: 1.8, color: theme.colors.onAccent, opacity: 0.7, marginBottom: 12 }}>
          {t('loading.fetching')}
        </Text>
        <View style={{ height: 6, backgroundColor: 'rgba(17,23,10,0.22)' }}>
          <Animated.View style={{
            height: '100%', backgroundColor: theme.colors.onAccent,
            width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          }} />
        </View>
      </View>
      <View />
    </View>
  );
}
