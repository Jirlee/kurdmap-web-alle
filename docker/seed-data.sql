-- ============================================================================
-- KurdMap — Test Data Seed Script
-- For Podman / Docker development database
-- Usage: make seed   (runs after containers + migrations are up)
--    or: podman exec -i kurdmap-postgres psql -U postgres -d kurdmap_dev < docker/seed-data.sql
-- ============================================================================
-- IMPORTANT: Run this AFTER the API container has started and applied
-- EF Core migrations. The API creates tables on startup automatically.
-- ============================================================================

-- ─── Test Businesses ──────────────────────────────────────────────────────────

INSERT INTO businesses (
  "Id", "Slug", "CategoryId", "Status", "IsVerified", "IsFeatured", "Phone", "Email", "Website", "OwnerId",
  "CreatedAt", "UpdatedAt",
  name_ku, name_kmr, name_de, name_en,
  description_ku, description_kmr, description_de, description_en,
  street, postal_code, city_id,
  latitude, longitude)
VALUES
  -- 1. Kurdish Restaurant in Cologne
  ('b1b1b1b1-0001-0001-0001-000000000001', 'restaurant-kurdistan-koeln',
   'd1a1b2c3-0001-0001-0001-000000000001', 1, true, true,
   '+49 221 1234567', 'info@kurdistan-koeln.de', 'https://kurdistan-koeln.de', NULL,
   NOW(), NOW(),
   'چێشتخانەی کوردستان', 'Xwaringeha Kurdistan', 'Restaurant Kurdistan', 'Kurdistan Restaurant',
   'باشترین خواردنی کوردی لە کۆڵن', 'Xwarina Kurdî ya herî baş li Köln', 'Bestes kurdisches Essen in Köln', 'Best Kurdish food in Cologne',
   'Ehrenstraße 45', '50672', 'c1c1c1c1-0001-0001-0001-000000000001',
   50.9380, 6.9470),

  -- 2. Kurdish Grocery in Cologne
  ('b1b1b1b1-0001-0001-0001-000000000002', 'bazar-azadi-koeln',
   'd1a1b2c3-0001-0001-0001-000000000002', 1, true, true,
   '+49 221 9876543', 'bazar@azadi.de', NULL, NULL,
   NOW(), NOW(),
   'بازاڕی ئازادی', 'Bazara Azadî', 'Azadi Markt', 'Azadi Market',
   'هەموو کەلوپەلی خواردنی کوردی', 'Hemû tiştên xwarina Kurdî', 'Alle kurdischen Lebensmittel', 'All Kurdish groceries',
   'Keupstraße 12', '51063', 'c1c1c1c1-0001-0001-0001-000000000001',
   50.9590, 6.9820),

  -- 3. Kurdish Barber in Düsseldorf
  ('b1b1b1b1-0001-0001-0001-000000000003', 'barber-soran-duesseldorf',
   'd1a1b2c3-0001-0001-0001-000000000003', 1, true, false,
   '+49 211 5551234', 'soran@barber.de', NULL, NULL,
   NOW(), NOW(),
   'دەلاکی سۆران', 'Berbera Soran', 'Friseur Soran', 'Barber Soran',
   'باشترین شوێنی سەرتاشی لە دۆسڵدۆرف', 'Cihê herî baş ji bo sertaşê li Düsseldorf', 'Der beste Friseur in Düsseldorf', 'Best barber in Düsseldorf',
   'Bolkerstraße 22', '40213', 'c1c1c1c1-0001-0001-0001-000000000002',
   51.2275, 6.7740),

  -- 4. Kurdish Bakery in Cologne
  ('b1b1b1b1-0001-0001-0001-000000000004', 'nan-kurd-koeln',
   'd1a1b2c3-0001-0001-0001-000000000004', 1, false, false,
   '+49 221 4443322', NULL, NULL, NULL,
   NOW(), NOW(),
   'نانەوای کوردی', 'Firna Kurdî', 'Kurdische Bäckerei', 'Kurdish Bakery',
   'نانی تازەی کوردی هەموو ڕۆژ', 'Nanê teze yê Kurdî her roj', 'Frisches kurdisches Brot jeden Tag', 'Fresh Kurdish bread every day',
   'Venloer Str. 88', '50823', 'c1c1c1c1-0001-0001-0001-000000000001',
   50.9430, 6.9240),

  -- 5. Kurdish Travel Agency in Cologne (pending)
  ('b1b1b1b1-0001-0001-0001-000000000005', 'geshtu-guzer-koeln',
   'd1a1b2c3-0001-0001-0001-000000000005', 0, false, false,
   '+49 221 7778899', 'info@geshtu-guzer.de', 'https://geshtu-guzer.de', NULL,
   NOW(), NOW(),
   'ئاژانسی گەشتوگوزاری هەولێر', 'Ajansa rêwîtiyê ya Hewlêr', 'Reisebüro Erbil', 'Erbil Travel Agency',
   'گەشت بۆ کوردستان و ئەوروپا', 'Rêwîtî bo Kurdistan û Ewropa', 'Reisen nach Kurdistan und Europa', 'Travel to Kurdistan and Europe',
   'Aachener Str. 200', '50931', 'c1c1c1c1-0001-0001-0001-000000000001',
   50.9340, 6.9130),

  -- 6. Kurdish Doctor in Düsseldorf
  ('b1b1b1b1-0001-0001-0001-000000000006', 'dr-kawa-duesseldorf',
   'd1a1b2c3-0001-0001-0001-000000000006', 1, true, false,
   '+49 211 3334455', 'dr.kawa@praxis.de', NULL, NULL,
   NOW(), NOW(),
   'دکتۆر کاوە', 'Dr. Kawa', 'Dr. Kawa — Allgemeinmedizin', 'Dr. Kawa — General Practice',
   'پزیشکی گشتی بۆ هاوڵاتیانی کورد', 'Bijîşkiya giştî ji bo hemwelatiyên Kurd', 'Allgemeinmedizin für kurdische Mitbürger', 'General medicine for Kurdish community',
   'Friedrichstraße 10', '40217', 'c1c1c1c1-0001-0001-0001-000000000002',
   51.2180, 6.7780),

  -- 7. Kurdish Lawyer in Cologne
  ('b1b1b1b1-0001-0001-0001-000000000007', 'parizer-shwan-koeln',
   'd1a1b2c3-0001-0001-0001-000000000007', 1, true, false,
   '+49 221 8889900', 'shwan@anwalt.de', 'https://anwalt-shwan.de', NULL,
   NOW(), NOW(),
   'پارێزەر شوان', 'Parêzer Şwan', 'Rechtsanwalt Shwan', 'Lawyer Shwan',
   'یاسازانی بوارەکانی پەنابەری و خێزان', 'Zanyarê hiqûqê di warê penaberiyê û malbatê de', 'Spezialist für Asyl- und Familienrecht', 'Specialist in asylum and family law',
   'Hohenzollernring 50', '50672', 'c1c1c1c1-0001-0001-0001-000000000001',
   50.9410, 6.9400),

  -- 8. Real Estate in Cologne (pending)
  ('b1b1b1b1-0001-0001-0001-000000000008', 'immobilien-dilan-koeln',
   'd1a1b2c3-0001-0001-0001-000000000008', 0, false, false,
   '+49 221 1112233', NULL, NULL, NULL,
   NOW(), NOW(),
   'خانووبەرەی دیلان', 'Xanî û milkê Dîlan', 'Immobilien Dilan', 'Dilan Real Estate',
   'فرۆشتن و بەکرێدانی خانوو لە کۆڵن', 'Firotin û kirêdana xaniyan li Köln', 'Verkauf und Vermietung in Köln', 'Sales and rental in Cologne',
   'Neumarkt 1', '50667', 'c1c1c1c1-0001-0001-0001-000000000001',
   50.9350, 6.9500)
