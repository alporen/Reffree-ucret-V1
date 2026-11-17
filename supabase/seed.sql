-- Hakem Ücret Takibi — 2026-2027 tohum verisi
-- schema.sql'den SONRA, bir kere çalıştırın.
-- Kaynak: rates.json (legacy girdiler dahil değil).

insert into public.seasons (label) values ('2026-2027')
on conflict (label) do nothing;

with s as (select id from public.seasons where label = '2026-2027')
insert into public.fee_categories (season_id, key, label, referee, assistant, fourth, sort_order)
select s.id, v.key, v.label, v.referee, v.assistant, v.fourth, v.ord
from s
join (values
  ('paf_u19',     'PAF U19',                                2200.00, 1300.00, 1040.00, 10),
  ('women_sl',    'Kadın SL',                                1620.00,  970.00,  810.00, 20),
  ('futsal',      'Futsal',                                  1620.00,  970.00,  810.00, 30),
  ('beach',       'Plaj',                                    1620.00,  970.00,  810.00, 40),
  ('sal',         'SAL',                                     1300.00,  780.00,  650.00, 50),
  ('league_1k',   '1K',                                      1300.00,  780.00,  650.00, 60),
  ('league_2k',   '2K',                                      1300.00,  780.00,  650.00, 70),
  ('women_1',     'Kadınlar 1. Ligi',                        1300.00,  780.00,  650.00, 80),
  ('women_2',     'Kadınlar 2. Ligi',                        1300.00,  780.00,  650.00, 90),
  ('women_3',     'Kadınlar 3. Ligi',                        1300.00,  780.00,  650.00, 100),
  ('u19',         'U19',                                     1165.00,  710.00,  585.00, 110),
  ('u18',         'U18',                                     1165.00,  710.00,  585.00, 120),
  ('u17',         'U17',                                     1165.00,  710.00,  585.00, 130),
  ('u16',         'U16',                                     1165.00,  710.00,  585.00, 140),
  ('u15',         'U15',                                     1165.00,  710.00,  585.00, 150),
  ('deaf',        'İşitme Engelliler',                       1165.00,  710.00,  585.00, 160),
  ('u14',         'U14',                                     1040.00,  650.00,  520.00, 170),
  ('u13',         'U13',                                     1040.00,  650.00,  520.00, 180),
  ('u12',         'U12',                                     1040.00,  650.00,  520.00, 190),
  ('u11',         'U11',                                     1040.00,  650.00,  520.00, 200),
  ('u10',         'U10',                                     1040.00,  650.00,  520.00, 210),
  ('futsal_il',   'Futsal İl',                               650.00,   450.00,    0.00, 220),
  ('beach_il',    'Plaj İl',                                 650.00,   450.00,    0.00, 230),
  ('indoor',      'Halı Saha',                               650.00,   450.00,    0.00, 240),
  ('tournament',  'Özel Turnuvalar',                         650.00,   450.00,    0.00, 250)
) as v(key, label, referee, assistant, fourth, ord)
on conflict (season_id, key) do nothing;

with s as (select id from public.seasons where label = '2026-2027')
insert into public.travel_bands (season_id, code, label, min_km, max_km, fee)
select s.id, v.code, v.label, v.min_km, v.max_km, v.fee
from s
join (values
  ('1', '0–20 km',    0,   20,   460.00),
  ('2', '21–50 km',   21,  50,   550.00),
  ('3', '51–75 km',   51,  75,   650.00),
  ('4', '76–100 km',  76,  100,  830.00),
  ('5', '101–199 km', 101, 199, 1382.00),
  ('6', '200+ km',    200, null, 3202.00)
) as v(code, label, min_km, max_km, fee)
on conflict (season_id, code) do nothing;
