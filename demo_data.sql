-- ============================================================================
-- DEMO DATA cho PetClinic — chuẩn bị dữ liệu quay video demo
--
-- THỨ TỰ CHẠY TRÊN NEON:
--   1. Import pawcare.sql trước (nếu DB chưa có dữ liệu gốc)
--   2. Chạy file này sau
-- Dán vào Neon SQL Editor, hoặc: psql "<connection-string>" -f demo_data.sql
--
-- Script an toàn khi chạy lại nhiều lần. Mọi INSERT đều tự kiểm tra
-- bản ghi liên quan có tồn tại không nên không vỡ khoá ngoại.
--
-- Tài khoản đăng nhập sau khi chạy:
--   admin@petclinic.com  / admin123
--   doctor@petclinic.com / doctor123
--   test@example.com     / password123
--   duongproduction29@gmail.com (đăng nhập Google như cũ)
-- ============================================================================

-- ============================================================
-- 1. USERS — mã hoá mật khẩu BCrypt (backend dùng BCryptPasswordEncoder,
--    plaintext trong dump sẽ KHÔNG đăng nhập được) + kích hoạt tài khoản
-- ============================================================
UPDATE users SET
  password = '$2a$10$j0XHRIhdgUH0jEcGudwMNelCyQVDq/PRWTprVP3Zrv2ecCuT4cPwC',
  status   = 'ACTIVE',
  phone    = COALESCE(phone, '0901234567'),
  address  = COALESCE(address, '123 Nguyễn Văn Cừ, Quận 5, TP.HCM')
WHERE email = 'admin@petclinic.com';

UPDATE users SET
  password = '$2a$10$8K7dMrMwbrYXcqi.apjKCeIWQIlnu5R/g0N8AljbRblETVMvRCERy',
  status   = 'ACTIVE',
  phone    = COALESCE(phone, '0907654321'),
  address  = COALESCE(address, '45 Lý Thường Kiệt, Quận 10, TP.HCM')
WHERE email = 'doctor@petclinic.com';

UPDATE users SET
  password = '$2a$10$biicsJ3roNbPuAhG1cbLu.WKjlwsvX/t08mgdH2VHi3DtQM7tDybu',
  status   = 'ACTIVE'
WHERE email = 'test@example.com';

UPDATE users SET
  status  = 'ACTIVE',
  phone   = COALESCE(phone, '0912345678'),
  address = COALESCE(address, '279 Nguyễn Tri Phương, Quận 10, TP.HCM')
WHERE email = 'duongproduction29@gmail.com';

-- ============================================================
-- 2. PETS — đổi tên/giống test cho chuyên nghiệp + thêm pet đa dạng loài
-- ============================================================
UPDATE pets SET name = 'Zom', breed = 'Corgi',     notes = 'Hiếu động, thân thiện với người lạ' WHERE id = 1;
UPDATE pets SET name = 'Ki',  breed = 'Poodle',    notes = 'Hơi nhát, cần nhẹ nhàng khi khám'   WHERE id = 2;
UPDATE pets SET name = 'Lu',  breed = 'Chihuahua', notes = 'Đã tiêm phòng dại đầy đủ'           WHERE id = 3;

