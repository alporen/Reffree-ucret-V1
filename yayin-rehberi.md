# Yayın Rehberi — Hakem Ücret Takibi

Bu dosya, uygulamayı ücretsiz canlıya almak için gerekli adımları adım adım anlatır.
Son güncelleme: 2026-11-18

## 1. Supabase projesini hazırlayın

1. https://supabase.com → oturum açın → **New project** oluşturun (ücretsiz plan).
2. Bölge: `eu-central-1` (Frankfurt) veya Türkiye'ye en yakını; proje parolasını saklayın.
3. Sol menü → **SQL Editor** → **New query**:
   - [supabase/schema.sql](supabase/schema.sql) dosyasının **tüm** içeriğini yapıştırıp **Run** edin (Ctrl+Enter).
   - Ardından [supabase/seed.sql](supabase/seed.sql) dosyasının **tüm** içeriğini yapıştırıp **Run** edin.
   - Tablolar Table Editor'de görünmeli: `profiles`, `seasons`, `fee_categories`, `travel_bands`, `matches`.
   - Hata alınırsa hata metnini kopyalayıp geliştiriciye iletin (tablo adları ve hata kodu yeterli).
4. Authentication ayarları:
   - **Authentication → Providers** → Email açık olsun; **Confirm email** açık bırakın (kullanıcı e-postasındaki bağlantıya tıklamadan giremez).
   - **Authentication → URL Configuration** → Site URL'yi yayına alınacak adresinize (ör. `https://<proje>.vercel.app`), Redirect URLs'e aynı adresi + localhost geliştirme için `http://localhost:5173` girin.
5. API anahtarları: **Project Settings → API Keys** → `anon public` (publishable) anahtarını kopyalayın; asla `service_role` anahtarını kullanmayın.

## 2. Yerelde çalıştırın ve deneyin

```powershell
cd "C:\Users\nwcas\OneDrive\Desktop\Claude Tasarımlar\Hakem Ücret Takibi"
npm install
copy .env.example .env   # sonra .env'i Not Defteri ile açın
```

`.env` içi:
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

```powershell
npm run dev
```
→ http://localhost:5173 — kayıt olun, e-postadaki onay bağlantısına tıklayın, giriş yapın, maç ekleyin.

## 3. Sizi yönetici yapın

Kayıt olduktan sonra SQL Editor'de şunu çalıştırın:
```sql
update public.profiles set is_admin = true where username = 'KULLANICI_ADINIZ';
```
→ `/admin` artık açılır (sitede `Ayarlar → Yönetici paneli` çıkar).

## 4. GitHub → Vercel

1. Repo: `https://github.com/alporen/Reffree-ucret-V1.git` (zaten origin olarak tanımlı; `master` son commit'leri `d778b58` + Aşama 5 commit'i de push edilecek).
2. https://vercel.com → GitHub hesabınızla oturum açın → **Add New → Project** → `Reffree-ucret-V1`'i seçin.
3. Framework: **Vite** (otomatik algılanır) · Build: `npm run build` · Output: `dist`
4. **Environment Variables**: `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerini ekleyin.
5. **Deploy**. Bittiğinde `https://<proje>.vercel.app` adresi oluşur.
6. Supabase **Authentication → URL Configuration**'da Site URL'yi bu Vercel adresi yapın; Redirect URLs'e de aynı adresi ekleyin (kayıt/onay e-postaları doğru yere düşer).

## 5. Canlı kontrol listesi

- [ ] Kayıt → onay e-postası → giriş (aynı hesapla kullanıcı adıyla da e-postayla da giriş)
- [ ] Maç ekle → Aylık Tablo'da görünür; toplam doğru
- [ ] "Excel indir" .xlsx açılıyor; "PDF olarak kaydet" penceresi tablo çıkarıyor
- [ ] İkinci bir hesapla giriş → birinci hesabın maçları görünmüyor (RLS)
- [ ] Admin olmayan hesap `/admin`'de "Yönetici değilsiniz" görüyor
- [ ] Admin hesabı ücret değiştirince yeni maçlar yeni ücreti kullanıyor; eski maçlar bozulmuyor

## Notlar

- `.env` Git'e gitmez (gitignore); Vercel'e ortam değişkeni olarak verilir.
- Anon key herkese açıktır; güvenlik RLS aracılığıyladır. `service_role` key'i hiçbir yere koymayın.
- Şifre sıfırlama Supabase varsayılan e-posta gönderici ile sınırlıdır (ücretsizde saatte ~2-4); büyüdüğünde Resend/Postmark SMTP bağlayın.
