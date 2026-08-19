import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeta } from '../data/meta';

type Game = {
  id: string;
  name: string;
  genre: string;
  logo: number;
};

// Oyun adlari ve tur etiketleri ozel ad/jargon oldugu icin cevrilmiyor (bkz. CLAUDE talimati).
// require() yollari statik olmak zorunda, bu yuzden tek tek yazildi.
// Buradaki her oyunun data/ altinda calisan bir hatti var; "yakinda" olan yok.
// Tasarimda her satirda bir de oyuncu sayisi ("2.4M") var; o mock veriydi ve
// elimizde gercegi yok, bu yuzden gosterilmiyor.
const GAMES: Game[] = [
  { id: 'bf6', name: 'Battlefield 6', genre: 'FPS', logo: require('../../assets/games/battlefield-6.png') },
  // Helldivers 2'nin logosu Wikimedia Commons'ta yok (oradaki "H2_logo.png"
  // History Channel 2'ye ait); bu dosya kullanicinin verdigi gorselden
  // esiklenip beyaz zemine cekildi.
  // Eski veri kaynagi lisans nedeniyle (NonCommercial sarti) terk edilmisti;
  // yerine kullanicinin ekran goruntulerinden cikarilan tier listesi geldi.
  // Bu oyunda her ogenin uc faction icin ayri tier'i var (bkz. FactionBar).
  { id: 'hd2', name: 'Helldivers 2', genre: 'Co-op shooter', logo: require('../../assets/games/helldivers-2.png') },
  { id: 'dt2', name: 'Dota 2', genre: 'MOBA', logo: require('../../assets/games/dota-2.png') },
  // ARC Raiders'in tek bir metasi yok: bir silahin ARC robotlarina (PvE) ve
  // oyunculara (PvP) karsi degeri ayri hesaplanir ve ikisi birbirinin
  // neredeyse tersidir (Hullcracker PvE'de S, PvP'de D). Bu yuzden HD2'deki
  // faction cubugunun aynisi burada PvE/PvP olarak kullaniliyor.
  // Siralama ucuncu taraf bir tier listesinden, silah istatistikleri
  // RaidTheory/arcraiders-data (MIT) katalogundan gelir (bkz.
  // THIRD-PARTY-NOTICES.md).
  { id: 'arc', name: 'Arc Raiders', genre: 'Extraction shooter', logo: require('../../assets/games/arc-raiders.png') },
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
        const selected = g.id === currentGame;
        return (
        <Pressable
          key={g.id}
          onPress={() => { setGame(g.id); router.back(); }}
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
          <View style={{
            width: 76, height: 76, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
            backgroundColor: theme.colors.text, overflow: 'hidden',
          }}>
            <Image source={g.logo} resizeMode="contain" style={{ width: 66, height: 66 }} />
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{
              fontFamily: theme.font.heading, fontSize: 17, letterSpacing: -0.2, color: theme.colors.text,
            }}>{g.name}</Text>
            <Text style={{ fontFamily: theme.font.bodyMedium, fontSize: 11, color: theme.colors.neutral600, marginTop: 2 }}>
              {g.genre}
            </Text>
          </View>

          {selected && (
            <Text style={{ fontFamily: theme.font.headingBlack, fontSize: 18, color: theme.colors.accent }}>✓</Text>
          )}
        </Pressable>
        );
      })}
    </ScrollView>
  );
}