INSERT INTO pets (id, age, weight, created_at, updated_at, user_id, breed, gender, image_url, name, notes, species)
SELECT v.* FROM (VALUES
  (4::int8, 2, 4::float8,   '2026-07-10 09:15:00'::timestamp, '2026-07-10 09:15:00'::timestamp, 4::int8, 'Mèo Anh lông ngắn', 'FEMALE', '/assets/default-cat.svg',     'Mimi', 'Rất thích được vuốt ve',        'CAT'),
  (5::int8, 1, 2::float8,   '2026-07-12 14:20:00'::timestamp, '2026-07-12 14:20:00'::timestamp, 4::int8, 'Thỏ Hà Lan',        'FEMALE', '/assets/default-rabbit.svg',  'Bông', 'Ăn chủ yếu cỏ timothy',         'RABBIT'),
  (6::int8, 1, 0.5::float8, '2026-07-15 10:05:00'::timestamp, '2026-07-15 10:05:00'::timestamp, 4::int8, 'Hamster Bear',      'MALE',   '/assets/default-hamster.svg', 'Bin',  'Hay tích trữ thức ăn trong má', 'HAMSTER')
) AS v(id, age, weight, created_at, updated_at, user_id, breed, gender, image_url, name, notes, species)
WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = v.user_id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. MEDICAL RECORDS — điền nội dung khám cho 12 bệnh án
--    (record 13 thuộc lịch PENDING chưa khám nên giữ trống)
-- ============================================================
UPDATE medical_records SET diagnosis = 'Sức khoẻ ổn định, đủ điều kiện lưu trú qua đêm', treatment = 'Theo dõi ăn uống và vận động trong thời gian lưu trú, kết hợp huấn luyện lệnh cơ bản', prescription = 'Không cần dùng thuốc', notes = 'Bé hợp tác tốt trong buổi huấn luyện đầu tiên', follow_up_date = NULL WHERE appointment_id = 1;
UPDATE medical_records SET diagnosis = 'Thể trạng tốt, hơi nhút nhát khi tiếp xúc môi trường mới', treatment = 'Lưu trú qua đêm kết hợp làm quen dần với huấn luyện viên', prescription = 'Không cần dùng thuốc', notes = 'Khuyến nghị chủ nuôi duy trì bài tập lệnh "ngồi", "lại đây" tại nhà', follow_up_date = NULL WHERE appointment_id = 2;
UPDATE medical_records SET diagnosis = 'Viêm da dị ứng nhẹ vùng bụng, kết quả siêu âm và xét nghiệm máu bình thường', treatment = 'Vệ sinh vùng da viêm bằng dung dịch sát khuẩn, theo dõi 1 tuần', prescription = 'Apoquel 5.4mg — 1 viên/ngày x 7 ngày; dầu tắm dược liệu 2 lần/tuần', notes = 'Nghi dị ứng thức ăn, khuyến nghị đổi sang hạt không ngũ cốc', follow_up_date = '2026-04-29' WHERE appointment_id = 3;
UPDATE medical_records SET diagnosis = 'Sức khoẻ bình thường, các chỉ số máu trong ngưỡng cho phép', treatment = 'Không cần can thiệp, duy trì chế độ ăn hiện tại', prescription = 'Không cần dùng thuốc', notes = 'Hẹn kiểm tra định kỳ 6 tháng/lần', follow_up_date = NULL WHERE appointment_id = 4;
UPDATE medical_records SET diagnosis = 'Khoẻ mạnh, đủ điều kiện tiêm chủng', treatment = 'Tiêm vaccine 5 bệnh (mũi nhắc năm)', prescription = 'Theo dõi 24h sau tiêm, tránh tắm 3 ngày', notes = 'Không có phản ứng phụ sau 30 phút theo dõi tại phòng khám', follow_up_date = '2027-04-22' WHERE appointment_id = 5;
UPDATE medical_records SET diagnosis = 'Viêm ống tai ngoài nhẹ bên trái, đủ điều kiện tiêm chủng', treatment = 'Vệ sinh tai chuyên sâu, tiêm vaccine phòng dại', prescription = 'Dung dịch nhỏ tai Epi-Otic — nhỏ 2 lần/ngày x 5 ngày', notes = 'Tái khám nếu bé gãi tai nhiều hoặc có mùi hôi trở lại', follow_up_date = '2026-04-28' WHERE appointment_id = 6;
UPDATE medical_records SET diagnosis = 'Thể trạng tốt, phản xạ nhanh nhẹn, phù hợp chương trình huấn luyện nâng cao', treatment = 'Khám tổng quát kết hợp đánh giá đầu vào khoá huấn luyện', prescription = 'Không cần dùng thuốc', notes = 'Đề xuất lộ trình huấn luyện 8 buổi, mỗi tuần 2 buổi', follow_up_date = NULL WHERE appointment_id = 7;
UPDATE medical_records SET diagnosis = 'Da và lông khoẻ mạnh, không có ký sinh trùng ngoài da', treatment = 'Cắt tỉa lông toàn thân theo yêu cầu, vệ sinh móng', prescription = 'Không cần dùng thuốc', notes = 'Khuyến nghị chải lông hằng ngày để hạn chế rối lông', follow_up_date = NULL WHERE appointment_id = 8;
UPDATE medical_records SET diagnosis = 'Rối loạn tiêu hoá nhẹ do đổi thức ăn đột ngột', treatment = 'Điều chỉnh khẩu phần, chia nhỏ bữa ăn trong 5 ngày', prescription = 'Men vi sinh FortiFlora — 1 gói/ngày x 5 ngày', notes = 'Chuyển đổi thức ăn mới cần trộn dần trong 7-10 ngày', follow_up_date = '2026-05-06' WHERE appointment_id = 9;
UPDATE medical_records SET diagnosis = 'Thừa cân nhẹ (vượt chuẩn khoảng 10%)', treatment = 'Xây dựng chế độ ăn giảm cân, tăng vận động 30 phút/ngày', prescription = 'Hạt giảm cân chuyên dụng theo khẩu phần in kèm', notes = 'Mục tiêu giảm 1kg trong 2 tháng, cân lại mỗi lần tái khám', follow_up_date = '2026-06-29' WHERE appointment_id = 10;
UPDATE medical_records SET diagnosis = 'Tái khám tiêu hoá — hệ tiêu hoá đã ổn định', treatment = 'Duy trì men vi sinh thêm 3 ngày rồi ngưng', prescription = 'Men vi sinh FortiFlora — 1 gói/ngày x 3 ngày', notes = 'Bé ăn uống bình thường trở lại, phân đẹp', follow_up_date = NULL WHERE appointment_id = 11;
UPDATE medical_records SET diagnosis = 'Kiểm tra định kỳ — sức khoẻ tốt', treatment = 'Không cần can thiệp', prescription = 'Không cần dùng thuốc', notes = 'Duy trì lịch tẩy giun 3 tháng/lần', follow_up_date = NULL WHERE appointment_id = 12;

-- ============================================================
-- 4. APPOINTMENTS — dời lịch PENDING cũ về tương lai + thêm 2 lịch sắp tới
--    để demo màn hình "Lịch hẹn của tôi" và lịch làm việc của bác sĩ
-- ============================================================
UPDATE appointments SET
  appointment_date = '2026-07-27',
  appointment_time = '10:00:00',
  notes = 'Bé dạo này ăn ít, muốn kiểm tra tổng quát'
WHERE id = 13;

INSERT INTO appointments (appointment_date, appointment_time, created_at, doctor_id, id, pet_id, updated_at, user_id, booking_code, notes, status)
SELECT v.* FROM (VALUES
  ('2026-07-28'::date, '09:30:00'::time, '2026-07-22 10:15:00'::timestamp, NULL::int8, 14::int8, 4::int8, '2026-07-22 10:15:00'::timestamp, 4::int8, 'BK-20260722-101500-a1f2', 'Mimi lần đầu đi khám, mong bác sĩ nhẹ nhàng với bé', 'PENDING'),
  ('2026-07-31'::date, '15:00:00'::time, '2026-07-22 10:30:00'::timestamp, 3::int8,    15::int8, 1::int8, '2026-07-22 10:30:00'::timestamp, 4::int8, 'BK-20260722-103000-c3d4', 'Đặt combo tắm và cắt tỉa chuẩn bị đi chơi xa', 'CONFIRMED')
) AS v(appointment_date, appointment_time, created_at, doctor_id, id, pet_id, updated_at, user_id, booking_code, notes, status)
WHERE EXISTS (SELECT 1 FROM pets p WHERE p.id = v.pet_id)
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = v.user_id)
  AND (v.doctor_id IS NULL OR EXISTS (SELECT 1 FROM users d WHERE d.id = v.doctor_id))
