import { View, Text, Pressable } from 'react-native';
import { theme } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export function DataError({ onRetry }: { onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.space.xl, justifyContent: 'center' }}>
      <View style={{ borderWidth: 2, borderColor: theme.colors.divider, padding: theme.space.xl }}>
        <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 20, color: theme.colors.text, marginBottom: theme.space.sm }}>
          {t('error.noData')}
        </Text>
        <Text style={{ fontFamily: theme.font.body, fontSize: 13, lineHeight: 20, color: theme.colors.neutral700, marginBottom: theme.space.lg }}>
          {t('error.noDataHint')}
        </Text>
        <Pressable onPress={onRetry} style={{
          minHeight: theme.minTouch, minWidth: theme.minTouch, backgroundColor: theme.colors.accent,
          justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.space.lg, alignSelf: 'flex-start',
        }}>
          <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 11, letterSpacing: 1.2, color: theme.colors.onAccent }}>
            {t('error.retry')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
