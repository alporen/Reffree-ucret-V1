# Hakem Ücret Takibi — Uygulama Planı

**Bağlam:** Kocaeli İl Hakem Kurulu 2026–2027 sezonu hakem ücretlerini; maç, yol ve harcırah dahil aylık kazanç olarak takip eden bir **web uygulaması**. Klasör şu an boş (yalnızca `rates.json` = ücret tablosu verisi). Kullanıcı, gönderdiği ekran görüntülerindeki karanlık temalı, kendi kullanıcısı ile giriş yapılan uygulamayı aynen istiyor.

**Karar verilenler (kullanıcıyla netleşti):**
- Web uygulaması, **ücretsiz internette** yayınlanacak (Vercel benzeri), sonra büyüyebilir
- **Supabase** kullanılacak (Postgres + Auth + RLS); veritabanı bu
- Kayıt: **herkes serbest**, kullanıcı adı + e-posta + şifre ile
- Görevler: yalnızca **Hakem / Yardımcı Hakem / 4. Hakem** (gözlemci yok)
- Harcırah: **her maç türü** ev sahibi/ikamet ilçesi = ücretin **%25**'i, deplasman = **%50**'si (resim + rates.json'daki "allowance false" satırları yok sayılır)
- Yol ücreti: **km değil, aralık (kademe) seçimi** ile; ücret aralıktan otomatik gelir, elle değiştirilebilir; "Yol ücreti yok" seçeneği de olacak
- Ekranlar: **Ana Sayfa, Maç Ekle, Aylık Tablo (Düzenle/Sil + PDF/Excel), İstatistikler** + kenar menüsü (tema/sezon ayarı)
- Aylık özet: liste + toplam
- Maç kaydı: ekrandaki kadarı; sonra düzenlenebilir ve silinebilir
- Ücret tablosu yayınlandıktan sonra **yönetici (kullanıcı) panelinden** değiştirilebilir
- Ayarlar: **koyu/açık tema + sezon seçimi**

## Teknik yığın (seçimlerim — "Yapıcı kararlarım" listesinde veto edebilirsiniz)

- **Vite + React 19 + TypeScript**, **Tailwind CSS**, **react-router-dom** — saf istemci SPA; Vercel'e statik yayın (Next.js'e gerek yok, Supabase zaten tüm veriyi Supabase'den çeker; sunucu tarafı mantık Auth + RLS + RPC içinde)
- **supabase-js v2**; oturum tarayıcıda; korumalı rotalar
- **Recharts** — iki grafik için (bar + halka); tema değişkenleri ile renklendirilir
- **xlsx (SheetJS)** — "Excel indir" gerçek `.xlsx` üretir, Türkçe karakterler ve para birimi doğru açılır
- **PDF:** `window.print()` + `@media print` ile temiz döküm (ekranda "PDF için yazdırma penceresinde 'PDF olarak kaydet' seçeneğin kullanın" altyazısı aynen korunur)
- Lucide ikonlar (gölgesiz, ince çizgi — ekran görüntülerine yakın)
- Ortam: Windows + Node 26.13 kurulu ✅ (plan, Windows'ta `npm run dev/build` ile doğrulanacak)

## Dosya yapısı

```
kaynak (kök):
  package.json, vite.config.ts, tsconfig.json, tailwind.config.js, .env.example, vercel.json, index.html
  public/ (favicon)
  src/
    main.tsx, App.tsx (routing + AuthProvider + ThemeProvider)
    lib/supabase.ts        → istemci (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
    lib/format.ts          → ₺ para (tr-TR), tarih (gg.aa.yyyy), ay adı
    lib/rates.ts           → ücret mantığı (saf fonksiyonlar — test edilir)
    lib/types.ts           → Match, FeeCategory, TravelBand, Season...
    context/AuthContext.tsx, ThemeContext.tsx
    components/  Sidebar, StatCard, MonthCard, MatchForm (ekle+düzenle ortak), ConfirmDialog, PrintTable
    pages/       LoginPage, RegisterPage, ResetPasswordPage, DashboardPage, AddMatchPage, MonthlyPage, StatsPage, SettingsPage, AdminPage
  supabase/
    schema.sql             → tablolar + RLS + RPC
    seed.sql               → rates.json'dan üretilmiş ücret verisi
  rates.json               → kaynak veri korunur
```

## Supabase şeması (özet)

```sql
profiles(id uuid pk → auth.users, username text unique not null,
         is_admin bool default false, created_at timestamptz default now())
seasons(id serial pk, label text unique not null)                    -- ör. '2026-2027' (aktif)
fee_categories(id serial pk, season_id int → seasons, key text not null,
               label text not null, referee numeric, assistant numeric, fourth numeric,
               sort_order int, unique(season_id, key))
travel_bands(id serial pk, season_id int → seasons, code text not null,   -- '1'..'6'
             label text not null,                                        -- '0–20 km', ..., '200+ km'
             min_km int, max_km int,                                     -- 200+ için max_km = null
             fee numeric not null, unique(season_id, code))
matches(id uuid pk default gen_random_uuid(),
        user_id uuid → profiles not null, season_id int → seasons not null,
        match_date date not null, category_id int → fee_categories not null,
        role text not null check (role in ('referee','assistant','fourth')),
        venue text not null check (venue in ('home','away')),            -- ev sahibi / deplasman
        second_same_day bool default false,                              -- 2. maç → yol+harcırah 0
        travel_band_id int,                                              -- null = yol ücreti yok
        match_fee numeric not null,                                      -- **anlık kopya** (ücret tablosu sonradan değişse de geçmiş maçlar bozulmaz)
        harcırah numeric not null, travel_fee numeric not null,
        created_at timestamptz default now())
```
İndeksler: `matches(user_id, match_date)`, `fee_categories(season_id)`. RLS: `matches` yalnız sahibi CRUD; `fee_categories/travel_bands/seasons` tüm giriş yapmış/giriş yapmamış kullanıcılar okur, **yalnızca is_admin günceller/ekler**; `profiles` herkes yalnız kendi satırını okur/yazar + tetikleyici `auth.users → profiles` satırı açar (kullanıcı adı meta'dan). Şifre sıfırlama Supabase e-posta akışı ile.

## Giriş / kayıt akışı (kullanıcı adı + e-posta + şifre)

1. Kayıt: e-posta + kullanıcı adı + şifre alınır (şifre min 8) → `supabase.auth.signUp({ email, password, options: { data: { username } } })`. Kullanıcı adı benzersiz değilse net hata gösterilir; e-posta doğrulama **açık**: kayıt sonrası kullanıcı, e-postasına gelen onay bağlantısını tıklamadan giriş yapamaz; giriş denemesinde "önce e-postanı doğrula" mesajı gösterilir.
2. Giriş: tek kutuya **kullanıcı adı VEYA e-posta** + şifre alınır →
   - İçinde `@` varsa → doğrudan `signInWithPassword({ email, password })`
   - Yoksa → önce `get_email_by_username(u)` **security-definer RPC**'si ile e-posta çözümlenip `signInWithPassword` çağrılır (sıra: trim, büyük/küçük harf duyarsız). Bilinmeyen ad/şifre hatası kullanıcı adı↔e-posta ayrımını sızdırmaz.
3. "Şifremi unuttum" → `resetPasswordForEmail` (e-posta ile sıfırlama; Supabase varsayılan gönderen hesabıyla ücretsizde saatte birkaç posta — başlangıç için yeterli, gerekirse sonra özel SMTP).
4. **E-posta doğrulama AÇIK** (kullanıcı tercihi): kayıt sonrası onay bağlantısı tıklanmadan giriş yapılamaz; "Şifre sıfırlama" e-postasına etkisi yok.
5. İlk yönetici: yayın sonrası Supabase SQL editöründe **tek satır**:
   `update profiles set is_admin = true where username = 'SİZİN_KULLANICI_ADINIZ';`
   → `/admin` sayfasına erişim açılır.

## Ücret mantığı (saf fonksiyon — lib/rates.ts)

```
matchFee(category, role)            → referee/assistant/fourth alanı
harcirah(matchFee, venue, second)   → second ? 0 : matchFee × (venue==='home' ? .25 : .50)
travel     → seçili bandın fee'si (harcanan seçenek: "Yol ücreti yok" → 0), elle değiştirilebilir
total      = matchFee + harcirah + travelFee
# "Aynı gün aynı yerde 2. maç" işaretli → travel ve harcırah 0 olarak zorlanır, ücret ödenir
```
Form, ekran görüntüsündeki alanları birebir içerir: Maç tarihi (GG.AA.YYYY), Maç türü (seç), Görev (seç), "Aynı gün ve aynı yerde — 2. maç (yol ve harcırah 0 TL)" onay kutusu, Görev yeri/harcırah ("Ev sahibi / ikamet ilçesi (%25)" / "Deplasman (%50)"), Yol mesafesi (yok/6 kademe), Yol ücreti (₺, otomatik, elle değiştirilebilir, altyazı: "Kilometre aralığı seçildiğinde ücret gelir; tutarı değiştirebilirsiniz."), Harcırah (₺, otomatik, elle değiştirilebilir, altyazı: "Maç ücretine göre hesaplanır; tutarı değiştirebilirsiniz."). Canlı önizleme: Maç ücreti | Yol | Harcırah | **Bu maçın toplamı** + yeşil "Maçı ekle" düğmesi.

## Ekranlar

1. **Maç Ekle** — yukarıdaki form; aynı ekran "Düzenle" modunda da açılır (`/mac-ekle?id=…`). Kaydedince Ana Sayfa'ya döner + başarı bildirimi.
2. **Aylık Tablo** — genel toplam çipi (₺ tüm zamanlar); ay kartları: "2026 Kasım / 1 maç / ₺2.020,00" (tıklanınca açılır). Açık ay: tablo (Tarih | Maç türü | Görev rozeti | Maç ücreti | Yol | Harcırah | Toplam | İşlem: **Düzenle** / **Sil**), kırmızı "AYLIK TOPLAM" satırı, sağ üst: **PDF olarak kaydet** ve **Excel indir**. Silme önce onay sorulur.
3. **İstatistikler** — ay bazında kazançlar (yatay bar grafiği; "Son N kayıtlı ay" rozeti), en altta ay toplam kartı + halka grafik "Çıkılan maç kategorileri" (kategori | Adet | Yüzde listesi); veri yoksa boş durum ("Henüz maç eklenmedi").
4. **Ana Sayfa** — üst sağ "Genel toplam kazanç"; 3 kart: "Bu ay yapılan maç (Kasım 2026)", "Ortalama maç başı kazanç", "En sık çıktığınız tür (… % · N maç)"; altında "En çok çıktığınız kategoride maçlar" tablosu (Tarih | Maç türü | Görevi).
5. **Ayarlar** — tema geçişi (koyu/açık, localStorage + kök öğede CSS değişkenleri) + sezon seçimi (DB'deki sezonlar; maç eklerken seçilen sezon kullanılır; geçmiş sezonlar ve ücretleri yeni sezonla taşınmaz — ücretler sezona göre okunur, maç anında kopyalanır) + "Şifre değiştir" ve "Çıkış yap". Sonda "Maç ve kazanç takibi" durum noktası.
6. **Admin** (yalnız is_admin) — sezon bazında ücret tablosu düzenleme (kategori satırları: etiket, 3 görev ücreti, sıra), 6 yol kademesi düzenleme, **yeni sezon oluşturma** (mevcut sezondan kopya), değişiklikten sonra herkes yeni tabloyu görür (geçmiş maçlar etkilenmez).
7. **Kimlik ekranları** — Giriş / Kayıt / Şifre sıfırlama; aynı koyu tasarım; form doğrulamaları Türkçe hata metinleri.

## Tohum verisi (rates.json → seed.sql)

- Sezon `2026-2027` (varsayılan/aktif). Kategoriler (yalnız `legacy` olmayan 25 satır): PAF U19 2200/1300/1040 · Kadın SL 1620/970/810 · Futsal 1620/970/810 · Plaj 1620/970/810 · SAL/1K/2K/Kadınlar 1–3. Lig 1300/780/650 · U15–U19/İşitme Engelliler 1165/710/585 · U10–U14 1040/650/520 · Futsal İl/Plaj İl/Halı Saha/Özel Turnuvalar 650/450/0. (Gözlemci sütunu yok sayılır.)
- 4. Hakem "Futsal İl grubunda" 0 TL olarak gelir; görev listesinde kalmaya devam eder, toplam hesabı doğru çıkar.
- Yol kademeleri: 1:0–20=460 · 2:21–50=550 · 3:51–75=650 · 4:76–100=830 · 5:101–199=1382 · 6:200+=3202 (`code` "1".."6" olarak seed'lenir, eski oran `travelRates` alanından; Eski/legacy girdiler atlanır).

## Yayın (Vercel + Supabase)

1. Önce **sizin Supabase hesabınızda** (supabase.com → ücretsiz proje, bölge `eu-central-1`): `supabase/schema.sql` → `supabase/seed.sql` → **"Confirm email" KAPATILMAYACAK** (e-posta doğrulama açık kalır, varsayılan budur) → sonda 1 yönetici `update`. Kayıt sonrası "e-postanı doğrula" ekranı gösterilir; onay bağlantısı canlı adrese yönlendirilir (`Site URL` Vercel domaini / `emailRedirectTo` ayarlanır).
2. Depoyu GitHub'a push'la (repo adı ör. `hakem-ucret-takip`; **gizli anahtarlar git'e girmez**, `.env.example`'da yalnız anahtar adları kalır).
3. Vercel → "Import Project" → env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (publishable/anon) → Deploy. `vercel.json`'da SPA `rewrites` (`/(.*) → /index.html`) var, alt rotalar yenilemede 404 olmaz.
4. Canlıda kayıt olup sizi admin yapan SQL'i çalıştırın; tabloyu kontrol edin.

## Doğrulama (uçtan uca kontrol listesi)

- `npm run build` hatasız; `npm run dev` ile eksik-hata kontrolü.
- Kayıt: biri kayıtta benzersiz kullanıcı adı → net hata; kısa şifreyle kayıt reddi; kayıt sonrası doğrulanmamış hesapla giriş reddi + "e-postanı doğrula" mesajı; onay bağlantısını tıklayınca giriş kabul; çıkış; yanlış şifre; kullanıcı adı ile ve e-posta ile giriş (aynı hesap); şifre sıfırlama akışı.
- Maç: 4 ayrı kombinasyon (home/away × yol yok/kademeli) × "2. maç" → elle hesapla ve ekran toplamını karşılaştır; Futsal İl 4. Hakem (0 TL); tam lira/quarter-lira (₺1.745,50 gibi) biçim; düzenle → değişince ay toplamı değişiyor mu; sil → onay sonrası listede yok.
- Aylık: iki farklı ay için kart ve toplam; PDF yazdırmada yalnız tablo+başlık (kenar menüsü basılmasın); Excel açılışta Türkçe karakter ve ₺ doğru.
- Grafik: veri yokken boş durum; tek ayda (resimlerdeki 1 maçlık halka %100) doğru gösterim.
- RLS: ikinci kullanıcıyla giriş → birinci kullanıcının maçlarını görmüyor, admin olmayan ücret tablosunu **güncelleyemiyor**.
- Tema: koyu→açık tüm ekranlarda (kimlik ekranları dahil) okunaklı.
- Üretim: kendi e-postanızla kayıt → admin yapın → bir ücreti değiştirin → yeni maçta güncel fiyatın yansıdığını görün; eski maçta kopyanın değişmediğini görün.

## Paketleme: 5 eşit parça (güncel bölüm — 2026-11-18)

> Bu bölüm, dosyanın ilerisindeki eski "Fazlar" listesini geçersiz kılar; 5 eşit parçaya bölünmüş güncel yapım sırasında izlenecek sırayı gösterir.
- **Aşama 1 — Temel + Giriş/Kayıt:** Vite+React+TS+Tailwind iskeleti, koyu/açık tema altyapısı, Supabase istemcisi, Auth (kayıt: kullanıcı adı+e-posta+şifre, e-posta doğrulama AÇIK; giriş: tek kutuya kullanıcı adı VEYA e-posta + RPC `get_email_by_username`), uygulama kabuğu (sidebar + korumalı rotalar), Giriş/Kayıt/Şifre sıfırlama ekranları. **Durum: tamamlandı, derleme temiz (paket 1/5).**
- **Aşama 2 — Supabase şema + RLS + RPC + tohum veri + ücret mantığı:** `supabase/schema.sql` (5 tablo + RLS + RPC + tetikleyici), `supabase/seed.sql` (2026-2027, 25 kategori + 6 yol kademesi, legacy girdiler hariç), `src/lib/rates.ts` (harcırah ev %25 / deplasman %50 / "2. maç"ta 0; toplam; tr kuruş yuvarlama). **Durum: tamamlandı; vitest 11/11 yeşil.**
- **Aşama 3 — Maç Ekle + Ana Sayfa:** ekle/düzenle ortak form, canlı toplam önizleme, `src/lib/matches.ts` veri katmanı, Ana Sayfa özet kartları + "En çok çıktığınız kategoride maçlar" tablosu; kenar çubuğunda genel toplam. **Durum: tamamlandı, derleme temiz.**
- **Aşama 4 — Aylık Tablo + PDF/Excel:** ay kartları, açılan tablo (Düzenle/Sil + AYLIK TOPLAM satırı), `@media print` ile PDF çıktısı, SheetJS ile gerçek .xlsx indir; oturum yoksa net giriş mesajı. **Durum: tamamlandı (derleme + birim testler yeşil; canlı veritabanıyla Excel/PDF çıktısı bu makinede henüz doğrulanmadı).**
- **Aşama 5 — İstatistikler + Ayarlar + Admin + Yayın rehberi:** Recharts bar + halka grafik (boş durumlarıyla), Ayarlar (koyu/açık tema, sezon seçimi, şifre/çıkış), Admin (ücret tablosu + yol kademesi + sezon kopyalama, yalnız is_admin) ve sonunda Vercel/Supabase yayın adımları. **Durum: bekliyor.**

**Doğrulama notu (güncel):** Uçtan uca "kayıt → e-postayı doğrula → maç ekle → ay toplamı" akışı henüz çalıştırılmadı, çünkü `.env` (Supabase URL + anon key) bu makinede doldurulmadı; giriş/kayıt ekranları ve tüm sayfalar ancak canlı Supabase projesiyle gerçek veriyle test edilebilir. Aşamalar şu an **derleme + birim testleriyle** doğrulanıyor; yayın adımında uçtan uca kontrol yapılacak.

Bu dosya: 2026-11-17 · `rates.json` 2026-2027 ücret listesi (kaynak) · bölüm eklendi 2026-11-18.

## Yapıcı kararlarım (hepsi ayrı ayrı veto edilebilir)

- Vite SPA + statik Vercel (Next.js yerine) — en küçük, en ucuz yayın
- Kullanıcı adı ile girişte güvenlik-definer `RPC: get_email_by_username` ile e-posta çözümleme; giriş tek kutuya ad veya e-posta alır (içinde `@` → e-posta akışı) (alternatif: girişi yalnız e-posta ile yapıp kullanıcı adını sadece görüntüleme için almak — isterseniz değişir)
- E-posta doğrulama **AÇIK** (kullanıcı tercihi): kayıt sonrası onay bağlantısı tıklanmadan giriş yapılamaz; şifre sıfırlama e-posta ile çalışır (`resetPasswordForEmail`)
- Ücretler maç anında **anlık kopyalanır** (match_fee / harcırah / travel_fee) — sezon değişse de geçmiş hesap bozulmaz
- PDF = tarayıcı yazdırma (yazdırma CSS'i); gerçek .xlsx = SheetJS
- Recharts; ikon Lucide; Tailwind
- Tema tercihi localStorage'da; sezon tercihi hesapta saklanır
- Sezon modeli: yalnız mevcut sezondan "yeni sezon kopyala" (sıfırdan giriş formu yok)
- Eski/legacy rates.json satırları seed'e **dahil değil**
- Harçirah kuralı %25/%50 tüm kategorilerde (sizin onayınızla); "allowance:false" yok sayılır
- Futsal İl grubunda 4. Hakem 0 TL olarak aynen korunur (tek sıfır değeri)

## Bu plana girmeyenler (non-goals)

Gözlemci ücreti, km/rota API'si, ödeme entegrasyonu, çok dillilik, mobil uygulama, bildirimler, topluluk/paylaşım özellikleri.

---

Bu dosya: 2026-11-17 · `rates.json` 2026-2027 ücret listesi (kaynak) · her karar/ekran için bağlı: kullanıcıyla 2026-11 ekran görüntüleri ve cevapları.