ON CONFLICT (id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
SELECT v.appointment_id, v.service_id
FROM (VALUES (14::int8, 1::int8), (14::int8, 4::int8), (15::int8, 7::int8)) AS v(appointment_id, service_id)
WHERE EXISTS (SELECT 1 FROM appointments a WHERE a.id = v.appointment_id)
  AND EXISTS (SELECT 1 FROM pet_services ps WHERE ps.id = v.service_id)
  AND NOT EXISTS (
    SELECT 1 FROM appointment_services s
    WHERE s.appointment_id = v.appointment_id AND s.service_id = v.service_id
  );

-- Bệnh án trống đi kèm lịch mới (app tự tạo record rỗng khi đặt lịch)
INSERT INTO medical_records (follow_up_date, appointment_id, created_at, id, updated_at, diagnosis, notes, prescription, treatment)
SELECT v.* FROM (VALUES
  (NULL::date, 14::int8, '2026-07-22 10:15:00'::timestamp, 14::int8, '2026-07-22 10:15:00'::timestamp, '', '', '', ''),
  (NULL::date, 15::int8, '2026-07-22 10:30:00'::timestamp, 15::int8, '2026-07-22 10:30:00'::timestamp, '', '', '', '')
) AS v(follow_up_date, appointment_id, created_at, id, updated_at, diagnosis, notes, prescription, treatment)
WHERE EXISTS (SELECT 1 FROM appointments a WHERE a.id = v.appointment_id)
  AND NOT EXISTS (SELECT 1 FROM medical_records m WHERE m.appointment_id = v.appointment_id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. REVIEWS phòng khám — thay nội dung test bằng đánh giá thật
--    (hiển thị công khai ở mục Testimonials trang chủ)
-- ============================================================
UPDATE reviews SET comment = 'Dịch vụ ổn, bác sĩ tư vấn kỹ. Giá hơi cao một chút nhưng xứng đáng', rating = 4 WHERE id = 1;
UPDATE reviews SET comment = 'Phòng khám sạch sẽ, giá cả hợp lý, tay nghề bác sĩ chuyên nghiệp. 10 điểm!', rating = 5 WHERE id = 2;
UPDATE reviews SET comment = 'Bé nhà mình được tiêm phòng cẩn thận, theo dõi sau tiêm chu đáo', rating = 5 WHERE id = 3;
UPDATE reviews SET comment = 'Cắt tỉa lông đẹp đúng yêu cầu, bé về nhà thơm tho sạch sẽ', rating = 5 WHERE id = 4;
UPDATE reviews SET comment = 'Đặt lịch online tiện lợi, đến nơi không phải chờ lâu', rating = 4 WHERE id = 5;
UPDATE reviews SET comment = 'Bác sĩ khám kỹ và giải thích dễ hiểu, sẽ quay lại ủng hộ', rating = 5 WHERE id = 6;
UPDATE reviews SET comment = 'Hai bé nhà mình đều được chăm sóc tận tình, nhân viên thân thiện', rating = 5 WHERE id = 7;
UPDATE reviews SET comment = 'Dịch vụ tốt, có nhắc lịch tái khám qua hệ thống rất tiện', rating = 5 WHERE id = 8;

-- ============================================================
-- 6. PRODUCT REVIEWS — sửa nội dung test + thêm đánh giá sản phẩm
-- ============================================================
UPDATE product_reviews SET comment = 'Hạt thơm, bé nhà mình ăn rất hợp. Giao hàng nhanh', rating = 4 WHERE id = 1;
UPDATE product_reviews SET comment = 'Chất lượng tốt, đóng gói cẩn thận, sẽ mua lại', rating = 5 WHERE id = 2;

INSERT INTO product_reviews (id, created_at, updated_at, comment, rating, product_id, user_id)
SELECT v.* FROM (VALUES
  (3::int8, '2026-04-25 09:10:00'::timestamp, '2026-04-25 09:10:00'::timestamp, 'Pate mềm, mùi thơm, mèo nhà mình rất thích vị cá ngừ', 5, 8::int8,  4::int8),
  (4::int8, '2026-04-28 20:45:00'::timestamp, '2026-04-28 20:45:00'::timestamp, 'Vitamin dễ dùng, nhỏ vào nước là bé uống được luôn',   4, 62::int8, 4::int8),
  (5::int8, '2026-05-02 11:30:00'::timestamp, '2026-05-02 11:30:00'::timestamp, 'Sản phẩm chính hãng, giá tốt hơn ngoài cửa hàng',      5, 7::int8,  1::int8)
) AS v(id, created_at, updated_at, comment, rating, product_id, user_id)
WHERE EXISTS (SELECT 1 FROM products p WHERE p.id = v.product_id)
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = v.user_id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. ORDERS — địa chỉ giao hàng thật + COD đã giao thì coi như đã thanh toán
-- ============================================================
UPDATE orders SET shipping_address = '279 Nguyễn Tri Phương, Phường 4, Quận 10, TP.HCM', notes = 'Giao giờ hành chính',           contact_phone = COALESCE(contact_phone, '0912345678') WHERE id = 2;
UPDATE orders SET shipping_address = '279 Nguyễn Tri Phương, Phường 4, Quận 10, TP.HCM', notes = 'Gọi trước khi giao 15 phút',     contact_phone = COALESCE(contact_phone, '0912345678') WHERE id = 3;
UPDATE orders SET shipping_address = '45 Lý Thường Kiệt, Phường 8, Quận 10, TP.HCM',     notes = '',                               contact_phone = COALESCE(contact_phone, '0907654321') WHERE id = 4;
UPDATE orders SET shipping_address = '279 Nguyễn Tri Phương, Phường 4, Quận 10, TP.HCM', notes = 'Để hàng ở quầy lễ tân chung cư', contact_phone = COALESCE(contact_phone, '0912345678') WHERE id = 5;

UPDATE orders SET payment_status = 'PAID' WHERE payment_method = 'COD' AND status = 'DELIVERED' AND payment_status = 'PENDING';

-- ============================================================
-- 8. PRODUCTS — sửa sản phẩm test (id 2) thành sản phẩm thật
-- ============================================================
UPDATE products SET
  name        = 'Hạt cho chó Pedigree vị bò và rau củ',
  description = 'Thức ăn khô cho chó trưởng thành vị thịt bò kèm rau củ, cân bằng dinh dưỡng, hỗ trợ tiêu hoá',
  price       = 245000.00,
  brand       = 'Pedigree',
  material    = NULL,
  volume      = NULL,
  weight      = '3kg'
WHERE id = 2 AND description = '321321321312321';

-- ============================================================
-- 9. Bảng medical_record_images (tính năng nhiều ảnh bệnh án) —
--    dump cũ chưa có; tạo sẵn để không phụ thuộc Hibernate ddl-auto.
--    Ảnh thật upload lên Cloudinary qua giao diện role DOCTOR.
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_record_images (
  medical_record_id int8 NOT NULL REFERENCES medical_records(id),
  image_url text
);

-- ============================================================
-- 10. BỔ SUNG SỐ LƯỢNG LỚN DỮ LIỆU DEMO — gắn vào tài khoản test (id 1)
-- ============================================================

-- Đổi tên tài khoản test cho tự nhiên khi hiển thị ở review/testimonials
UPDATE users SET full_name = 'Trần Minh Anh' WHERE email = 'test@example.com' AND full_name = 'Test User';

-- ---------- 10a. PETS — 6 bé đủ loài cho tài khoản test ----------
INSERT INTO pets (id, age, weight, created_at, updated_at, user_id, breed, gender, image_url, name, notes, species)
SELECT v.* FROM (VALUES
  (7::int8,  3, 25::float8,   '2026-05-05 09:00:00'::timestamp, '2026-05-05 09:00:00'::timestamp, 1::int8, 'Golden Retriever',     'MALE',   '/assets/default-dog.svg',     'Milo',  'Thân thiện, rất thích chơi ném bóng',      'DOG'),
  (8::int8,  2, 3.5::float8,  '2026-05-05 09:05:00'::timestamp, '2026-05-05 09:05:00'::timestamp, 1::int8, 'Mèo ta',               'FEMALE', '/assets/default-cat.svg',     'Na',    'Kén ăn, chỉ thích pate cá ngừ',            'CAT'),
  (9::int8,  1, 0.04::float8, '2026-06-01 10:30:00'::timestamp, '2026-06-01 10:30:00'::timestamp, 1::int8, 'Vẹt Yến Phụng',        'MALE',   '/assets/default-bird.svg',    'Titi',  'Biết huýt sáo theo nhạc',                  'BIRD'),
  (10::int8, 1, 1.8::float8,  '2026-06-10 14:00:00'::timestamp, '2026-06-10 14:00:00'::timestamp, 1::int8, 'Thỏ Minilop',          'FEMALE', '/assets/default-rabbit.svg',  'Mochi', 'Thích gặm cà rốt và cỏ timothy',           'RABBIT'),
  (11::int8, 1, 0.05::float8, '2026-06-15 16:20:00'::timestamp, '2026-06-15 16:20:00'::timestamp, 1::int8, 'Hamster Winter White', 'FEMALE', '/assets/default-hamster.svg', 'Susu',  'Chạy bánh xe cả đêm',                      'HAMSTER'),
  (12::int8, 4, 22::float8,   '2026-07-01 08:45:00'::timestamp, '2026-07-01 08:45:00'::timestamp, 1::int8, 'Husky Sibir',          'MALE',   '/assets/default-dog.svg',     'Rex',   'Nhiều năng lượng, cần vận động mỗi ngày',  'DOG')
) AS v(id, age, weight, created_at, updated_at, user_id, breed, gender, image_url, name, notes, species)
WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = v.user_id)
ON CONFLICT (id) DO NOTHING;

-- ---------- 10b. APPOINTMENTS — 12 lịch hẹn đủ 4 trạng thái ----------
-- 8 COMPLETED (quá khứ) + 2 CONFIRMED + 1 PENDING (sắp tới) + 1 CANCELLED
INSERT INTO appointments (appointment_date, appointment_time, created_at, doctor_id, id, pet_id, updated_at, user_id, booking_code, notes, status)
SELECT v.* FROM (VALUES
  ('2026-05-12'::date, '09:00:00'::time, '2026-05-08 09:15:00'::timestamp, 3::int8,    16::int8, 7::int8,  '2026-05-12 11:00:00'::timestamp, 1::int8, 'BK-20260508-091500-d016', 'Tiêm nhắc vaccine hằng năm cho Milo',            'COMPLETED'),
  ('2026-05-20'::date, '10:30:00'::time, '2026-05-16 14:30:00'::timestamp, 3::int8,    17::int8, 8::int8,  '2026-05-20 12:00:00'::timestamp, 1::int8, 'BK-20260516-143000-d017', 'Na lười ăn mấy hôm nay',                          'COMPLETED'),
  ('2026-06-03'::date, '14:00:00'::time, '2026-05-30 08:45:00'::timestamp, 3::int8,    18::int8, 7::int8,  '2026-06-03 16:00:00'::timestamp, 1::int8, 'BK-20260530-084500-d018', 'Đặt tắm gội cho Milo',                            'COMPLETED'),
  ('2026-06-10'::date, '15:30:00'::time, '2026-06-06 10:15:00'::timestamp, 3::int8,    19::int8, 9::int8,  '2026-06-10 17:00:00'::timestamp, 1::int8, 'BK-20260606-101500-d019', 'Titi rụng lông nhiều bất thường',                 'COMPLETED'),
  ('2026-06-21'::date, '08:30:00'::time, '2026-06-17 16:00:00'::timestamp, 3::int8,    20::int8, 10::int8, '2026-06-21 10:30:00'::timestamp, 1::int8, 'BK-20260617-160000-d020', 'Khám định kỳ và xét nghiệm máu cho Mochi',        'COMPLETED'),
  ('2026-07-01'::date, '16:00:00'::time, '2026-06-27 09:30:00'::timestamp, 3::int8,    21::int8, 8::int8,  '2026-07-01 17:30:00'::timestamp, 1::int8, 'BK-20260627-093000-d021', 'Tiêm vaccine dại cho Na',                         'COMPLETED'),
  ('2026-07-08'::date, '09:30:00'::time, '2026-07-04 14:00:00'::timestamp, 3::int8,    22::int8, 12::int8, '2026-07-08 11:30:00'::timestamp, 1::int8, 'BK-20260704-140000-d022', 'Đăng ký khoá huấn luyện cơ bản cho Rex',          'COMPLETED'),
  ('2026-07-15'::date, '10:00:00'::time, '2026-07-11 08:45:00'::timestamp, 3::int8,    23::int8, 7::int8,  '2026-07-15 12:00:00'::timestamp, 1::int8, 'BK-20260711-084500-d023', 'Milo tiểu ít, muốn siêu âm kiểm tra',             'COMPLETED'),
  ('2026-07-26'::date, '09:00:00'::time, '2026-07-21 10:00:00'::timestamp, 3::int8,    24::int8, 8::int8,  '2026-07-21 10:00:00'::timestamp, 1::int8, 'BK-20260721-100000-d024', 'Cắt tỉa lông chuẩn bị hè cho Na',                 'CONFIRMED'),
  ('2026-07-29'::date, '14:30:00'::time, '2026-07-22 15:30:00'::timestamp, 3::int8,    25::int8, 12::int8, '2026-07-22 15:30:00'::timestamp, 1::int8, 'BK-20260722-153000-d025', 'Tiêm nhắc vaccine cho Rex',                       'CONFIRMED'),
  ('2026-08-01'::date, '10:30:00'::time, '2026-07-22 19:00:00'::timestamp, NULL::int8, 26::int8, 11::int8, '2026-07-22 19:00:00'::timestamp, 1::int8, 'BK-20260722-190000-d026', 'Susu lần đầu đi khám tổng quát',                  'PENDING'),
  ('2026-07-18'::date, '11:00:00'::time, '2026-07-14 11:30:00'::timestamp, NULL::int8, 27::int8, 9::int8,  '2026-07-16 09:00:00'::timestamp, 1::int8, 'BK-20260714-113000-d027', 'Bận việc đột xuất nên huỷ lịch',                  'CANCELLED')
) AS v(appointment_date, appointment_time, created_at, doctor_id, id, pet_id, updated_at, user_id, booking_code, notes, status)
WHERE EXISTS (SELECT 1 FROM pets p WHERE p.id = v.pet_id)
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = v.user_id)
  AND (v.doctor_id IS NULL OR EXISTS (SELECT 1 FROM users d WHERE d.id = v.doctor_id))
