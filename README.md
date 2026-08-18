# EZ//META

Meta build uygulaması. Kapsanan oyunlar: **Dota 2** (127 kahraman) ve
**Battlefield 6** (62 silah). Helldivers 2 hazırlanıyor.

## Skor her oyunda aynı şey demek değil

Bu projenin başlangıç fikri "sıralamayı hesapla, editoryal görüş olarak sunma"
idi. Bugün bu **yalnızca Dota 2 için doğru**. İki oyunun skoru temelden farklı
şeyler ölçüyor ve bunu gizlemek yerine yazıyoruz:

| Oyun | Skorun kaynağı | Ölçülmüş mü |
|---|---|---|
| Dota 2 | Derecelendirilmiş maçlardaki kazanma oranı | **Evet** |
| Battlefield 6 | Üçüncü taraf bir tier listesinin genel sıralaması | **Hayır** |

Skorlar oyunlar arasında karşılaştırılamaz. Her oyunun skor notu uygulamanın
Ayarlar ekranında görünür, yani sınır veriyle birlikte taşınır.

### Dota 2 — ölçülüyor

Dota 2, kazanma oranını herkese açık yayınlayan tek oyunumuz. OpenDota, derece
kovalarına ayrılmış hâlde ~36 milyon derecelendirilmiş hero-pick'in galibiyet
sayısını ücretsiz veriyor.

```
skor = 10000 x (kova 1..8 galibiyet toplami / kova 1..8 secim toplami)
tier = skorun kategori ici yuzdelik dilimi
```

Bant ağırlığı, ceza katsayısı, elle ayarlanmış sabit yok. En az örneklenen
kahraman bile ~15.000 maç taşıyor (standart hata ~%0,4), eleme yapılmıyor.

**Skor "en güçlü kahraman" demek değildir.** Derecelendirilmiş sıralı maçlarda
daha çok kazandıran kahramanı gösterir; bu genellikle "oynaması kolay" ile
karışır. Kova kırılımı bunu görünür kılar: Wraith King Herald'da %55,9,
Divine'da %52,4 kazanıyor.

Kullanılmayanlar: profesyonel maç verisi (kahraman başına ~9 maç, anlamsız),
Turbo modu (ayrı oyun modu) ve pub_pick (derecesi bilinmeyen maçları da içerir;
kova toplamı daha iyi tanımlı bir büyüklüktür).

Kategoriler birincil özelliktir (Strength / Agility / Intelligence /
Universal), oyun içi kahraman ızgarasıyla aynı. Pozisyon (1-5) bazlı gruplama
daha faydalı olurdu ama pozisyon bazlı kazanma oranı ücretsiz hiçbir kaynakta
yok; uydurma bir eşleme yapmak yerine kategoriyi veriden geleni bıraktık.

Veri yaklaşık 7 günlük kayan bir pencereyi kapsar, yani günlük iş dt2.json
dosyasını pratikte her gün yeniden yazar.

### Battlefield 6 — ölçülmüyor, sıralanıyor

BF6 için silah statlarını ticari kullanıma uygun bir lisansla yayınlayan bir
kaynak bulunamadı. Bu yüzden burada hesap yok: liste, üçüncü taraf bir tier
listesinin **genel meta sıralamasından** geliyor.

```
skor = 10000 x (toplam - sira + 1) / toplam    (1. sira = 10000, 62. sira = 161)
tier = skorun sinif ici yuzdelik dilimi
```

Kaynaktan yalnızca **silahın adı, sınıfı ve sıra numarası** alınır. Açılma
seviyeleri, kaynağın kendi tier rozetleri ve menzil etiketleri alınmaz.
Sıralama pipeline/data/bf6-tierlist.json dosyasında elle tutulur; yama
geldiğinde bu dosya güncellenir, kod değişmez.

**Bu skor bir ölçüm değildir**, başka birinin sıralama kararının sayıya
çevrilmiş hâlidir. Aynı kaynağın kategori sayfaları ile genel sayfası bazı
silahlarda birbiriyle çelişiyor; tek bir tutarlı ölçü olsun diye yalnızca genel
sıralama kullanılır.

Meta silahlar için ayrıca **önerilen build** listesi vardır
(pipeline/data/bf6-builds.json, ilk 13 silah). Bu okunur bir listedir; eklenti
değiştirip skoru canlı hesaplayan eski editör **yoktur**, çünkü onun
gerektirdiği hasar eğrisi ve eklenti başına geri tepme değerleri elimizde yok.

