/** Para ve tarih biçimleme (tr-TR). */

const tlFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function tl(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return tlFormatter.format(v);
}

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function monthName(monthIndex0: number): string {
  return MONTHS[monthIndex0] ?? '';
}

/** 2026-11-18 → "18.11.2026"; ai kullanılmayanlar 0'lanır. Geçersiz girişte "" döner. */
export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** ISO string'i YYYY-MM'lik anahtara çevirir (ay gruplama için). */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Arama benzersizliği için: trim + küçük harf; @ içeriyor mu? */
export function normalizeLogin(raw: string): { value: string; isEmail: boolean } {
  const v = raw.trim().toLowerCase();
  return { value: v, isEmail: v.includes('@') };
}