ON CONFLICT (id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
SELECT v.appointment_id, v.service_id
FROM (VALUES
  (16::int8, 1::int8), (16::int8, 2::int8),
  (17::int8, 1::int8),
  (18::int8, 5::int8),
  (19::int8, 1::int8),
  (20::int8, 1::int8), (20::int8, 4::int8),
  (21::int8, 2::int8),
  (22::int8, 11::int8),
  (23::int8, 3::int8), (23::int8, 4::int8),
  (24::int8, 6::int8),
  (25::int8, 2::int8),
  (26::int8, 1::int8),
  (27::int8, 8::int8)
) AS v(appointment_id, service_id)
WHERE EXISTS (SELECT 1 FROM appointments a WHERE a.id = v.appointment_id)
  AND EXISTS (SELECT 1 FROM pet_services ps WHERE ps.id = v.service_id)
  AND NOT EXISTS (
    SELECT 1 FROM appointment_services s
    WHERE s.appointment_id = v.appointment_id AND s.service_id = v.service_id
  );

-- ---------- 10c. MEDICAL RECORDS — bệnh án đầy đủ cho 8 lịch COMPLETED,
--             record trống cho 4 lịch chưa khám/đã huỷ ----------
INSERT INTO medical_records (follow_up_date, appointment_id, created_at, id, updated_at, diagnosis, notes, prescription, treatment)
SELECT v.* FROM (VALUES
  ('2027-05-12'::date, 16::int8, '2026-05-08 09:15:00'::timestamp, 16::int8, '2026-05-12 11:00:00'::timestamp, 'Khoẻ mạnh, đủ điều kiện tiêm chủng', 'Không phản ứng phụ sau 30 phút theo dõi', 'Theo dõi 24h sau tiêm, tránh tắm 3 ngày', 'Khám tổng quát và tiêm vaccine 7 bệnh mũi nhắc năm'),
  ('2026-06-20'::date, 17::int8, '2026-05-16 14:30:00'::timestamp, 17::int8, '2026-05-20 12:00:00'::timestamp, 'Viêm nướu nhẹ do cao răng, là nguyên nhân lười ăn', 'Khuyến nghị lấy cao răng trong lần tái khám tới', 'Gel vệ sinh răng miệng — bôi 1 lần/ngày x 10 ngày', 'Vệ sinh răng miệng, hướng dẫn chải răng định kỳ'),
  (NULL::date,         18::int8, '2026-05-30 08:45:00'::timestamp, 18::int8, '2026-06-03 16:00:00'::timestamp, 'Da lông khoẻ, không có ký sinh trùng ngoài da', 'Bé hợp tác tốt trong suốt quá trình tắm', 'Không cần dùng thuốc', 'Tắm gội sấy khô, vệ sinh tai và cắt móng'),
  (NULL::date,         19::int8, '2026-06-06 10:15:00'::timestamp, 19::int8, '2026-06-10 17:00:00'::timestamp, 'Thiếu khoáng nhẹ khiến lông xơ và rụng', 'Khuyến nghị phơi nắng sáng 15 phút mỗi ngày', 'Khoáng bột trộn thức ăn — 2 lần/tuần x 4 tuần', 'Điều chỉnh khẩu phần, bổ sung khoáng chất và vitamin'),
  (NULL::date,         20::int8, '2026-06-17 16:00:00'::timestamp, 20::int8, '2026-06-21 10:30:00'::timestamp, 'Các chỉ số máu trong ngưỡng bình thường', 'Duy trì khẩu phần nhiều cỏ tươi và nước sạch', 'Không cần dùng thuốc', 'Khám tổng quát định kỳ, không cần can thiệp'),
  ('2027-07-01'::date, 21::int8, '2026-06-27 09:30:00'::timestamp, 21::int8, '2026-07-01 17:30:00'::timestamp, 'Đủ điều kiện tiêm chủng', 'Không phản ứng phụ sau 30 phút theo dõi tại phòng khám', 'Theo dõi 24h sau tiêm', 'Tiêm vaccine phòng dại mũi nhắc năm'),
  (NULL::date,         22::int8, '2026-07-04 14:00:00'::timestamp, 22::int8, '2026-07-08 11:30:00'::timestamp, 'Thể trạng tốt, phù hợp chương trình huấn luyện', 'Tiếp thu nhanh, đề xuất lộ trình 8 buổi', 'Không cần dùng thuốc', 'Buổi đánh giá và huấn luyện lệnh cơ bản đầu tiên'),
  ('2026-07-29'::date, 23::int8, '2026-07-11 08:45:00'::timestamp, 23::int8, '2026-07-15 12:00:00'::timestamp, 'Phát hiện sỏi bàng quang kích thước nhỏ qua siêu âm', 'Tái khám siêu âm kiểm tra sau 2 tuần', 'Thuốc hỗ trợ tan sỏi theo toa x 14 ngày, tăng lượng nước uống', 'Điều trị nội khoa, điều chỉnh chế độ ăn và nước uống'),
  (NULL::date,         24::int8, '2026-07-21 10:00:00'::timestamp, 24::int8, '2026-07-21 10:00:00'::timestamp, '', '', '', ''),
  (NULL::date,         25::int8, '2026-07-22 15:30:00'::timestamp, 25::int8, '2026-07-22 15:30:00'::timestamp, '', '', '', ''),
  (NULL::date,         26::int8, '2026-07-22 19:00:00'::timestamp, 26::int8, '2026-07-22 19:00:00'::timestamp, '', '', '', ''),
  (NULL::date,         27::int8, '2026-07-14 11:30:00'::timestamp, 27::int8, '2026-07-14 11:30:00'::timestamp, '', '', '', '')
) AS v(follow_up_date, appointment_id, created_at, id, updated_at, diagnosis, notes, prescription, treatment)
WHERE EXISTS (SELECT 1 FROM appointments a WHERE a.id = v.appointment_id)
  AND NOT EXISTS (SELECT 1 FROM medical_records m WHERE m.appointment_id = v.appointment_id)
ON CONFLICT (id) DO NOTHING;

-- ---------- 10d. REVIEWS phòng khám — 8 đánh giá cho các lịch đã hoàn thành ----------
INSERT INTO reviews (id, created_at, updated_at, booking_code, comment, rating, user_id)
SELECT v.* FROM (VALUES
  (9::int8,  '2026-05-12 18:00:00'::timestamp, '2026-05-12 18:00:00'::timestamp, 'BK-20260508-091500-d016', 'Bé Milo được khám và tiêm phòng rất kỹ, bác sĩ dặn dò chu đáo', 5, 1::int8),
  (10::int8, '2026-05-20 19:30:00'::timestamp, '2026-05-20 19:30:00'::timestamp, 'BK-20260516-143000-d017', 'Bác sĩ phát hiện sớm viêm nướu cho mèo nhà mình, rất có tâm', 5, 1::int8),
  (11::int8, '2026-06-03 20:00:00'::timestamp, '2026-06-03 20:00:00'::timestamp, 'BK-20260530-084500-d018', 'Tắm gội sạch thơm, nhân viên nhẹ nhàng với thú cưng', 4, 1::int8),
  (12::int8, '2026-06-10 21:00:00'::timestamp, '2026-06-10 21:00:00'::timestamp, 'BK-20260606-101500-d019', 'Hiếm chỗ nào khám cả chim cảnh, tư vấn dinh dưỡng rất chi tiết', 5, 1::int8),
  (13::int8, '2026-06-21 12:00:00'::timestamp, '2026-06-21 12:00:00'::timestamp, 'BK-20260617-160000-d020', 'Xét nghiệm nhanh, kết quả được giải thích dễ hiểu', 5, 1::int8),
  (14::int8, '2026-07-01 20:30:00'::timestamp, '2026-07-01 20:30:00'::timestamp, 'BK-20260627-093000-d021', 'Đặt lịch tiêm online rất tiện, đến nơi không phải chờ', 4, 1::int8),
  (15::int8, '2026-07-08 15:00:00'::timestamp, '2026-07-08 15:00:00'::timestamp, 'BK-20260704-140000-d022', 'Khoá huấn luyện cơ bản hiệu quả, Rex nghe lời hơn hẳn', 5, 1::int8),
  (16::int8, '2026-07-15 17:00:00'::timestamp, '2026-07-15 17:00:00'::timestamp, 'BK-20260711-084500-d023', 'Siêu âm phát hiện sỏi sớm, may mà đưa bé đi khám kịp thời', 5, 1::int8)
) AS v(id, created_at, updated_at, booking_code, comment, rating, user_id)
WHERE EXISTS (SELECT 1 FROM appointments a WHERE a.booking_code = v.booking_code)
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = v.user_id)
  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_code = v.booking_code)