## Lisans ve ticari kullanım

Uygulamanın ticari kullanıma uygun kalması bir gereklilik. Tüm bileşenler bu
gözle denetlendi:

| Bileşen | Lisans | Durum |
|---|---|---|
| Archivo fontu | SIL OFL 1.1 | uygun |
| 34 npm bağımlılığı | 32 MIT, 1 Apache-2.0, 1 OFL | uygun |
| Dota 2 verisi (OpenDota) | Kod MIT, veri toplu istatistik | uygun |
| BF6 sıralaması | Üçüncü taraf tier listesi | aşağıya bakın |

**Kaldırılan kaynaklar.** Helldivers 2 verisi bir topluluk wiki sitesine
dayanıyordu ve **CC BY-NC-SA 4.0** lisanslıydı; NonCommercial maddesi ticari
kullanımı açıkça yasaklıyor. BF6 için kullanılan eski stat kaynağının GitHub
deposunda ise hiçbir lisans dosyası yoktu ve lisans belirtilmemişse varsayılan
"tüm hakları saklı" demektir. İkisi de veri hattından, uygulamadan ve depodan
tamamen çıkarıldı — TTK modeli, zırh delme modeli ve bunlara ait tüm sabitler
dahil.

**BF6 sıralaması bilinçli bir istisnadır.** Sıra numaraları başka birinin
editoryal kararıdır. Olgular (silah adı, sınıfı) serbestçe kullanılabilir ama
sıralamanın kendisi öyle değildir. Gelir modeline geçmeden önce bu kaynağın
sahibinden izin alınmalı ya da sıralama kendi ölçümümüzle değiştirilmelidir.

**Oyun görselleri kullanılmaz.** Kahraman portreleri, silah render görselleri ve
stratagem ikonları bilinçli olarak eklenmedi; hepsi yayıncıların telifli
varlıkları. Oyun seçim ekranındaki logolar yayıncı markalarıdır ve yalnızca
oyunu tanımlamak için kullanılır.

Bunların hiçbiri hukuki görüş değildir. Gelir modeline geçmeden önce bir
hukukçuya danışın.

## Mimari

Sunucu, veritabanı ve kullanıcı hesabı **yoktur**.

```
GitHub Actions (gunluk cron)
  -> her oyunun kaynagini hazirla (Dota 2 agdan, BF6 yerel dosyadan)
  -> icerik hash degisti mi? degismediyse o oyunu atla
  -> skor / tier hesapla, dogrula, yaz
  -> data/<oyun>.json uret ve commitle
        |
  uygulama secili oyunun dosyasini ceker, cihaza yazar,
  sonraki acilislar cevrimdisi calisir
```

```
data/                        yayinlanan cikti
  games.json   oyun indeksi, uygulama listeyi buradan okur
  bf6.json     Battlefield 6, 62 silah
  dt2.json     Dota 2, 127 kahraman

pipeline/data/               elle tutulan girdi
  bf6-tierlist.json  62 silahin genel siralamasi
  bf6-builds.json    meta silahlarin onerilen buildleri
```

Her oyunun mantığı pipeline/src/games/ altında ayrı bir dosyadadır; tier ataması
(score.js) ortaktır. Her oyun bağımsız çalışır: birinin kaynağı patlarsa
diğerleri yazılmaya devam eder.

| Katman | Yer | Yığın |
|---|---|---|
| Veri hattı | pipeline/ | Node 20+, ESM, node:test |
| Uygulama | app/ | Expo SDK 57, TypeScript, expo-router |
| Tasarım | design/ | Claude Design kaynağı ve token dökümü |

## Kurulum

```bash
cd pipeline && npm test && npm run build
```

```bash
cd app && npm install && npm test
```

Android cihazda çalıştırmak için (Windows):

```bash
npx expo run:android
```

**JDK 17 gerekir.** JDK 24 ve üstüyle CMake yapılandırma adımı "restricted
method in java.lang.System has been called" hatasıyla patlar.

app/android/local.properties git ile izlenmez; yoksa Gradle "SDK location not
found" der. Şu içerikle oluştur (ters eğik çizgi değil, düz eğik çizgi):

```
sdk.dir=C:/Users/<kullanici>/AppData/Local/Android/Sdk
```

