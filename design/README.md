# EZ//META — App Tasarımı

Kaynak: Claude Design projesi `Gaming Meta Tracker App`
(`0f8940a0-15bb-4aea-ad4d-1f366e545d4d`).

**Geçerli tasarım: `EZ META v2.dc.html`.** `META Loadout App.dc.html` ilk
sürümdür, karşılaştırma için tutuluyor.

## İndirilenler

- `EZ META v2.dc.html` — geçerli tasarım, 13 ekran
- `META Loadout App.dc.html` — ilk sürüm, referans
- `EZ META Splash.dc.html` — 6 alternatif splash, **henüz seçim yapılmadı**;
  uygulama v2'nin kendi splash'ını (poster - tam yeşil) kullanır

İndirilmeyenler ve nedeni:

- `_ds/.../_ds_bundle.js`, `support.js` — Claude Design'ın tarayıcı önizleme
  çalışma zamanı (`dc-runtime`). React Native'de karşılığı yok.
- `android-frame.jsx` — Material 3 telefon çerçevesi taklidi. Gerçek cihazda
  çalışan bir uygulamada gereksiz.
- `_ds/.../styles.css` — açık temalı temel stil dosyası. Tasarım bunu koyu
  temayla eziyor; kullanılan gerçek değerler aşağıda.

## Tasarım dili

Brutalist / modernist: köşe yuvarlaması yok, kalın Archivo başlıklar,
sıkı harf aralığı, 1–2px çizgi ayraçlar, tek vurgu rengi.

| Token | Değer |
|---|---|
| bg | `#111110` |
| surface | `#1a1a18` |
| panel (koyu blok) | `#201e1d` — v2'de terk edildi, aşağıya bak |
| text | `#f2f0ee` |
| divider | `#302e2b` |
| accent | `#b9fe36` (lime) — değişmedi |
| accent üstü metin | `#11170a` — değişmedi |
| neutral 300 / 400 / 500 / 600 / 700 | `#252321` / `#38352f` / `#7e7973` / `#a5a09a` / `#c9c4be` |
| font | Archivo — 400/500/600/700/800/900 |
| radius | 0 (her yerde) |
| spacing | 4 / 8 / 12 / 16 / 24 / 32 |
| hedef | Android 412×892 |

Dokunma hedefleri 44–48px; tasarım buna baştan uymuş.

v2 `panel` dolgusunu terk etti: başlık, onboarding ve profil blokları artık koyu
bir blok değil, düz `bg` üstünde yalnızca kenarlıkla ayrılıyor. Token silinmedi,
ekranlar dokundukça temizleniyor.

## Ekranlar (v2)

| # | Ekran | Durum |
|---|---|---|
| 00 | Splash | uygulandı — tam yeşil poster, "META ÇEKİLİYOR" + ilerleme çubuğu |
| 01 | Oyun seçimi | uygulandı — `/games`, resmi logolarla; sadece BF6 aktif, diğerleri YAKINDA |
| 02 | Meta feed | uygulandı — yükselenler, öne çıkan build |
| 03 | Arşiv | uygulandı — LİSTE / TIER LIST mod anahtarı, arama, kategori çipleri |
| 04 | Build detay + editör | uygulandı — stat barları, slot bazlı editör |
| 06 | Kasa | uygulandı — kayıtlı build'ler |
| 07 | Patch log | uygulandı — yeşil hero v2'de kaldırıldı |
| 08 | Profil | **kapsam dışı** — hesap sistemi yok |
| 09 | Topluluk | **kapsam dışı** — gönderi/oy verisi ve backend yok |
| 10 | Yükleniyor | skeleton |
| 11 | Ayarlar | uygulandı — dil, bildirim, kaynak sürümü |
| 12 | Oyun menüsü | 01 ile birleştirildi — bottom-sheet yerine tam ekran route |

Oyun logoları Wikimedia Commons'tan alınmıştır (`app/assets/games/`). Hepsi açık
zemin için çizilmiş olduğundan koyu tema üzerinde açık renkli bir plakaya oturur.
Tasarımın satır başına gösterdiği oyuncu sayısı (`2.4M` vb.) mock veriydi, gerçeği
elimizde olmadığı için gösterilmiyor.

05 Tier list artık ayrı bir ekran değil: v2 onu Arşiv ekranının içine bir mod
olarak taşıdı. Tasarımdaki sürükle-bırak düzenleme uygulanmadı — tier hesaplanmış
veriden gelir, kullanıcı düzenlemesi diye bir kavram yok.

Tasarımın alt sekme çubuğu (META · ARŞİV · KASA · AKIŞ · PROFİL) uygulanmadı.
Yerine **soldan açılan çekmece menü** var: META · ARŞİV · KASA · PATCH · OYUN ·
AYARLAR. Bu bilinçli bir sapma — alt çubuk küçük ekranda etiketleri sıkıştırıyor
ve v2'nin AKIŞ/PROFİL sekmelerinin arkasında zaten veri yok.

## Ayarlar ekranının yapısı

Tasarım ayarları `settingGroups` → `grp.rows` olarak kuruyor. Her satırda
`label` + `hint` var ve satır iki tipten biri:

- `isToggle` — açık/kapalı anahtar düğmesi
- `isValue` — dokundukça değerler arasında dönen düğme

Bu yapı v1'de aynen kullanılır; değişen yalnızca hangi satırların bulunduğudur.
