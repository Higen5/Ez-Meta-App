import { View, Text } from 'react-native';
import { theme } from '../theme';

const TIER_BG: Record<string, string> = {
  S: theme.colors.accent, A: theme.colors.neutral700,
  B: theme.colors.neutral500, C: theme.colors.neutral400,
};

export function TierBadge({ tier }: { tier: string }) {
  const bg = TIER_BG[tier] ?? theme.colors.neutral400;
  return (
    <View style={{ width: 34, height: 34, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{
        fontFamily: theme.font.headingBlack, fontSize: 15,
        color: tier === 'S' ? theme.colors.onAccent : theme.colors.bg,
      }}>{tier}</Text>
    </View>
  );
}