ON CONFLICT ("Id") DO NOTHING;

-- ─── Test Menu Items ──────────────────────────────────────────────────────────

INSERT INTO menu_items (
  "Id", "BusinessId", "Price", "ImageUrl", "SortOrder", "CreatedAt", "UpdatedAt",
  name_ku, name_kmr, name_de, name_en,
  description_ku, description_kmr, description_de, description_en)
VALUES
  ('a0a0a0a0-0001-0001-0001-000000000001', 'b1b1b1b1-0001-0001-0001-000000000001',
   12.50, NULL, 1, NOW(), NOW(),
   'کەباب', 'Kebab', 'Kebab', 'Kebab',
   'کەبابی کوردی لەگەڵ نان و سەلاتە', 'Kebabê Kurdî bi nan û salate', 'Kurdischer Kebab mit Brot und Salat', 'Kurdish kebab with bread and salad'),
  ('a0a0a0a0-0001-0001-0001-000000000002', 'b1b1b1b1-0001-0001-0001-000000000001',
   9.90, NULL, 2, NOW(), NOW(),
   'دۆلمە', 'Dolma', 'Dolma', 'Dolma',
   'دۆلمەی کوردی تازە', 'Dolma Kurdî ya teze', 'Frische kurdische Dolma', 'Fresh Kurdish dolma'),
  ('a0a0a0a0-0001-0001-0001-000000000003', 'b1b1b1b1-0001-0001-0001-000000000001',
   3.50, NULL, 3, NOW(), NOW(),
   'چای کوردی', 'Çayê Kurdî', 'Kurdischer Tee', 'Kurdish Tea',
   'چای گەرمی کوردی', 'Çayê germ ê Kurdî', 'Heißer kurdischer Tee', 'Hot Kurdish tea')