EXPO_PUBLIC_META_URL tek bir dosyayı değil, oyun dosyalarının bulunduğu
**dizini** gösterir:

```bash
adb reverse tcp:8090 tcp:8090
```

```bash
EXPO_PUBLIC_META_URL=http://localhost:8090 npx expo run:android
```

## Ekranlar

| # | Ekran | İçerik |
|---|---|---|
| 00 | Splash | İlk açılış, veri henüz yokken |
| 01 | Oyun seçimi | Ayarlar ekranından açılır; Dota 2 ve Battlefield 6 aktif |
| 02 | Meta | Skora göre ilk 5 |
| 03 | Arşiv | LİSTE ve TIER LIST modu, arama, kategori filtresi |
| 04 | Detay | Stat satırları, önerilen build, neden bu tier |
| 06 | Kasa | Kaydedilen buildler (cihazda yerel) |
| 07 | Patch log | Son patchte yükselen ve düşenler |
| 11 | Ayarlar | Dil, bildirim, kaynak sürümü, skor notu |

Gezinme soldan açılan **çekmece menüyle** yapılır: META, ARŞİV, KASA, PATCH,
OYUN, AYARLAR.

### Fontlar hakkında

Archivo, app.json içindeki expo-font eklentisiyle **APK dosyasına gömülür**;
çalışma anında useFonts ile yüklenmez. Yüklemeyi asenkron bırakmak iki ayrı
hataya yol açmıştı: font beklenirken boş dönülünce release derlemesi kalıcı
siyah ekranda kalıyor, beklenmeyince de ilk yerleşim sistem fontuyla ölçülüp
Archivo sonradan gelince metinler kırpılıyordu (386 sayısı 38 görünüyordu). Font
eklendiğinde listeye yeni ttf yolunu ekle ve prebuild komutunu çalıştır.

## Dil

Varsayılan **İngilizce**, Ayarlar ekranından **Türkçe** seçilebilir. Silah,
kahraman, kategori ve eklenti adları çevrilmez, bunlar özel adlardır.

i18n kütüphanesi kullanılmaz: iki dil tek bir strings nesnesinde durur, seçim
React Context ile dağıtılır. Bir test iki dilin anahtar kümelerinin aynı
kalmasını zorunlu tutar.

## Veri dağıtımı

Depo public olduğu için uygulama veriyi doğrudan buradan çeker:

```
https://raw.githubusercontent.com/Higen5/Ez-Meta-App/main/data/games.json
https://raw.githubusercontent.com/Higen5/Ez-Meta-App/main/data/bf6.json
https://raw.githubusercontent.com/Higen5/Ez-Meta-App/main/data/dt2.json
```

Seçili oyun cihazda saklanır ve her oyunun verisi ayrı önbellek anahtarıyla
tutulur, böylece çevrimdışı çalışma iki oyun için de sürer.

## Helldivers 2 hakkında

Oyun listede duruyor ama **YAKINDA** olarak işaretli. Eski veri kaynağı lisans
nedeniyle kaldırıldı; yerine oyunun ekran görüntülerinden hazırlanan bir liste
gelecek.

Dikkat: HD2 için eski skor, zırh delme (AP) ve düşman zırhı (AV) üzerine
kuruluydu. Arrowhead bu sayıları hiç yayınlamıyor, **oyun içinde bile
göstermiyor**. Dolayısıyla o model ekran görüntülerinden yeniden kurulamaz; bu
oyun için skorun neyi ölçtüğü baştan tanımlanmalıdır.

## Bilinen eksikler

- BF6 skoru bir ölçüm değil, başkasının sıralaması (yukarıya bakın).
- BF6 verisi otomatik güncellenmez; yama geldiğinde sıralama dosyası elle
  güncellenmelidir. Dota 2 tarafı otomatiktir.
- Dota 2 için pozisyon bazlı tier listesi yok; o veri ücretsiz yayınlanmıyor.
- Ekranlar gerçek cihazda doğrulandı; otomatik UI testi yoktur.
- Arka plan görevi ve bildirim teslimi gerçek cihazda tetiklenmedi.
- Detay ekranında bf6Editable koşuluyla korunan eski eklenti editörü kod
  tabanında duruyor ama hiçbir veri onu tetiklemiyor, yani ölü kod.

## v1 kapsamı dışında

Kullanıcı hesabı ve profil, topluluk gönderileri ve oylama, oyun ID bağlama,
tier ekranında sürükle bırak düzenleme.
