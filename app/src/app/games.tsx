import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeta } from '../data/meta';

type Game = {
  id: string;
  code: string;
  name: string;
  genre: string;
  logo: number | null;
  active: boolean;
};

// Oyun adlari ve tur etiketleri ozel ad/jargon oldugu icin cevrilmiyor (bkz. CLAUDE talimati).
// require() yollari statik olmak zorunda, bu yuzden tek tek yazildi.
// Veri hatti artik iki oyunu da destekliyor (data/games.json): Battlefield 6 ve
// BF6 ve Dota 2 aktif, geri kalani hala YAKINDA.
// Tasarimda her satirda bir de oyuncu sayisi ("2.4M") var; o mock veriydi ve
// elimizde gercegi yok, bu yuzden gosterilmiyor.
const GAMES: Game[] = [
  { id: 'bf6', code: 'BF6', name: 'Battlefield 6', genre: 'FPS', logo: require('../../assets/games/battlefield-6.png'), active: true },
  // Helldivers 2'nin logosu Wikimedia Commons'ta yok (oradaki "H2_logo.png"
  // History Channel 2'ye ait); bu dosya kullanicinin verdigi gorselden
  // esiklenip beyaz zemine cekildi.
  // Veri kaynagi lisans nedeniyle (NonCommercial sarti) terk edildi.
  // Yeni bir kaynak hazirlanana kadar YAKINDA gosteriliyor.
  { id: 'hd2', code: 'HD2', name: 'Helldivers 2', genre: 'Co-op shooter', logo: require('../../assets/games/helldivers-2.png'), active: false },
  { id: 'dt2', code: 'DT2', name: 'Dota 2', genre: 'MOBA', logo: require('../../assets/games/dota-2.png'), active: true },
  { id: 'lol', code: 'LOL', name: 'League of Legends', genre: 'MOBA', logo: require('../../assets/games/league-of-legends.png'), active: false },
  { id: 'apx', code: 'APX', name: 'Apex Legends', genre: 'Battle royale', logo: require('../../assets/games/apex-legends.png'), active: false },
  { id: 'arc', code: 'ARC', name: 'Arc Raiders', genre: 'Extraction shooter', logo: require('../../assets/games/arc-raiders.png'), active: false },
];

export default function Games() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { currentGame, setGame } = useMeta();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ padding: theme.space.lg, paddingTop: insets.top + theme.space.lg }}>
        <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 30, lineHeight: 32, letterSpacing: -0.6, color: theme.colors.text }}>
          {t('games.title')}
        </Text>
        <Text style={{ fontFamily: theme.font.body, fontSize: 13, lineHeight: 20, color: theme.colors.neutral700, marginTop: theme.space.md }}>
          {t('games.subtitle')}
        </Text>
      </View>

      {GAMES.map((g) => {
        const selected = g.active && g.id === currentGame;
        return (
        <Pressable
          key={g.id}
          disabled={!g.active}
          onPress={() => { if (g.active) { setGame(g.id); router.back(); } }}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: theme.space.md,
            minHeight: 84, paddingHorizontal: theme.space.lg, paddingVertical: theme.space.sm,
            borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
            borderLeftWidth: selected ? 4 : 0, borderLeftColor: theme.colors.accent,
          }}
        >
          {/* Resmi logolarin hepsi ACIK zemin icin cizilmis (siyah, koyu gri, altin).
              Uygulamanin koyu zemininde ucu tamamen kayboluyordu; bu yuzden logo
              acik renkli bir plaka uzerine oturuyor. */}
          {/* Plaka pasif satirlarda da tam parlaklikta kalir. Onceden tum satira
              opacity uygulaniyordu ve logolar gri bir sise dusuyordu; ayrimi
              metin rengi ile YAKINDA rozeti zaten yapiyor. */}
          <View style={{
            width: 76, height: 76, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
            backgroundColor: g.logo ? theme.colors.text : theme.colors.neutral300, overflow: 'hidden',
          }}>
            {g.logo ? (
              <Image source={g.logo} resizeMode="contain" style={{ width: 66, height: 66 }} />
            ) : (
              <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 15, color: theme.colors.neutral600 }}>{g.code}</Text>
            )}
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{
              fontFamily: theme.font.heading, fontSize: 17, letterSpacing: -0.2,
              color: g.active ? theme.colors.text : theme.colors.neutral500,
            }}>{g.name}</Text>
            <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 11, color: theme.colors.neutral600, marginTop: 2 }}>
              {g.genre}
            </Text>
          </View>

          {selected && (
            <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 18, color: theme.colors.accent }}>✓</Text>
          )}

          {!g.active && (
            <View style={{ borderWidth: 1, borderColor: theme.colors.neutral400, paddingHorizontal: theme.space.sm, paddingVertical: 4 }}>
              <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 9, letterSpacing: 1, color: theme.colors.neutral600 }}>
                {t('games.soon')}
              </Text>
            </View>
          )}
        </Pressable>
        );
      })}
    </ScrollView>
  );
}
