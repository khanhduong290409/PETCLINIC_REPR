/*
 Navicat Premium Data Transfer

 Source Server         : postgresSQL
 Source Server Type    : PostgreSQL
 Source Server Version : 180001 (180001)
 Source Host           : localhost:5432
 Source Catalog        : petclinic
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 180001 (180001)
 File Encoding         : 65001

 Date: 08/03/2026 15:06:20
*/


-- ----------------------------
-- Sequence structure for appointments_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "appointments_id_seq";
CREATE SEQUENCE "appointments_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for cart_items_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "cart_items_id_seq";
CREATE SEQUENCE "cart_items_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for carts_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "carts_id_seq";
CREATE SEQUENCE "carts_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for medical_records_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "medical_records_id_seq";
CREATE SEQUENCE "medical_records_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for order_items_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "order_items_id_seq";
CREATE SEQUENCE "order_items_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for orders_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "orders_id_seq";
CREATE SEQUENCE "orders_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for pet_services_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "pet_services_id_seq";
CREATE SEQUENCE "pet_services_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for pets_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "pets_id_seq";
CREATE SEQUENCE "pets_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for products_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "products_id_seq";
CREATE SEQUENCE "products_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for users_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "users_id_seq";
CREATE SEQUENCE "users_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Table structure for appointments
-- ----------------------------
DROP TABLE IF EXISTS "appointments";
CREATE TABLE "appointments" (
  "id" int8 NOT NULL DEFAULT nextval('appointments_id_seq'::regclass),
  "user_id" int8 NOT NULL,
  "pet_id" int8 NOT NULL,
  "service_id" int8 NOT NULL,
  "doctor_id" int8,
  "appointment_date" date NOT NULL,
  "appointment_time" time(6) NOT NULL,
  "status" varchar(255) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'PENDING'::character varying,
  "notes" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "booking_code" varchar(255) COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Records of appointments
-- ----------------------------
BEGIN;
INSERT INTO "appointments" ("id", "user_id", "pet_id", "service_id", "doctor_id", "appointment_date", "appointment_time", "status", "notes", "created_at", "updated_at", "booking_code") VALUES (8, 1, 8, 8, NULL, '2026-02-20', '15:00:00', 'CANCELLED', '', '2026-02-17 22:13:45.698806', '2026-02-17 22:53:47.775799', 'BK-LEGACY-8'), (4, 3, 5, 1, NULL, '2024-02-05', '09:30:00', 'PENDING', 'Khám tổng quát cho Buddy', '2026-02-06 21:04:28.750797', '2026-02-24 18:45:26.679868', 'BK-LEGACY-4'), (10, 1, 8, 2, 6, '2026-02-20', '08:30:00', 'PENDING', '', '2026-02-17 22:15:09.678744', '2026-02-25 08:23:17.526292', 'BK-LEGACY-10'), (11, 1, 8, 1, 5, '2026-02-26', '16:00:00', 'COMPLETED', 'chỉ khám định kì', '2026-02-17 22:51:28.837563', '2026-02-25 16:23:39.794879', 'BK-20260217-225128-5c25'), (12, 1, 9, 1, 5, '2026-02-26', '16:00:00', 'COMPLETED', 'chỉ khám định kì', '2026-02-17 22:51:28.887519', '2026-02-25 16:23:39.797878', 'BK-20260217-225128-5c25'), (2, 2, 3, 2, 6, '2024-01-12', '10:30:00', 'COMPLETED', 'Tiêm phòng dại cho Bông', '2026-02-06 21:04:28.750797', '2026-03-03 17:02:23.586611', 'BK-LEGACY-2'), (9, 1, 9, 2, 6, '2026-02-20', '08:30:00', 'CONFIRMED', '', '2026-02-17 22:15:09.672749', '2026-02-22 03:10:02.135136', 'BK-LEGACY-2');
COMMIT;

-- ----------------------------
-- Table structure for cart_items
-- ----------------------------
DROP TABLE IF EXISTS "cart_items";
CREATE TABLE "cart_items" (
  "id" int8 NOT NULL DEFAULT nextval('cart_items_id_seq'::regclass),
  "cart_id" int8 NOT NULL,
  "product_id" int8 NOT NULL,
  "quantity" int4 NOT NULL DEFAULT 1,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of cart_items
-- ----------------------------
BEGIN;
INSERT INTO "cart_items" ("id", "cart_id", "product_id", "quantity", "created_at", "updated_at") VALUES (3, 2, 2, 7, '2026-02-06 21:04:28.727023', '2026-02-06 21:44:05.35639'), (7, 2, 18, 10, '2026-02-06 21:44:01.293897', '2026-02-06 21:44:07.737776'), (9, 4, 1, 1, '2026-03-03 17:13:14.876969', '2026-03-03 17:13:14.876969');
COMMIT;

-- ----------------------------
-- Table structure for carts
-- ----------------------------
DROP TABLE IF EXISTS "carts";
CREATE TABLE "carts" (
  "id" int8 NOT NULL DEFAULT nextval('carts_id_seq'::regclass),
  "user_id" int8 NOT NULL,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of carts
-- ----------------------------
BEGIN;
INSERT INTO "carts" ("id", "user_id", "created_at", "updated_at") VALUES (1, 1, '2026-02-06 21:04:28.719083', '2026-02-06 21:04:28.719083'), (2, 2, '2026-02-06 21:04:28.719083', '2026-02-06 21:04:28.719083'), (3, 3, '2026-02-06 21:04:28.719083', '2026-02-06 21:04:28.719083'), (4, 6, '2026-03-03 17:13:14.796017', '2026-03-03 17:13:14.796017');
COMMIT;

-- ----------------------------
-- Table structure for medical_records
-- ----------------------------
DROP TABLE IF EXISTS "medical_records";
CREATE TABLE "medical_records" (
  "id" int8 NOT NULL DEFAULT nextval('medical_records_id_seq'::regclass),
  "appointment_id" int8 NOT NULL,
  "diagnosis" text COLLATE "pg_catalog"."default",
  "treatment" text COLLATE "pg_catalog"."default",
  "prescription" text COLLATE "pg_catalog"."default",
  "notes" text COLLATE "pg_catalog"."default",
  "follow_up_date" date,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of medical_records
-- ----------------------------
BEGIN;
INSERT INTO "medical_records" ("id", "appointment_id", "diagnosis", "treatment", "prescription", "notes", "follow_up_date", "created_at", "updated_at") VALUES (2, 2, 'Sức khỏe bình thường, đủ điều kiện tiêm ngừa set 1', 'Tiêm vaccine dại set 1', 'Không có set 1', 'Theo dõi 24h sau tiêm set 1 2', '2026-03-11', '2026-02-06 21:04:28.759969', '2026-03-04 05:12:30.968568');
COMMIT;

-- ----------------------------
-- Table structure for order_items
-- ----------------------------
DROP TABLE IF EXISTS "order_items";
CREATE TABLE "order_items" (
  "id" int8 NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
  "order_id" int8 NOT NULL,
  "product_id" int8 NOT NULL,
  "quantity" int4 NOT NULL,
  "price" numeric(10,2) NOT NULL,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of order_items
-- ----------------------------
BEGIN;
INSERT INTO "order_items" ("id", "order_id", "product_id", "quantity", "price", "created_at", "updated_at") VALUES (1, 1, 1, 2, 180000.00, '2026-02-06 21:04:28.742937', '2026-02-06 21:04:28.742937'), (2, 1, 2, 1, 48000.00, '2026-02-06 21:04:28.742937', '2026-02-06 21:04:28.742937'), (3, 2, 3, 1, 250000.00, '2026-02-06 21:04:28.742937', '2026-02-06 21:04:28.742937'), (4, 2, 13, 1, 65000.00, '2026-02-06 21:04:28.742937', '2026-02-06 21:04:28.742937'), (5, 3, 6, 1, 120000.00, '2026-02-06 21:04:28.742937', '2026-02-06 21:04:28.742937'), (6, 3, 7, 1, 350000.00, '2026-02-06 21:04:28.742937', '2026-02-06 21:04:28.742937'), (7, 4, 10, 4, 140000.00, '2026-02-08 18:20:16.944006', '2026-02-08 18:20:16.944006'), (8, 4, 1, 3, 180000.00, '2026-02-08 18:20:16.947006', '2026-02-08 18:20:16.948005'), (9, 5, 18, 1, 65000.00, '2026-02-17 23:43:47.332394', '2026-02-17 23:43:47.332394');
COMMIT;

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS "orders";
CREATE TABLE "orders" (
  "id" int8 NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
  "user_id" int8 NOT NULL,
  "order_number" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "total_amount" numeric(10,2) NOT NULL,
  "status" varchar(255) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'PENDING'::character varying,
  "shipping_address" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "payment_method" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "payment_status" varchar(255) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'PENDING'::character varying,
  "notes" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of orders
-- ----------------------------
BEGIN;
INSERT INTO "orders" ("id", "user_id", "order_number", "total_amount", "status", "shipping_address", "payment_method", "payment_status", "notes", "created_at", "updated_at") VALUES (1, 1, 'ORD-20240101-001', 408000.00, 'DELIVERED', '123 Nguyen Hue, Q1, HCM', 'COD', 'PAID', NULL, '2026-02-06 21:04:28.735267', '2026-02-06 21:04:28.735267'), (2, 2, 'ORD-20240115-002', 315000.00, 'PROCESSING', '456 Le Loi, Q3, HCM', 'BANKING', 'PAID', NULL, '2026-02-06 21:04:28.735267', '2026-02-06 21:04:28.735267'), (3, 1, 'ORD-20240120-003', 470000.00, 'PENDING', '123 Nguyen Hue, Q1, HCM', 'COD', 'PENDING', NULL, '2026-02-06 21:04:28.735267', '2026-02-06 21:04:28.735267'), (4, 1, 'ORD-20260208182016-1', 1100000.00, 'PENDING', 'dsadsadsad', 'COD', 'PENDING', 'sadsadsd', '2026-02-08 18:20:16.893735', '2026-02-08 18:20:16.893735'), (5, 1, 'ORD-20260217234347-1', 65000.00, 'PENDING', 'rewrewr', 'COD', 'PENDING', 'ewrewr', '2026-02-17 23:43:47.315591', '2026-02-17 23:43:47.315591');
COMMIT;

-- ----------------------------
-- Table structure for pet_services
-- ----------------------------
DROP TABLE IF EXISTS "pet_services";
CREATE TABLE "pet_services" (
  "id" int8 NOT NULL DEFAULT nextval('pet_services_id_seq'::regclass),
  "title" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "image_url" varchar(255) COLLATE "pg_catalog"."default",
  "price" numeric(10,2) NOT NULL,
  "duration" int4 NOT NULL,
  "category" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of pet_services
-- ----------------------------
BEGIN;
INSERT INTO "pet_services" ("id", "title", "description", "image_url", "price", "duration", "category", "created_at", "updated_at") VALUES (1, 'Khám tổng quát', 'Khám sức khỏe tổng quát cho thú cưng, kiểm tra tim mạch, hô hấp', '/assets/khamtongquat.jpg', 150000.00, 30, 'medical', '2026-02-06 21:04:28.699367', '2026-02-06 21:04:28.699367'), (2, 'Tiêm phòng', 'Tiêm vaccine phòng bệnh cho chó mèo theo lịch', '/assets/tiemphong.jpg', 200000.00, 15, 'medical', '2026-02-06 21:04:28.699367', '2026-02-06 21:04:28.699367'), (3, 'Siêu âm', 'Siêu âm chẩn đoán bệnh lý nội tạng', '/assets/sieuam.jpg', 300000.00, 30, 'medical', '2026-02-06 21:04:28.699367', '2026-02-06 21:04:28.699367'), (4, 'Xét nghiệm máu', 'Xét nghiệm công thức máu, sinh hóa máu', '/assets/xetnghiem.jpg', 250000.00, 45, 'medical', '2026-02-06 21:04:28.699367', '2026-02-06 21:04:28.699367'), (5, 'Tắm gội cơ bản', 'Dịch vụ tắm gội, sấy khô cho thú cưng', '/assets/tamgoi.jpg', 100000.00, 45, 'grooming', '2026-02-06 21:04:28.699367', '2026-02-06 21:04:28.699367'), (6, 'Cắt tỉa lông', 'Cắt tỉa lông theo yêu cầu, tạo kiểu', '/assets/cattialong.jpg', 150000.00, 60, 'grooming', '2026-02-06 21:04:28.699367', '2026-02-06 21:04:28.699367'), (7, 'Combo tắm + cắt tỉa', 'Trọn gói tắm gội và cắt tỉa lông', '/assets/combotam.jpg', 220000.00, 90, 'grooming', '2026-02-06 21:04:28.699367', '2026-02-06 21:04:28.699367'), (8, 'Vệ sinh tai', 'Vệ sinh tai, loại bỏ ráy tai an toàn', '/assets/vesinhcai.jpg', 50000.00, 15, 'grooming', '2026-02-06 21:04:28.699367', '2026-02-06 21:04:28.699367'), (9, 'Khách sạn thú cưng (ngày)', 'Dịch vụ giữ thú cưng trong ngày', '/assets/khachsan.jpg', 150000.00, 480, 'boarding', '2026-02-06 21:04:28.699367', '2026-02-06 21:04:28.699367'), (10, 'Khách sạn thú cưng (đêm)', 'Dịch vụ giữ thú cưng qua đêm', '/assets/khachsandem.jpg', 250000.00, 1440, 'boarding', '2026-02-06 21:04:28.699367', '2026-02-06 21:04:28.699367'), (11, 'Huấn luyện cơ bản', 'Huấn luyện các lệnh cơ bản: ngồi, nằm, lại đây', '/assets/huanluyen.jpg', 500000.00, 90, 'training', '2026-02-06 21:04:28.699367', '2026-02-06 21:04:28.699367'), (12, 'Huấn luyện nâng cao', 'Huấn luyện các kỹ năng nâng cao cho chó', '/assets/huanluyennc.jpg', 800000.00, 120, 'training', '2026-02-06 21:04:28.699367', '2026-02-06 21:04:28.699367');
COMMIT;

-- ----------------------------
-- Table structure for pets
-- ----------------------------
DROP TABLE IF EXISTS "pets";
CREATE TABLE "pets" (
  "id" int8 NOT NULL DEFAULT nextval('pets_id_seq'::regclass),
  "user_id" int8 NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "species" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "breed" varchar(255) COLLATE "pg_catalog"."default",
  "age" int4,
  "weight" float8,
  "gender" varchar(255) COLLATE "pg_catalog"."default",
  "notes" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "image_url" varchar(255) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of pets
-- ----------------------------
BEGIN;
INSERT INTO "pets" ("id", "user_id", "name", "species", "breed", "age", "weight", "gender", "notes", "created_at", "updated_at", "image_url") VALUES (3, 2, 'Bông', 'CAT', 'Mèo Anh lông ngắn', 12, 5, 'MALE', 'Mèo lười, hay ăn vặt', '2026-02-06 21:04:28.704991', '2026-02-06 21:04:28.704991', NULL), (4, 2, 'Ham Ham', 'HAMSTER', 'Hamster Winter White', 6, 0.05, 'FEMALE', 'Hamster dễ thương', '2026-02-06 21:04:28.704991', '2026-02-06 21:04:28.704991', NULL), (5, 3, 'Buddy', 'DOG', 'Golden Retriever', 36, 28, 'MALE', 'Chó thân thiện, thích bơi', '2026-02-06 21:04:28.704991', '2026-02-06 21:04:28.704991', NULL), (6, 3, 'Kitty', 'CAT', 'Mèo Munchkin', 8, 3.2, 'FEMALE', 'Mèo chân ngắn, rất đáng yêu', '2026-02-06 21:04:28.704991', '2026-02-06 21:04:28.704991', NULL), (8, 1, 'dokgu', 'DOG', 'shiba', 12, 23, 'MALE', 'bị đau lưng, mỏi gối, ù tai, ', '2026-02-17 22:12:56.586778', '2026-02-17 22:12:56.586778', 'http://localhost:8080/uploads/6a0052e6-fec6-4aa7-a8e1-efdda48c0d09.webp'), (9, 1, 'mewtwo', 'CAT', 'pokemon', 1000, 54, 'FEMALE', '', '2026-02-17 22:14:19.60239', '2026-02-17 22:14:19.60239', 'http://localhost:8080/uploads/be9bc1d6-e268-4bff-91c1-f6aa111ca1bd.jpg');
COMMIT;

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS "products";
CREATE TABLE "products" (
  "id" int8 NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "price" numeric(10,2) NOT NULL,
  "image_url" varchar(255) COLLATE "pg_catalog"."default",
  "category" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "stock" int4 NOT NULL DEFAULT 0,
  "description" text COLLATE "pg_catalog"."default",
  "brand" varchar(255) COLLATE "pg_catalog"."default",
  "weight" varchar(255) COLLATE "pg_catalog"."default",
  "volume" varchar(255) COLLATE "pg_catalog"."default",
  "material" varchar(255) COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of products
-- ----------------------------
BEGIN;
INSERT INTO "products" ("id", "name", "price", "image_url", "category", "stock", "description", "brand", "weight", "volume", "material", "created_at", "updated_at") VALUES (1, 'Hạt cho mèo Royal Canin', 180000.00, '/assets/hatmeo.jpg', 'food', 50, 'Thức ăn cao cấp dành cho mèo trưởng thành, giàu dinh dưỡng', 'Royal Canin', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (2, 'Pate cho mèo Me-O', 48000.00, '/assets/patechomeo.webp', 'food', 100, 'Pate dinh dưỡng cho mèo, nhiều vị khác nhau', 'Me-O', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (3, 'Hạt cho chó Pedigree', 250000.00, '/assets/hatcho.jpg', 'food', 60, 'Thức ăn cho chó trưởng thành, hỗ trợ tiêu hóa', 'Pedigree', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (4, 'Hạt cho chó con Royal Canin', 220000.00, '/assets/hatchocon.jpg', 'food', 40, 'Thức ăn cho chó con dưới 12 tháng tuổi', 'Royal Canin', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (5, 'Snack cho mèo Whiskas', 35000.00, '/assets/snackmeo.jpg', 'food', 80, 'Bánh thưởng cho mèo, vị cá ngừ', 'Whiskas', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (6, 'Dây dắt chó PetLove', 120000.00, '/assets/daydatcho.webp', 'accessories', 30, 'Dây dắt chó chất lượng cao, bền đẹp, nhiều màu sắc', 'PetLove', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (7, 'Chuồng cho hamster', 350000.00, '/assets/chuonghamster.jpg', 'accessories', 20, 'Chuồng hamster 2 tầng, đầy đủ phụ kiện', 'PetLife', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (8, 'Vòng cổ cho mèo', 65000.00, '/assets/vongcomeo.jpg', 'accessories', 50, 'Vòng cổ êm ái, có chuông nhỏ', 'CatStyle', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (9, 'Bát ăn inox cho chó', 75000.00, '/assets/batcho.jpg', 'accessories', 45, 'Bát ăn inox chống gỉ, dễ vệ sinh', 'PetGear', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (10, 'Sữa tắm thú cưng Bio-Groom', 140000.00, '/assets/suatamchomeo.jpg', 'grooming', 45, 'Sữa tắm dịu nhẹ, an toàn cho da thú cưng', 'Bio-Groom', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (11, 'Lược chải lông cho mèo', 55000.00, '/assets/luocchailong.jpg', 'grooming', 60, 'Lược chải lông giúp loại bỏ lông rụng', 'PetCare', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (12, 'Bấm móng cho chó mèo', 45000.00, '/assets/bammong.jpg', 'grooming', 70, 'Bấm móng an toàn, sắc bén', 'PetTools', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (13, 'Đồ chơi cho mèo', 65000.00, '/assets/dochoichomeo.jpg', 'toys', 70, 'Bộ đồ chơi cho mèo, kích thích vận động', 'CatFun', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (14, 'Bóng tennis cho chó', 25000.00, '/assets/bongcho.jpg', 'toys', 100, 'Bóng tennis chơi đùa với chó', 'DogPlay', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (15, 'Cần câu đồ chơi cho mèo', 45000.00, '/assets/cancaumeo.jpg', 'toys', 55, 'Cần câu lông vũ cho mèo săn mồi', 'CatFun', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (16, 'Vitamin cho chó mèo', 95000.00, '/assets/vitamin.jpg', 'medicine', 80, 'Vitamin tổng hợp bổ sung dinh dưỡng', 'VetPlus', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (17, 'Thuốc xổ giun cho chó', 85000.00, '/assets/thuocxogiun.jpg', 'medicine', 50, 'Thuốc xổ giun định kỳ cho chó', 'VetMed', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448'), (18, 'Thuốc nhỏ mắt cho mèo', 65000.00, '/assets/thuocmat.jpg', 'medicine', 40, 'Thuốc nhỏ mắt kháng viêm cho mèo', 'VetCare', NULL, NULL, NULL, '2026-02-06 21:04:28.690448', '2026-02-06 21:04:28.690448');
COMMIT;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "users";
CREATE TABLE "users" (
  "id" int8 NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  "email" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "password" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "full_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "phone" varchar(255) COLLATE "pg_catalog"."default",
  "address" varchar(255) COLLATE "pg_catalog"."default",
  "role" varchar(255) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'USER'::character varying,
  "status" varchar(255) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'ACTIVE'::character varying,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO "users" ("id", "email", "password", "full_name", "phone", "address", "role", "status", "created_at", "updated_at") VALUES (1, 'user1@example.com', '123456', 'Nguyen Van A', '0901234567', '123 Nguyen Hue, Q1, HCM', 'USER', 'ACTIVE', '2026-02-06 21:04:28.675877', '2026-02-06 21:04:28.675877'), (2, 'user2@example.com', '123456', 'Tran Thi B', '0912345678', '456 Le Loi, Q3, HCM', 'USER', 'ACTIVE', '2026-02-06 21:04:28.675877', '2026-02-06 21:04:28.675877'), (3, 'user3@example.com', '123456', 'Le Van C', '0923456789', '789 Hai Ba Trung, Q1, HCM', 'USER', 'ACTIVE', '2026-02-06 21:04:28.675877', '2026-02-06 21:04:28.675877'), (4, 'admin@petclinic.com', 'admin123', 'Admin PetClinic', '0909999999', 'PetClinic Office', 'ADMIN', 'ACTIVE', '2026-02-06 21:04:28.675877', '2026-02-06 21:04:28.675877'), (5, 'doctor1@petclinic.com', 'doctor123', 'BS. Pham Van D', '0908888881', 'PetClinic Office', 'DOCTOR', 'ACTIVE', '2026-02-06 21:04:28.675877', '2026-02-06 21:04:28.675877'), (6, 'doctor2@petclinic.com', 'doctor123', 'BS. Hoang Thi E', '0908888882', 'PetClinic Office', 'DOCTOR', 'ACTIVE', '2026-02-06 21:04:28.675877', '2026-02-06 21:04:28.675877'), (7, 'doctor@petclinic.com', 'doctor123', 'BS. Nguyễn Văn An', NULL, NULL, 'DOCTOR', 'ACTIVE', '2026-02-22 02:33:07.896307', '2026-02-22 02:33:07.896307');
COMMIT;

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "appointments_id_seq"
OWNED BY "appointments"."id";
SELECT setval('"appointments_id_seq"', 12, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "cart_items_id_seq"
OWNED BY "cart_items"."id";
SELECT setval('"cart_items_id_seq"', 9, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "carts_id_seq"
OWNED BY "carts"."id";
SELECT setval('"carts_id_seq"', 4, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "medical_records_id_seq"
OWNED BY "medical_records"."id";
SELECT setval('"medical_records_id_seq"', 2, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "order_items_id_seq"
OWNED BY "order_items"."id";
SELECT setval('"order_items_id_seq"', 9, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "orders_id_seq"
OWNED BY "orders"."id";
SELECT setval('"orders_id_seq"', 5, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "pet_services_id_seq"
OWNED BY "pet_services"."id";
SELECT setval('"pet_services_id_seq"', 12, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "pets_id_seq"
OWNED BY "pets"."id";
SELECT setval('"pets_id_seq"', 9, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "products_id_seq"
OWNED BY "products"."id";
SELECT setval('"products_id_seq"', 18, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "users_id_seq"
OWNED BY "users"."id";
SELECT setval('"users_id_seq"', 7, true);

-- ----------------------------
-- Indexes structure for table appointments
-- ----------------------------
CREATE INDEX "idx_appointments_date" ON "appointments" USING btree (
  "appointment_date" "pg_catalog"."date_ops" ASC NULLS LAST
);
CREATE INDEX "idx_appointments_doctor" ON "appointments" USING btree (
  "doctor_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE INDEX "idx_appointments_user" ON "appointments" USING btree (
  "user_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Checks structure for table appointments
-- ----------------------------
ALTER TABLE "appointments" ADD CONSTRAINT "chk_appointment_status" CHECK (status::text = ANY (ARRAY['PENDING'::character varying::text, 'CONFIRMED'::character varying::text, 'COMPLETED'::character varying::text, 'CANCELLED'::character varying::text]));

-- ----------------------------
-- Primary Key structure for table appointments
-- ----------------------------
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table cart_items
-- ----------------------------
CREATE INDEX "idx_cart_items_cart" ON "cart_items" USING btree (
  "cart_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table cart_items
-- ----------------------------
ALTER TABLE "cart_items" ADD CONSTRAINT "uq_cart_product" UNIQUE ("cart_id", "product_id");
ALTER TABLE "cart_items" ADD CONSTRAINT "uk6oue0maw421roerltnxn16a38" UNIQUE ("cart_id", "product_id");

-- ----------------------------
-- Checks structure for table cart_items
-- ----------------------------
ALTER TABLE "cart_items" ADD CONSTRAINT "chk_quantity" CHECK (quantity > 0);

-- ----------------------------
-- Primary Key structure for table cart_items
-- ----------------------------
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table carts
-- ----------------------------
CREATE INDEX "idx_carts_user" ON "carts" USING btree (
  "user_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table carts
-- ----------------------------
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_key" UNIQUE ("user_id");

-- ----------------------------
-- Primary Key structure for table carts
-- ----------------------------
ALTER TABLE "carts" ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Uniques structure for table medical_records
-- ----------------------------
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_appointment_id_key" UNIQUE ("appointment_id");

-- ----------------------------
-- Primary Key structure for table medical_records
-- ----------------------------
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table order_items
-- ----------------------------
CREATE INDEX "idx_order_items_order" ON "order_items" USING btree (
  "order_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Checks structure for table order_items
-- ----------------------------
ALTER TABLE "order_items" ADD CONSTRAINT "chk_order_quantity" CHECK (quantity > 0);

-- ----------------------------
-- Primary Key structure for table order_items
-- ----------------------------
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table orders
-- ----------------------------
CREATE INDEX "idx_orders_status" ON "orders" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_orders_user" ON "orders" USING btree (
  "user_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table orders
-- ----------------------------
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");

-- ----------------------------
-- Checks structure for table orders
-- ----------------------------
ALTER TABLE "orders" ADD CONSTRAINT "chk_payment_status" CHECK (payment_status::text = ANY (ARRAY['PENDING'::character varying::text, 'PAID'::character varying::text, 'FAILED'::character varying::text]));
ALTER TABLE "orders" ADD CONSTRAINT "chk_order_status" CHECK (status::text = ANY (ARRAY['PENDING'::character varying::text, 'PROCESSING'::character varying::text, 'SHIPPED'::character varying::text, 'DELIVERED'::character varying::text, 'CANCELLED'::character varying::text]));

-- ----------------------------
-- Primary Key structure for table orders
-- ----------------------------
ALTER TABLE "orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table pet_services
-- ----------------------------
ALTER TABLE "pet_services" ADD CONSTRAINT "pet_services_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table pets
-- ----------------------------
CREATE INDEX "idx_pets_user" ON "pets" USING btree (
  "user_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Checks structure for table pets
-- ----------------------------
ALTER TABLE "pets" ADD CONSTRAINT "chk_gender" CHECK (gender::text = ANY (ARRAY['MALE'::character varying::text, 'FEMALE'::character varying::text]));
ALTER TABLE "pets" ADD CONSTRAINT "chk_species" CHECK (species::text = ANY (ARRAY['DOG'::character varying::text, 'CAT'::character varying::text, 'BIRD'::character varying::text, 'RABBIT'::character varying::text, 'HAMSTER'::character varying::text, 'OTHER'::character varying::text]));

-- ----------------------------
-- Primary Key structure for table pets
-- ----------------------------
ALTER TABLE "pets" ADD CONSTRAINT "pets_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table products
-- ----------------------------
CREATE INDEX "idx_products_category" ON "products" USING btree (
  "category" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Checks structure for table products
-- ----------------------------
ALTER TABLE "products" ADD CONSTRAINT "chk_stock" CHECK (stock >= 0);

-- ----------------------------
-- Primary Key structure for table products
-- ----------------------------
ALTER TABLE "products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table users
-- ----------------------------
CREATE INDEX "idx_users_email" ON "users" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table users
-- ----------------------------
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");

-- ----------------------------
-- Checks structure for table users
-- ----------------------------
ALTER TABLE "users" ADD CONSTRAINT "chk_role" CHECK (role::text = ANY (ARRAY['USER'::character varying::text, 'ADMIN'::character varying::text, 'DOCTOR'::character varying::text]));
ALTER TABLE "users" ADD CONSTRAINT "chk_status" CHECK (status::text = ANY (ARRAY['ACTIVE'::character varying::text, 'INACTIVE'::character varying::text]));

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table appointments
-- ----------------------------
ALTER TABLE "appointments" ADD CONSTRAINT "fk_appointments_doctor" FOREIGN KEY ("doctor_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "appointments" ADD CONSTRAINT "fk_appointments_pet" FOREIGN KEY ("pet_id") REFERENCES "pets" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "appointments" ADD CONSTRAINT "fk_appointments_service" FOREIGN KEY ("service_id") REFERENCES "pet_services" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "appointments" ADD CONSTRAINT "fk_appointments_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table cart_items
-- ----------------------------
ALTER TABLE "cart_items" ADD CONSTRAINT "fk_cart_items_cart" FOREIGN KEY ("cart_id") REFERENCES "carts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "cart_items" ADD CONSTRAINT "fk_cart_items_product" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table carts
-- ----------------------------
ALTER TABLE "carts" ADD CONSTRAINT "fk_carts_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table medical_records
-- ----------------------------
ALTER TABLE "medical_records" ADD CONSTRAINT "fk_medical_records_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table order_items
-- ----------------------------
ALTER TABLE "order_items" ADD CONSTRAINT "fk_order_items_order" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "order_items" ADD CONSTRAINT "fk_order_items_product" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table orders
-- ----------------------------
ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table pets
-- ----------------------------
ALTER TABLE "pets" ADD CONSTRAINT "fk_pets_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