ON CONFLICT (id) DO NOTHING;

-- ---------- 10e. ORDERS — 8 đơn hàng đủ trạng thái ----------
INSERT INTO orders (total_amount, created_at, id, updated_at, user_id, notes, order_number, payment_method, payment_status, shipping_address, status, contact_phone)
SELECT v.* FROM (VALUES
  (355000.00::numeric, '2026-05-15 10:20:00'::timestamp, 6::int8,  '2026-05-18 14:00:00'::timestamp, 1::int8, 'Giao giờ hành chính',            'ORD6',  'COD',     'PAID',    '123 Test Street, Quận 1, TP.HCM', 'DELIVERED',  '0123456789'),
  (416000.00::numeric, '2026-05-28 15:45:00'::timestamp, 7::int8,  '2026-05-31 09:30:00'::timestamp, 1::int8, '',                                'ORD7',  'BANKING', 'PAID',    '123 Test Street, Quận 1, TP.HCM', 'DELIVERED',  '0123456789'),
  (270000.00::numeric, '2026-06-08 09:10:00'::timestamp, 8::int8,  '2026-06-11 16:20:00'::timestamp, 1::int8, 'Gọi trước khi giao 15 phút',      'ORD8',  'COD',     'PAID',    '123 Test Street, Quận 1, TP.HCM', 'DELIVERED',  '0123456789'),
  (621000.00::numeric, '2026-06-20 20:30:00'::timestamp, 9::int8,  '2026-06-24 11:00:00'::timestamp, 1::int8, '',                                'ORD9',  'BANKING', 'PAID',    '123 Test Street, Quận 1, TP.HCM', 'DELIVERED',  '0123456789'),
  (225000.00::numeric, '2026-07-02 14:15:00'::timestamp, 10::int8, '2026-07-21 08:00:00'::timestamp, 1::int8, '',                                'ORD10', 'BANKING', 'PAID',    '123 Test Street, Quận 1, TP.HCM', 'SHIPPED',    '0123456789'),
  (140000.00::numeric, '2026-07-12 11:40:00'::timestamp, 11::int8, '2026-07-22 10:30:00'::timestamp, 1::int8, 'Để hàng ở quầy lễ tân',           'ORD11', 'COD',     'PENDING', '123 Test Street, Quận 1, TP.HCM', 'PROCESSING', '0123456789'),
  (190000.00::numeric, '2026-07-20 19:05:00'::timestamp, 12::int8, '2026-07-20 19:05:00'::timestamp, 1::int8, '',                                'ORD12', 'COD',     'PENDING', '123 Test Street, Quận 1, TP.HCM', 'PENDING',    '0123456789'),
  (720000.00::numeric, '2026-06-01 08:50:00'::timestamp, 13::int8, '2026-06-01 10:15:00'::timestamp, 1::int8, 'Khách đổi ý, huỷ trong ngày',     'ORD13', 'COD',     'PENDING', '123 Test Street, Quận 1, TP.HCM', 'CANCELLED',  '0123456789')
) AS v(total_amount, created_at, id, updated_at, user_id, notes, order_number, payment_method, payment_status, shipping_address, status, contact_phone)
WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = v.user_id)
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.order_number = v.order_number)
ON CONFLICT (id) DO NOTHING;

