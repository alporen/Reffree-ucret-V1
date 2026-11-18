import { z } from 'zod';

/** Zod 4'te coerce kullanmak resolver tipleşmesini kırıyor (input ≠ output);
 *  bu yüzden form alanları metin, gönderimde sayıya çevrilir.
 *  Yol kademesi de string ("" = yol ücreti yok) olarak taşınır; böylece Controller tipiyle uyuşur. */
export const matchSchema = z.object({
  match_date: z.string().min(1, 'Tarih seçin'),
  category_id: z.string().min(1, 'Maç türü seçin'),
  season_id: z.string().min(1, 'Sezon gerekli'),
  role: z.enum(['referee', 'assistant', 'fourth']),
  venue: z.enum(['home', 'away']),
  second_same_day: z.boolean(),
  travel_band_id: z.string(), // "" = yol ücreti yok
  travel_fee: z.string().refine((v) => v !== '' && !isNaN(Number(v)) && Number(v) >= 0, { message: 'Yol ücreti 0 veya daha büyük olmalı' }),
  harcirah: z.string().refine((v) => v !== '' && !isNaN(Number(v)) && Number(v) >= 0, { message: 'Harcırah 0 veya daha büyük olmalı' }),
});

export type MatchFormValues = z.infer<typeof matchSchema>;
