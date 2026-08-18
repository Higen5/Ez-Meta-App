import { View, Text, Pressable } from 'react-native';
import { theme } from '../theme';
import { useMeta } from '../data/meta';

// meta.factions yoksa hic render etme — oyun id'sine bakmaz, sadece alan
// varligina gore dallanir (BF6/Dota bu bilesenden habersiz kalir).
export function FactionBar() {
  const { meta, currentFaction, setFaction } = useMeta();
  if (!meta?.factions?.length) return null;

  return (
    <View style={{ flexDirection: 'row', gap: 2, padding: theme.space.lg, paddingBottom: 0 }}>
      {meta.factions.map((f) => {
        const active = currentFaction === f.id;
        return (
          <Pressable key={f.id} onPress={() => setFaction(f.id)} style={{
            flex: 1, minHeight: theme.minTouch, alignItems: 'center', justifyContent: 'center',
            backgroundColor: active ? theme.colors.accent : theme.colors.surface,
          }}>
            <Text style={{
              fontFamily: theme.font.heading, fontSize: 11, letterSpacing: 0.8,
              color: active ? theme.colors.onAccent : theme.colors.neutral600,
            }}>{f.name.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