ON CONFLICT ("Id") DO NOTHING;

-- ─── Test Business Services ───────────────────────────────────────────────────

INSERT INTO business_services (
  "Id", "BusinessId", "Price", "SortOrder", "CreatedAt", "UpdatedAt",
  name_ku, name_kmr, name_de, name_en,
  description_ku, description_kmr, description_de, description_en)
VALUES
  ('b0b0b0b0-0001-0001-0001-000000000001', 'b1b1b1b1-0001-0001-0001-000000000003',
   15.00, 1, NOW(), NOW(),
   'سەرتاشی مەردانە', 'Sertaşa mêran', 'Herrenhaarschnitt', 'Men''s Haircut',
   'سەرتاشی تەواو بۆ پیاوان', 'Sertaşa tam ji bo mêran', 'Kompletter Haarschnitt für Herren', 'Complete haircut for men'),
  ('b0b0b0b0-0001-0001-0001-000000000002', 'b1b1b1b1-0001-0001-0001-000000000003',
   10.00, 2, NOW(), NOW(),
   'ڕیشتاشی', 'Rîhtaşî', 'Bartrasur', 'Beard Trim',
   'ڕیشتاشی بە پڕۆفیشناڵ', 'Rîhtaşî bi profesyonel', 'Professionelle Bartrasur', 'Professional beard trim')
ON CONFLICT ("Id") DO NOTHING;

-- ─── Test Advertisements ──────────────────────────────────────────────────────

INSERT INTO advertisements (
  "Id", "ImageUrl", "LinkUrl", "BusinessId", "StartDate", "EndDate", "IsActive", "SortOrder",
  "CreatedAt", "UpdatedAt",
  title_ku, title_kmr, title_de, title_en,
  description_ku, description_kmr, description_de, description_en)
VALUES
  ('a1a1a1a1-0001-0001-0001-000000000001',
   '/assets/ads/restaurant-kurdistan.jpg', '/business/restaurant-kurdistan-koeln',
   'b1b1b1b1-0001-0001-0001-000000000001',
   NOW() - INTERVAL '7 days', NOW() + INTERVAL '60 days', true, 1, NOW(), NOW(),
   'داشکاندنی نوێ!', 'Dakêşana nû!', 'Neues Angebot!', 'New Offer!',
   'داشکاندنی ٪۲۰ بۆ هەموو خواردنەکان', 'Dakêşana %20 ji bo hemû xwarinan', '20% Rabatt auf alle Speisen', '20% discount on all dishes'),
  ('a1a1a1a1-0001-0001-0001-000000000002',
   '/assets/ads/barber-soran.jpg', '/business/barber-soran-duesseldorf',
   'b1b1b1b1-0001-0001-0001-000000000003',
   NOW() - INTERVAL '3 days', NOW() + INTERVAL '30 days', true, 2, NOW(), NOW(),
   'سەرتاشی ڕۆژانەی جوان', 'Sertaşa rojane ya xweş', 'Stylischer Haarschnitt', 'Stylish Haircut',
   'پاشەکۆی تایبەت بۆ قوتابیان', 'Paşekoya taybet ji bo xwendekaran', 'Sonderrabatt für Studenten', 'Special discount for students'),
  ('a1a1a1a1-0001-0001-0001-000000000003',
   '/assets/ads/general-ad.jpg', 'https://kurdmap.de',
   NULL,
   NOW() + INTERVAL '10 days', NOW() + INTERVAL '100 days', false, 3, NOW(), NOW(),
   'بۆ هەموو کوردان لە ئەڵمانیا', 'Ji bo hemû Kurdan li Almanyayê', 'Für alle Kurden in Deutschland', 'For all Kurds in Germany',
   'کوردمپ — پلاتفۆرمی کوردان لە ئەوروپا', 'KurdMap — platforma Kurdan li Ewropa', 'KurdMap — Plattform der Kurden in Europa', 'KurdMap — Platform for Kurds in Europe')
