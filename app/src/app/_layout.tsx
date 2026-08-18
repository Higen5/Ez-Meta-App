import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { LanguageProvider } from '../i18n/LanguageContext';
import { VaultProvider } from '../data/vault';
import { MetaProvider } from '../data/meta';
import { registerMetaCheck } from '../lib/background';

// Fontlar burada YUKLENMEZ. Archivo, app.json'daki expo-font eklentisiyle
// dogrudan APK'ya gomuluyor, yani uygulama daha ilk kareyi cizmeden hazir.
//
// Onceden useFonts ile calisma aninda yukleniyordu ve bu iki ayri hataya yol
// acti: (1) `!loaded` iken null donunce release derlemesi kalici siyah ekranda
// kaliyordu, (2) beklemeyi kaldirinca da ilk yerlesim sistem fontuyla olculup
// Archivo sonradan gelince React Native metinleri yeniden olcmuyordu — Archivo
// daha genis oldugu icin "PATCH" -> "PAT...", "RISERS" -> "RISER", "386" -> "38"
// diye kirpiliyordu. Fontu gomunce yarisin kendisi ortadan kalkiyor.
export default function RootLayout() {
  useEffect(() => { registerMetaCheck(); }, []);

  return (
    <LanguageProvider>
      <VaultProvider>
        <MetaProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </MetaProvider>
      </VaultProvider>
    </LanguageProvider>
  );
}
