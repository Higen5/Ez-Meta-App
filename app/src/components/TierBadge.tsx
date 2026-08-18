import { View, Text } from 'react-native';
import { theme } from '../theme';

// S+ ve D, tier olceginin genislemesiyle eklendi. Palette'te accent'ten daha
// "parlak" bir ton yok; S+ icin en yuksek kontrastli renk olan text (near-white)
// kullanildi. D icin C'nin (neutral400) alt kademesi olarak neutral300 secildi
// — dusuk tier'lerin koyulasma egilimini (A > B > C) surdurur.
export const TIER_BG: Record<string, string> = {
  'S+': theme.colors.text,
  S: theme.colors.accent, A: theme.colors.neutral700,
  B: theme.colors.neutral500, C: theme.colors.neutral400,
  D: theme.colors.neutral300,
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