ON CONFLICT ("Id") DO NOTHING;

-- ─── Test Reviews ─────────────────────────────────────────────────────────────
-- Note: UserId uses a placeholder UUID. Replace with real user IDs after admin seed.

INSERT INTO reviews (
  "Id", "BusinessId", "UserId", "Rating", "Comment", "IsApproved", "CreatedAt", "UpdatedAt")
VALUES
  ('c0c0c0c0-0001-0001-0001-000000000001',
   'b1b1b1b1-0001-0001-0001-000000000001',
   '00000000-0000-0000-0000-000000000001',
   5, 'خواردنەکەی زۆر خۆش بوو — باشترین کەباب لە کۆڵن!', true, NOW() - INTERVAL '14 days', NOW()),
  ('c0c0c0c0-0001-0001-0001-000000000002',
   'b1b1b1b1-0001-0001-0001-000000000001',
   '00000000-0000-0000-0000-000000000002',
   4, 'Sehr lecker! Das Brot ist frisch und der Service ist freundlich.', true, NOW() - INTERVAL '10 days', NOW()),
  ('c0c0c0c0-0001-0001-0001-000000000003',
   'b1b1b1b1-0001-0001-0001-000000000001',
   '00000000-0000-0000-0000-000000000003',
   3, 'Good food but the waiting time was a bit long.', true, NOW() - INTERVAL '5 days', NOW()),
  ('c0c0c0c0-0001-0001-0001-000000000004',
   'b1b1b1b1-0001-0001-0001-000000000003',
   '00000000-0000-0000-0000-000000000001',
   5, 'باشترین سەرتاشی — زۆر ڕازیم!', true, NOW() - INTERVAL '20 days', NOW()),
  ('c0c0c0c0-0001-0001-0001-000000000005',
   'b1b1b1b1-0001-0001-0001-000000000006',
   '00000000-0000-0000-0000-000000000002',
   5, 'Dr. Kawa ist sehr kompetent und freundlich. Empfehle ich!', true, NOW() - INTERVAL '7 days', NOW()),
  ('c0c0c0c0-0001-0001-0001-000000000006',
   'b1b1b1b1-0001-0001-0001-000000000002',
   '00000000-0000-0000-0000-000000000003',
   4, NULL, false, NOW() - INTERVAL '2 days', NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ─── Test Favorites ───────────────────────────────────────────────────────────

INSERT INTO favorites ("Id", "BusinessId", "UserId", "CreatedAt", "UpdatedAt")
VALUES
  ('f1f1f1f1-0001-0001-0001-000000000001',
   'b1b1b1b1-0001-0001-0001-000000000001',
   '00000000-0000-0000-0000-000000000001',
   NOW(), NOW()),
  ('f1f1f1f1-0001-0001-0001-000000000002',
   'b1b1b1b1-0001-0001-0001-000000000003',
   '00000000-0000-0000-0000-000000000001',
   NOW(), NOW()),
  ('f1f1f1f1-0001-0001-0001-000000000003',
   'b1b1b1b1-0001-0001-0001-000000000006',
   '00000000-0000-0000-0000-000000000002',
   NOW(), NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ─── Summary ──────────────────────────────────────────────────────────────────
-- Total seeded:
--   8 Businesses (6 verified, 2 pending)
--   3 Menu Items (Restaurant Kurdistan)
--   2 Business Services (Barber Soran)
--   3 Advertisements (2 active, 1 inactive/future)
--   6 Reviews (5 approved, 1 pending)
--   3 Favorites
-- ============================================================================