-- Chi tiết đơn hàng (giá khớp giá sản phẩm, tổng khớp total_amount ở trên).
-- Guard ghép id + order_number để không gắn nhầm vào đơn khác nếu id đã bị chiếm.
INSERT INTO order_items (price, quantity, created_at, id, order_id, product_id, updated_at)
SELECT v.price, v.quantity, v.created_at, v.id, v.order_id, v.product_id, v.updated_at
FROM (VALUES
  (25000.00::numeric,  3, '2026-05-15 10:20:00'::timestamp, 7::int8,  6::int8,  11::int8, '2026-05-15 10:20:00'::timestamp, 'ORD6'),
  (280000.00::numeric, 1, '2026-05-15 10:20:00'::timestamp, 8::int8,  6::int8,  12::int8, '2026-05-15 10:20:00'::timestamp, 'ORD6'),
  (98000.00::numeric,  2, '2026-05-28 15:45:00'::timestamp, 9::int8,  7::int8,  53::int8, '2026-05-28 15:45:00'::timestamp, 'ORD7'),
  (220000.00::numeric, 1, '2026-05-28 15:45:00'::timestamp, 10::int8, 7::int8,  51::int8, '2026-05-28 15:45:00'::timestamp, 'ORD7'),
  (185000.00::numeric, 1, '2026-06-08 09:10:00'::timestamp, 11::int8, 8::int8,  7::int8,  '2026-06-08 09:10:00'::timestamp, 'ORD8'),
  (85000.00::numeric,  1, '2026-06-08 09:10:00'::timestamp, 12::int8, 8::int8,  13::int8, '2026-06-08 09:10:00'::timestamp, 'ORD8'),
  (485000.00::numeric, 1, '2026-06-20 20:30:00'::timestamp, 13::int8, 9::int8,  56::int8, '2026-06-20 20:30:00'::timestamp, 'ORD9'),
  (68000.00::numeric,  2, '2026-06-20 20:30:00'::timestamp, 14::int8, 9::int8,  59::int8, '2026-06-20 20:30:00'::timestamp, 'ORD9'),
  (155000.00::numeric, 1, '2026-07-02 14:15:00'::timestamp, 15::int8, 10::int8, 48::int8, '2026-07-02 14:15:00'::timestamp, 'ORD10'),
  (35000.00::numeric,  2, '2026-07-02 14:15:00'::timestamp, 16::int8, 10::int8, 50::int8, '2026-07-02 14:15:00'::timestamp, 'ORD10'),
  (35000.00::numeric,  4, '2026-07-12 11:40:00'::timestamp, 17::int8, 11::int8, 8::int8,  '2026-07-12 11:40:00'::timestamp, 'ORD11'),
  (145000.00::numeric, 1, '2026-07-20 19:05:00'::timestamp, 18::int8, 12::int8, 61::int8, '2026-07-20 19:05:00'::timestamp, 'ORD12'),
  (45000.00::numeric,  1, '2026-07-20 19:05:00'::timestamp, 19::int8, 12::int8, 49::int8, '2026-07-20 19:05:00'::timestamp, 'ORD12'),
  (720000.00::numeric, 1, '2026-06-01 08:50:00'::timestamp, 20::int8, 13::int8, 57::int8, '2026-06-01 08:50:00'::timestamp, 'ORD13')
) AS v(price, quantity, created_at, id, order_id, product_id, updated_at, order_number)
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.id = v.order_id AND o.order_number = v.order_number)
  AND EXISTS (SELECT 1 FROM products p WHERE p.id = v.product_id)
