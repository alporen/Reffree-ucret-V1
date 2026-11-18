import { useEffect, useState } from 'react';
import { readSeasons } from './matches';
import type { Season } from './types';

export const SEASON_KEY = 'hakem-sezon';

/** Aynı sekmedeki tüm useSeason örneklerini senkronlamak için özel olay. */
const SEZON_OLAYI = 'hakem-sezon-degisti';

function okuKayitliSezon(): number | null {
  try {
    const v = localStorage.getItem(SEASON_KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

/** Sezon tercihini localStorage'da saklar; Ayarlar, Profil ve Profil menüsü paylaşır. */
export function useSeason() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [sezonId, setSezonId] = useState<number | null>(() => okuKayitliSezon());
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    readSeasons().then(({ data }) => {
      setSeasons(data);
      const kayitli = okuKayitliSezon();
      setSezonId((mevcut) => mevcut ?? kayitli ?? data[0]?.id ?? null);
      setYukleniyor(false);
    });

    // Başka bir bileşen (ör. profil menüsü) sezonu değiştirdiğinde güncelle
    const onOlay = (e: Event) => {
      const detay = (e as CustomEvent<number>).detail;
      if (typeof detay === 'number') setSezonId(detay);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === SEASON_KEY) setSezonId(e.newValue ? Number(e.newValue) : null);
    };
    window.addEventListener(SEZON_OLAYI, onOlay);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SEZON_OLAYI, onOlay);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  function setSezon(id: number) {
    setSezonId(id);
    try {
      localStorage.setItem(SEASON_KEY, String(id));
    } catch {
      /* yok say */
    }
    window.dispatchEvent(new CustomEvent<number>(SEZON_OLAYI, { detail: id }));
  }

  return { seasons, sezonId, setSezon, yukleniyor };
}
