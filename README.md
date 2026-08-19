# EZ//META

Meta build uygulaması. Kapsanan oyunlar: **Dota 2** (127 kahraman),
**Battlefield 6** (62 silah) ve **Helldivers 2** (234 öğe, 11 kategori).

## Skor her oyunda aynı şey demek değil

Bu projenin başlangıç fikri "sıralamayı hesapla, editoryal görüş olarak sunma"
idi. Bugün bu **yalnızca Dota 2 için doğru**. İki oyunun skoru temelden farklı
şeyler ölçüyor ve bunu gizlemek yerine yazıyoruz:

| Oyun | Skorun kaynağı | Ölçülmüş mü |
|---|---|---|
| Dota 2 | Derecelendirilmiş maçlardaki kazanma oranı | **Evet** |
| Battlefield 6 | Üçüncü taraf bir tier listesinin genel sıralaması | **Hayır** |
| Helldivers 2 | Üçüncü taraf bir tier listesinin faction bazlı tier'ları | **Hayır** |

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
skor      = 10000 x (toplam - sira + 1) / toplam   (1. sira 10000, 62. sira 161)
tier      = skorun 62 silahin TAMAMI icindeki yuzdeligi   (kesim %18)
classTier = skorun KENDI SINIFI icindeki yuzdeligi        (kesim %25)
```

Kaynaktan yalnızca **silahın adı, sınıfı ve sıra numarası** alınır. Açılma
seviyeleri, kaynağın kendi tier rozetleri ve menzil etiketleri alınmaz.
Sıralama pipeline/data/bf6-tierlist.json dosyasında elle tutulur; yama
geldiğinde bu dosya güncellenir, kod değişmez.

**Her silah iki tier taşır**, çünkü "tier" sorusunun cevabı neye kıyasladığına
bağlı. Uygulama hangisini göstereceğini bakılan ekrana göre seçer: arşivde bir
sınıf filtresi açıksa `classTier`, aksi halde genel `tier`. Filtre açıkken
listenin üstünde **SINIF İÇİ TIER** etiketi çıkar, aynı silahın iki farklı tier
göstermesi kafa karıştırmasın diye.

Örnek: SG-553R hem genel hem sınıf içinde S. BROD 3 ise carbine'ler arasında S
ama 62 silah içinde A — ikisi de doğru, farklı sorulara cevap veriyorlar.

Tek bir tier yetmiyordu. Yalnızca sınıf içi olduğunda ekranda çelişki
oluşuyordu: KORD 6P67 genel 4. sıradayken assault rifle'lar içinde 3/11 olduğu
için A, DRS-IAR ise genel 5. sıradayken LMG'lerde 1/10 olduğu için S
görünüyordu; liste skora göre sıralı olduğu için bu doğrudan göze batıyordu.
Yalnızca genel olduğunda ise zayıf sınıfların en iyisi kayboluyordu — P18 en
iyi secondary ama 62 silah içinde 57. sırada.

Kesimler farklı (%18 ve %25), çünkü 62 öğelik listeyle 4 öğelik shotgun
sınıfında aynı yüzdelik çok farklı davranıyor; tek sabit ikisine birden
uymuyordu.

**Bu skor bir ölçüm değildir**, başka birinin sıralama kararının sayıya
çevrilmiş hâlidir. Aynı kaynağın kategori sayfaları ile genel sayfası bazı
silahlarda birbiriyle çelişiyor; tek bir tutarlı ölçü olsun diye yalnızca genel
sıralama kullanılır.

Meta silahlar için ayrıca **önerilen build** listesi vardır
(pipeline/data/bf6-builds.json, ilk 13 silah). Bu okunur bir listedir; eklenti
değiştirip skoru canlı hesaplayan eski editör **yoktur**, çünkü onun
gerektirdiği hasar eğrisi ve eklenti başına geri tepme değerleri elimizde yok.

### Helldivers 2 — üç faction, tier listesinden

Bu oyunun eski veri kaynağı ticari kullanıma kapalı olduğu için kaldırıldı.
Yerine, Battlefield 6'daki gibi üçüncü taraf bir tier listesi geldi — ama bu
kaynak daha zengin: **her öğeye üç ayrı tier veriyor**, oyundaki üç düşman
fraksiyonu için (Automaton, Terminid, Illuminate).

Uygulamada META ve ARŞİV ekranlarının üstünde bir faction çubuğu var;
dokununca liste o fraksiyona göre yeniden diziliyor. Ayrışma gerçek: öğelerin
%44 ile %58'inde iki fraksiyon farklı tier alıyor.

```
skor = tier tabani + tier ici sira payi
S+ 6000   S 5000   A 4000   B 3000   C 2000   D 1000
```

Tier doğrudan kaynaktan gelir, **yüzdelikle hesaplanmaz** — diğer iki oyundan
farkı bu. Tier içindeki sıra, kaynağın o kategori için yayınladığı stattan
gelir: Primary'de DPS, Secondary / Support Weapon / Throwable / Sentry'de zırh
delme (AP), Vehicle'da can.

**Beş kategoride böyle bir stat yok** (Backpack, Eagle, Booster, Armor Passive,
Orbital). Orada kaynağın kendi satır sırası korunur ve o sıra yalnızca
Illuminate için doğrudur — kaynak tablolarını o sütuna göre sıralıyor. Diğer
iki fraksiyonda tier içi sıra keyfidir; uydurmak yerine böyle bırakıldı.

META ekranı bu oyunda **kategori başına bir öğe** gösterir, ilk 5 değil. Sebep
veriden geliyor: tier içi sıra kategori içinde hesaplandığı için her
kategorinin en iyi S+ öğesi aynı skoru alıyor, dolayısıyla "ilk 5" o
beraberlerden rastgele beşini gösterirdi. Bu davranış `feedMode` alanıyla
veriden sürülür, oyun kimliğine bakılarak değil.

Zırh delme (AP) sayıları bu kaynakta 0-9 arası bir ölçek olarak yayınlanıyor.
Oyun bu değerleri kendi arayüzünde hiç göstermez; ekran görüntüsünden
çıkarılamayacak tek şey buydu ve bu kaynak sayesinde elimizde.

### Arc Raiders — iki meta, birbirinin tersi

Bu oyunun **tek bir metası yok.** Bir silahın ARC robotlarına (PvE) ve
oyunculara (PvP) karşı değeri ayrı hesaplanır, ve bu iki sıralama birbirinin
neredeyse tersi çıkıyor.

Bunu ölçtük. Silahların zırh delme (ARC Armor Penetration) değeri ile tier'ları
arasındaki korelasyon:

| | zırh delme ile korelasyon |
|---|---|
| PvE tier | **r = +0.901** |
| PvP tier | **r = −0.512** |
| PvE ile PvP arasında | **r = −0.335** |

Uç örnekler tam tersine dönüyor: **Hullcracker, Equalizer ve Jupiter** PvE'de
en üst tier, PvP'de en alt tier. Üçü de "Very Strong" zırh delmeye sahip. Ters
yönde **Bobcat ve Canto** PvE'nin en altında, PvP'nin en üstünde — ikisi de
düşük zırh delmeli, yüksek atış hızlı yakın mesafe silahları.

Bu yüzden Helldivers 2 için yazılan faction çubuğu burada PvE/PvP olarak
yeniden kullanılıyor; `FactionBar` oyun kimliğine değil `meta.factions`
alanının varlığına baktığı için tek satır yeni kod gerekmedi.

```
skor = tier tabani + tier ici sira payi
S 5000   A 4000   B 3000   C 2000   D 1000
```

Helldivers 2'deki gibi tier doğrudan kaynaktan gelir, yüzdelikle hesaplanmaz.
Tier içindeki sıra kaynağın kendi sırasıdır ve **her mod için ayrı tutulur** —
aynı silah PvE listesinde üçüncü, PvP listesinde sonuncu olabilir.

**Silah istatistikleri ayrı bir kaynaktan gelir.** Zırh delme, mermi tipi, atış
modu, şarjör ve mod slotları `RaidTheory/arcraiders-data` deposundan build
sırasında çekilir. Bu kaynak **MIT lisanslı** ve aktif bakımda; yani Dota 2'den
sonra istatistikleri kendi kendine güncellenen ikinci oyun. Liste ekranında
skor yerine zırh delme etiketi görünür (`listValue`), skor yalnızca detay
ekranında.

Kaynakta sıralanmayan tek silah `Rascal`; uydurmak yerine listeden çıkarıldı.

## Lisans ve ticari kullanım

Uygulamanın ticari kullanıma uygun kalması bir gereklilik. Tüm bileşenler bu
gözle denetlendi. Tam metinler ve atıflar için
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) dosyasına bakın.

| Bileşen | Lisans | Durum |
|---|---|---|
| Archivo fontu | SIL OFL 1.1 | uygun |
| 34 npm bağımlılığı | 32 MIT, 1 Apache-2.0, 1 OFL | uygun |
| Dota 2 verisi (OpenDota) | Kod MIT, veri toplu istatistik | uygun |
| ARC silah kataloğu (RaidTheory) | MIT | uygun, atıf yapıldı |
| BF6 sıralaması | Üçüncü taraf tier listesi | aşağıya bakın |
| ARC sıralaması (ucuncu taraf tier listesi) | Üçüncü taraf tier listesi | aşağıya bakın |

**Kaldırılan kaynaklar.** Helldivers 2 verisi bir topluluk wiki sitesine
dayanıyordu ve **CC BY-NC-SA 4.0** lisanslıydı; NonCommercial maddesi ticari
kullanımı açıkça yasaklıyor. BF6 için kullanılan eski stat kaynağının GitHub
deposunda ise hiçbir lisans dosyası yoktu ve lisans belirtilmemişse varsayılan
"tüm hakları saklı" demektir. İkisi de veri hattından, uygulamadan ve depodan
tamamen çıkarıldı — TTK modeli, zırh delme modeli ve bunlara ait tüm sabitler
dahil.

**Reddedilen ARC kaynakları.** ARC Raiders için önce açık lisanslı bir sıralama
arandı. MetaForge API'si ticari kullanımı açıkça izne bağlıyor ("herhangi bir
şekilde paraya dönüştürülen bir üründe kullanmayı planlıyorsanız önce bize
ulaşın"), o yüzden elendi. Bir tier listesi sitesi ise oyunda **var olmayan**
silahlar listeliyordu (Scorpion, Longbow) — MIT kataloğundaki 84 silah kaydına
karşı kontrol edilince yakalandı; AI ile üretilmiş içerik. Kullanılan kaynaklar
aynı katalogla ad ad doğrulandı, 23 silahın hepsi eşleşti.

**BF6 ve ARC sıralamaları bilinçli bir istisnadır.** Sıra numaraları başka
birinin editoryal kararıdır. Olgular (silah adı, sınıfı, zırh delmesi)
serbestçe kullanılabilir ama sıralamanın kendisi öyle değildir. İki oyunda da
yalnızca sıralama alındı — metin, görsel ve istatistik alınmadı — ve bu sınır
`scoreNote` ile her varlığın `rationale.note` alanında veriyle birlikte
taşınıyor. Gelir modeline geçmeden önce bu kaynakların sahiplerinden izin
alınmalı ya da sıralama kendi ölçümümüzle değiştirilmelidir.

**ARC silah kataloğu temiz.** `RaidTheory/arcraiders-data` MIT lisanslı;
lisans metni ve istenen atıflar (depo + arctracker.io)
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) içinde. Bu depodaki **item
görselleri kullanılmadı**: oyun içi ekran görüntülerinden türetilmişler ve
Embark Studios'a ait, MIT lisansı onları kapsamıyor.

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

### Neden hash koda da bakıyor

Hat, çıktıyı yeniden üretip üretmeyeceğine bir hash karşılaştırmasıyla karar
verir. Bu hash **kaynak veriyi VE `pipeline/src` altındaki tüm kodu** kapsar
(`code-hash.js`).

Kodu dahil etmek şart, çünkü önceden hash yalnızca kaynağı kapsıyordu: skor
formülü değiştiğinde kaynak aynı kaldığı için build "kaynak degismedi" deyip
çıkış kodu 0 veriyor ve dosyada **eski formülün ürettiği veri** kalıyordu.
Sessiz olduğu için tehlikeliydi — build yeşil görünür, günlük cron kod
değişikliğini hiç almazdı.

Dosya içerikleri hash'lenirken `\r` atılır. Depo Windows'ta CRLF, CI'da LF ile
checkout edildiği için normalize edilmezse aynı kod iki platformda farklı hash
üretir ve cron her gün boşuna yazardı.

Takas: hash tüm ağacı kapsadığı için bir oyunun modülü değişince üç oyun da
yeniden üretilir. Alternatifi "hangi dosyayı hash'e katmayı hatırladım"
sorusuydu ve o soru er geç yanlış cevaplanır.

### Ekranı veriden sürmek

Uygulama hiçbir yerde oyun kimliğine göre dallanmaz; yalnızca veride hangi
alanın bulunduğuna bakar. Meta seviyesindeki üç opsiyonel alan bunu sağlar:

| Alan | Anlamı | Kimde var |
|---|---|---|
| `factions` | Faction çubuğunu göster, her öğenin faction başına tier'ı var | hd2 |
| `feedMode` | META ekranında **hangi** öğeler listelensin (`topPerCategory`) | hd2 |
| `listValue` | Liste satırlarında skor yerine **ne** gösterilsin (`stat`) | hd2 |

`feedMode` ile `listValue` bilerek ayrı: biri hangi öğelerin listeleneceğini,
diğeri ne gösterileceğini anlatır. Aynı alana iki anlam yüklemek üçüncü bir
ihtiyaçta çözülmez hâle gelirdi.

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
| 01 | Oyun seçimi | Ayarlar ekranından açılır; üç oyun da aktif |
| 02 | Meta | Skora göre ilk 5; HD2'de kategori başına bir öğe |
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

## Bilinen eksikler

- BF6 skoru bir ölçüm değil, başkasının sıralaması (yukarıya bakın).
- BF6 verisi otomatik güncellenmez; yama geldiğinde sıralama dosyası elle
  güncellenmelidir. Dota 2 tarafı otomatiktir.
- Dota 2 için pozisyon bazlı tier listesi yok; o veri ücretsiz yayınlanmıyor.
- HD2 skoru da bir ölçüm değil; tier'lar kaynaktan gelir, oyun içi performans
  ölçülmez.
- Ekranlar gerçek cihazda doğrulandı; otomatik UI testi yoktur.
- Arka plan görevi ve bildirim teslimi gerçek cihazda tetiklenmedi.
- Eklenti değiştirip skoru canlı hesaplayan editör **yoktur**. Gerektirdiği
  hasar eğrisi ve eklenti başına geri tepme değeri hiçbir kaynakta yok; kodu da
  kaldırıldı. Detay ekranı önerilen build'i okunur liste olarak gösterir.

## v1 kapsamı dışında

Kullanıcı hesabı ve profil, topluluk gönderileri ve oylama, oyun ID bağlama,
tier ekranında sürükle bırak düzenleme.