ON CONFLICT (id) DO NOTHING;

-- ---------- 10f. PRODUCT REVIEWS — 15 đánh giá rải đều các sản phẩm ----------
INSERT INTO product_reviews (id, created_at, updated_at, comment, rating, product_id, user_id)
SELECT v.* FROM (VALUES
  (6::int8,  '2026-05-19 09:00:00'::timestamp, '2026-05-19 09:00:00'::timestamp, 'Mèo nhà mình mê vị cá ngừ, lần nào cũng ăn sạch đĩa', 5, 11::int8, 1::int8),
  (7::int8,  '2026-05-19 09:05:00'::timestamp, '2026-05-19 09:05:00'::timestamp, 'Hạt nhỏ vừa miệng mèo con, bé ăn ngon và lên cân đều', 5, 12::int8, 1::int8),
  (8::int8,  '2026-06-01 14:30:00'::timestamp, '2026-06-01 14:30:00'::timestamp, 'Cỏ thơm, thỏ nhà mình rất chịu gặm. Gói hơi nhỏ so với giá', 4, 53::int8, 1::int8),
  (9::int8,  '2026-06-01 14:35:00'::timestamp, '2026-06-01 14:35:00'::timestamp, 'Thức ăn chất lượng, thỏ ăn không kén chút nào', 5, 51::int8, 1::int8),
  (10::int8, '2026-06-25 19:00:00'::timestamp, '2026-06-25 19:00:00'::timestamp, 'Chuồng đẹp, dễ lắp và dễ vệ sinh. Hơi nhỏ với hamster bear', 4, 56::int8, 1::int8),
  (11::int8, '2026-06-25 19:10:00'::timestamp, '2026-06-25 19:10:00'::timestamp, 'Cát mịn không bụi, bé tắm xong lông mượt hẳn', 5, 59::int8, 1::int8),
  (12::int8, '2026-06-12 10:00:00'::timestamp, '2026-06-12 10:00:00'::timestamp, 'Vòng cổ da đẹp, khắc tên sắc nét, đeo êm', 4, 13::int8, 1::int8),
  (13::int8, '2026-07-05 16:20:00'::timestamp, '2026-07-05 16:20:00'::timestamp, 'Hamster nhà mình thích lắm, trộn thêm rau sấy là hết veo', 5, 48::int8, 1::int8),
  (14::int8, '2026-07-05 16:25:00'::timestamp, '2026-07-05 16:25:00'::timestamp, 'Bánh mài răng hiệu quả, bé bớt cắn chuồng hẳn', 4, 50::int8, 1::int8),
  (15::int8, '2026-07-21 20:00:00'::timestamp, '2026-07-21 20:00:00'::timestamp, 'Vitamin dạng viên nhai tiện, thỏ ăn như ăn snack', 5, 61::int8, 1::int8),
  (16::int8, '2026-05-10 11:00:00'::timestamp, '2026-05-10 11:00:00'::timestamp, 'Giá tốt, hamster ăn hợp. Sẽ mua lại size lớn hơn', 4, 46::int8, 4::int8),
  (17::int8, '2026-05-10 11:05:00'::timestamp, '2026-05-10 11:05:00'::timestamp, 'Thức ăn nhập khẩu chất lượng, bé ăn khoẻ lông mượt', 5, 47::int8, 4::int8),
  (18::int8, '2026-06-15 09:30:00'::timestamp, '2026-06-15 09:30:00'::timestamp, 'Rau sấy giòn thơm, bé nào cũng tranh nhau ăn', 5, 49::int8, 4::int8),
  (19::int8, '2026-06-15 09:35:00'::timestamp, '2026-06-15 09:35:00'::timestamp, 'Bánh xe chạy êm thật sự, đêm không còn nghe tiếng cọt kẹt', 4, 55::int8, 4::int8),
  (20::int8, '2026-06-05 13:45:00'::timestamp, '2026-06-05 13:45:00'::timestamp, 'Chuồng chắc chắn, rộng rãi nhưng giao hàng hơi lâu', 3, 57::int8, 1::int8)
) AS v(id, created_at, updated_at, comment, rating, product_id, user_id)
WHERE EXISTS (SELECT 1 FROM products p WHERE p.id = v.product_id)
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = v.user_id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. FIX SEQUENCES — dump đặt sai products_id_seq (=2 trong khi id tới 62)
--     và pet_services_id_seq (=1 trong khi id tới 12) → admin thêm sản phẩm/
--     dịch vụ mới sẽ lỗi duplicate key. Đặt lại toàn bộ theo MAX(id).
--     pg_get_serial_sequence tự tìm đúng tên sequence; nếu không có thì bỏ qua.
-- ============================================================
SELECT setval(pg_get_serial_sequence('public.appointments',    'id'), (SELECT COALESCE(MAX(id), 1) FROM appointments),    true);
SELECT setval(pg_get_serial_sequence('public.cart_items',      'id'), (SELECT COALESCE(MAX(id), 1) FROM cart_items),      true);
SELECT setval(pg_get_serial_sequence('public.carts',           'id'), (SELECT COALESCE(MAX(id), 1) FROM carts),           true);
SELECT setval(pg_get_serial_sequence('public.medical_records', 'id'), (SELECT COALESCE(MAX(id), 1) FROM medical_records), true);
SELECT setval(pg_get_serial_sequence('public.order_items',     'id'), (SELECT COALESCE(MAX(id), 1) FROM order_items),     true);
SELECT setval(pg_get_serial_sequence('public.orders',          'id'), (SELECT COALESCE(MAX(id), 1) FROM orders),          true);
SELECT setval(pg_get_serial_sequence('public.pet_services',    'id'), (SELECT COALESCE(MAX(id), 1) FROM pet_services),    true);
SELECT setval(pg_get_serial_sequence('public.pets',            'id'), (SELECT COALESCE(MAX(id), 1) FROM pets),            true);
SELECT setval(pg_get_serial_sequence('public.product_reviews', 'id'), (SELECT COALESCE(MAX(id), 1) FROM product_reviews), true);
SELECT setval(pg_get_serial_sequence('public.products',        'id'), (SELECT COALESCE(MAX(id), 1) FROM products),        true);
SELECT setval(pg_get_serial_sequence('public.reviews',         'id'), (SELECT COALESCE(MAX(id), 1) FROM reviews),         true);
SELECT setval(pg_get_serial_sequence('public.users',           'id'), (SELECT COALESCE(MAX(id), 1) FROM users),           true);
