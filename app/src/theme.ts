export const theme = {
  colors: {
    bg: '#111110',
    surface: '#1a1a18',
    // panel: v2'de bu dolgulu blok dili terk edildi (header/profil artik duz bg + kenarlik).
    // Ekran ekran temizlenene kadar token burada duruyor, silme/degistirme.
    panel: '#201e1d',
    text: '#f2f0ee',
    divider: '#302e2b',
    accent: '#b9fe36',
    onAccent: '#11170a',
    neutral300: '#252321',
    neutral400: '#38352f',
    neutral500: '#7e7973',
    neutral600: '#a5a09a',
    neutral700: '#c9c4be',
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: 0,
  minTouch: 44,
  font: {
    heading: 'Archivo_800ExtraBold',
    headingBlack: 'Archivo_900Black',
    body: 'Archivo_400Regular',
    bodyMedium: 'Archivo_500Medium',
    bodyBold: 'Archivo_700Bold',
  },
} as const;
