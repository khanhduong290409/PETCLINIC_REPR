/*
 Navicat Premium Dump SQL

 Source Server         : PostgreSQL
 Source Server Type    : PostgreSQL
 Source Server Version : 180003 (180003)
 Source Host           : localhost:5432
 Source Catalog        : petclinic
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 180003 (180003)
 File Encoding         : 65001

 Date: 05/05/2026 16:01:31
*/


-- ----------------------------
-- Sequence structure for appointments_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."appointments_id_seq";
CREATE SEQUENCE "public"."appointments_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for cart_items_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."cart_items_id_seq";
CREATE SEQUENCE "public"."cart_items_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for carts_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."carts_id_seq";
CREATE SEQUENCE "public"."carts_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for medical_records_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."medical_records_id_seq";
CREATE SEQUENCE "public"."medical_records_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for order_items_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."order_items_id_seq";
CREATE SEQUENCE "public"."order_items_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for orders_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."orders_id_seq";
CREATE SEQUENCE "public"."orders_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for pet_services_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."pet_services_id_seq";
CREATE SEQUENCE "public"."pet_services_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for pets_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."pets_id_seq";
CREATE SEQUENCE "public"."pets_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for product_reviews_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."product_reviews_id_seq";
CREATE SEQUENCE "public"."product_reviews_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for products_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."products_id_seq";
CREATE SEQUENCE "public"."products_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for reviews_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."reviews_id_seq";
CREATE SEQUENCE "public"."reviews_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for users_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."users_id_seq";
CREATE SEQUENCE "public"."users_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Table structure for appointment_services
-- ----------------------------
DROP TABLE IF EXISTS "public"."appointment_services";
CREATE TABLE "public"."appointment_services" (
  "appointment_id" int8 NOT NULL,
  "service_id" int8 NOT NULL
)
;

-- ----------------------------
-- Records of appointment_services
-- ----------------------------
INSERT INTO "public"."appointment_services" VALUES (1, 10);
INSERT INTO "public"."appointment_services" VALUES (1, 11);
INSERT INTO "public"."appointment_services" VALUES (2, 10);
INSERT INTO "public"."appointment_services" VALUES (2, 11);
INSERT INTO "public"."appointment_services" VALUES (3, 1);
INSERT INTO "public"."appointment_services" VALUES (3, 3);
INSERT INTO "public"."appointment_services" VALUES (3, 4);
INSERT INTO "public"."appointment_services" VALUES (4, 1);
INSERT INTO "public"."appointment_services" VALUES (4, 3);
INSERT INTO "public"."appointment_services" VALUES (4, 4);
INSERT INTO "public"."appointment_services" VALUES (5, 2);
INSERT INTO "public"."appointment_services" VALUES (6, 2);
INSERT INTO "public"."appointment_services" VALUES (6, 8);
INSERT INTO "public"."appointment_services" VALUES (7, 1);
INSERT INTO "public"."appointment_services" VALUES (7, 12);
INSERT INTO "public"."appointment_services" VALUES (8, 6);
INSERT INTO "public"."appointment_services" VALUES (9, 1);
INSERT INTO "public"."appointment_services" VALUES (10, 1);
INSERT INTO "public"."appointment_services" VALUES (11, 1);
INSERT INTO "public"."appointment_services" VALUES (12, 1);
INSERT INTO "public"."appointment_services" VALUES (13, 1);

-- ----------------------------
-- Table structure for appointments
-- ----------------------------
DROP TABLE IF EXISTS "public"."appointments";
CREATE TABLE "public"."appointments" (
  "appointment_date" date NOT NULL,
  "appointment_time" time(0) NOT NULL,
  "created_at" timestamp(6) NOT NULL,
  "doctor_id" int8,
  "id" int8 NOT NULL GENERATED BY DEFAULT AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "pet_id" int8 NOT NULL,
  "updated_at" timestamp(6),
  "user_id" int8 NOT NULL,
  "booking_code" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "notes" text COLLATE "pg_catalog"."default",
  "status" varchar(255) COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Records of appointments
-- ----------------------------
INSERT INTO "public"."appointments" VALUES ('2026-04-24', '12:00:00', '2026-04-15 14:59:03.240285', 3, 1, 1, '2026-04-18 18:51:52.281539', 4, 'BK-20260415-145903-3b33', '', 'COMPLETED');
INSERT INTO "public"."appointments" VALUES ('2026-04-24', '12:00:00', '2026-04-15 14:59:03.2465', 3, 2, 2, '2026-04-18 18:51:52.312969', 4, 'BK-20260415-145903-3b33', '', 'COMPLETED');
INSERT INTO "public"."appointments" VALUES ('2026-04-22', '12:30:00', '2026-04-18 18:52:58.405556', 3, 3, 1, '2026-04-18 18:56:40.668972', 4, 'BK-20260418-185258-b962', '', 'COMPLETED');
INSERT INTO "public"."appointments" VALUES ('2026-04-22', '12:30:00', '2026-04-18 18:52:58.438571', 3, 4, 2, '2026-04-18 18:56:40.670967', 4, 'BK-20260418-185258-b962', '', 'COMPLETED');
INSERT INTO "public"."appointments" VALUES ('2026-04-21', '11:00:00', '2026-04-18 19:15:30.697099', 3, 6, 2, '2026-04-18 19:16:55.76581', 4, 'BK-20260418-191530-82fb', '', 'COMPLETED');
INSERT INTO "public"."appointments" VALUES ('2026-04-22', '09:30:00', '2026-04-18 19:15:09.400234', 3, 5, 1, '2026-04-18 19:16:57.382695', 4, 'BK-20260418-191509-e2b3', '', 'COMPLETED');
INSERT INTO "public"."appointments" VALUES ('2026-04-22', '13:30:00', '2026-04-18 19:15:57.997716', 3, 8, 2, '2026-04-18 19:16:59.025056', 4, 'BK-20260418-191557-bbc3', '', 'COMPLETED');
INSERT INTO "public"."appointments" VALUES ('2026-04-24', '14:30:00', '2026-04-18 19:15:40.969836', 3, 7, 1, '2026-04-18 19:17:00.509964', 4, 'BK-20260418-191540-93ed', '', 'COMPLETED');
INSERT INTO "public"."appointments" VALUES ('2026-04-29', '14:30:00', '2026-04-18 19:16:09.311838', 3, 10, 1, '2026-04-18 19:17:02.341374', 4, 'BK-20260418-191609-40d5', '', 'COMPLETED');
INSERT INTO "public"."appointments" VALUES ('2026-04-29', '14:30:00', '2026-04-18 19:16:09.308779', 3, 9, 2, '2026-04-18 19:17:02.342372', 4, 'BK-20260418-191609-40d5', '', 'COMPLETED');
INSERT INTO "public"."appointments" VALUES ('2026-04-27', '15:30:00', '2026-04-18 19:18:48.628461', 3, 12, 1, '2026-04-18 19:19:10.678869', 4, 'BK-20260418-191848-de3c', '', 'COMPLETED');
INSERT INTO "public"."appointments" VALUES ('2026-04-27', '15:30:00', '2026-04-18 19:18:48.625512', 3, 11, 2, '2026-04-18 19:19:10.679867', 4, 'BK-20260418-191848-de3c', '', 'COMPLETED');
INSERT INTO "public"."appointments" VALUES ('2026-04-30', '13:00:00', '2026-04-21 15:40:55.721632', NULL, 13, 1, '2026-04-23 13:29:58.325717', 4, 'BK-20260421-154055-e3db', 'samdasmd', 'PENDING');

-- ----------------------------
-- Table structure for cart_items
-- ----------------------------
DROP TABLE IF EXISTS "public"."cart_items";
CREATE TABLE "public"."cart_items" (
  "quantity" int4 NOT NULL,
  "cart_id" int8 NOT NULL,
  "created_at" timestamp(6) NOT NULL,
  "id" int8 NOT NULL GENERATED BY DEFAULT AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "product_id" int8 NOT NULL,
  "updated_at" timestamp(6)
)
;

-- ----------------------------
-- Records of cart_items
-- ----------------------------
INSERT INTO "public"."cart_items" VALUES (2, 1, '2026-04-22 12:04:21.098379', 6, 7, '2026-04-22 12:04:23.357377');
INSERT INTO "public"."cart_items" VALUES (1, 1, '2026-04-22 12:24:27.463386', 8, 9, '2026-04-22 12:24:27.463386');
INSERT INTO "public"."cart_items" VALUES (1, 1, '2026-04-22 12:24:28.478683', 9, 10, '2026-04-22 12:24:28.478683');
INSERT INTO "public"."cart_items" VALUES (2, 1, '2026-04-22 12:24:26.00049', 7, 8, '2026-04-22 12:24:35.143384');
INSERT INTO "public"."cart_items" VALUES (1, 2, '2026-04-26 12:04:31.300728', 10, 9, '2026-04-26 12:04:31.300728');
INSERT INTO "public"."cart_items" VALUES (1, 2, '2026-04-26 12:34:01.573357', 11, 10, '2026-04-26 12:34:01.573357');
INSERT INTO "public"."cart_items" VALUES (1, 2, '2026-04-26 12:34:20.771763', 13, 8, '2026-04-26 12:34:20.771763');
INSERT INTO "public"."cart_items" VALUES (1, 2, '2026-05-05 13:19:01.988555', 15, 13, '2026-05-05 13:19:01.988555');
INSERT INTO "public"."cart_items" VALUES (2, 2, '2026-04-26 12:34:18.573495', 12, 11, '2026-05-05 13:19:03.786414');
INSERT INTO "public"."cart_items" VALUES (2, 2, '2026-05-05 13:19:00.71681', 14, 12, '2026-05-05 13:20:33.747616');

-- ----------------------------
-- Table structure for carts
-- ----------------------------
DROP TABLE IF EXISTS "public"."carts";
CREATE TABLE "public"."carts" (
  "created_at" timestamp(6) NOT NULL,
  "id" int8 NOT NULL GENERATED BY DEFAULT AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "updated_at" timestamp(6),
  "user_id" int8 NOT NULL
)
;

-- ----------------------------
-- Records of carts
-- ----------------------------
INSERT INTO "public"."carts" VALUES ('2026-04-15 14:52:25.731871', 1, '2026-04-15 14:52:25.731871', 4);
INSERT INTO "public"."carts" VALUES ('2026-04-15 14:59:17.67158', 2, '2026-04-15 14:59:17.67158', 2);
INSERT INTO "public"."carts" VALUES ('2026-04-15 14:59:37.475225', 3, '2026-04-15 14:59:37.475225', 3);

-- ----------------------------
-- Table structure for medical_records
-- ----------------------------
DROP TABLE IF EXISTS "public"."medical_records";
CREATE TABLE "public"."medical_records" (
  "follow_up_date" date,
  "appointment_id" int8 NOT NULL,
  "created_at" timestamp(6) NOT NULL,
  "id" int8 NOT NULL GENERATED BY DEFAULT AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "updated_at" timestamp(6),
  "diagnosis" text COLLATE "pg_catalog"."default",
  "notes" text COLLATE "pg_catalog"."default",
  "prescription" text COLLATE "pg_catalog"."default",
  "treatment" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of medical_records
-- ----------------------------
INSERT INTO "public"."medical_records" VALUES ('2026-04-30', 2, '2026-04-15 14:59:03.252062', 2, '2026-04-15 15:03:52.489468', 'ựa', '......', ',,,,,', 'ko biết');
INSERT INTO "public"."medical_records" VALUES ('2026-04-16', 1, '2026-04-15 14:59:03.248261', 1, '2026-04-15 15:33:54.592986', 'bệnh gì đó ', '????????', 'thuốc ... ', 'điều trị gì đó');
INSERT INTO "public"."medical_records" VALUES ('2026-04-19', 3, '2026-04-18 18:52:58.445553', 3, '2026-04-18 18:55:45.885353', 'bị bệnh ngày 18/4', '', 'thuốc 18/4', 'điều trị 18/4');
INSERT INTO "public"."medical_records" VALUES ('2026-04-19', 4, '2026-04-18 18:52:58.450542', 4, '2026-04-18 18:56:32.772959', 'bệnh 18/4 p2', '', 'thuốc  18/4 p2', 'điều trị 18/4 p2');
INSERT INTO "public"."medical_records" VALUES (NULL, 5, '2026-04-18 19:15:09.403227', 5, '2026-04-18 19:15:09.403227', '', '', '', '');
INSERT INTO "public"."medical_records" VALUES (NULL, 6, '2026-04-18 19:15:30.701089', 6, '2026-04-18 19:15:30.701089', '', '', '', '');
INSERT INTO "public"."medical_records" VALUES (NULL, 7, '2026-04-18 19:15:40.971043', 7, '2026-04-18 19:15:40.971043', '', '', '', '');
INSERT INTO "public"."medical_records" VALUES (NULL, 8, '2026-04-18 19:15:57.999803', 8, '2026-04-18 19:15:57.999803', '', '', '', '');
INSERT INTO "public"."medical_records" VALUES (NULL, 9, '2026-04-18 19:16:09.314953', 9, '2026-04-18 19:16:09.314953', '', '', '', '');
INSERT INTO "public"."medical_records" VALUES (NULL, 10, '2026-04-18 19:16:09.316754', 10, '2026-04-18 19:16:09.316754', '', '', '', '');
INSERT INTO "public"."medical_records" VALUES (NULL, 11, '2026-04-18 19:18:48.631451', 11, '2026-04-18 19:18:48.631451', '', '', '', '');
INSERT INTO "public"."medical_records" VALUES (NULL, 12, '2026-04-18 19:18:48.633445', 12, '2026-04-18 19:18:48.633445', '', '', '', '');
INSERT INTO "public"."medical_records" VALUES (NULL, 13, '2026-04-21 15:40:55.922745', 13, '2026-04-21 15:40:55.922745', '', '', '', '');

-- ----------------------------
-- Table structure for order_items
-- ----------------------------
DROP TABLE IF EXISTS "public"."order_items";
CREATE TABLE "public"."order_items" (
  "price" numeric(10,2) NOT NULL,
  "quantity" int4 NOT NULL,
  "created_at" timestamp(6) NOT NULL,
  "id" int8 NOT NULL GENERATED BY DEFAULT AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "order_id" int8 NOT NULL,
  "product_id" int8 NOT NULL,
  "updated_at" timestamp(6)
)
;

-- ----------------------------
-- Records of order_items
-- ----------------------------
INSERT INTO "public"."order_items" VALUES (185000.00, 1, '2026-04-18 19:33:06.869741', 2, 2, 7, '2026-04-18 19:33:06.869741');
INSERT INTO "public"."order_items" VALUES (185000.00, 1, '2026-04-18 19:43:57.081133', 3, 3, 7, '2026-04-18 19:43:57.081133');
INSERT INTO "public"."order_items" VALUES (185000.00, 2, '2026-04-18 19:47:10.343315', 4, 4, 7, '2026-04-18 19:47:10.343315');
INSERT INTO "public"."order_items" VALUES (2000.00, 4, '2026-04-22 00:12:47.58195', 5, 5, 62, '2026-04-22 00:12:47.58195');
INSERT INTO "public"."order_items" VALUES (35000.00, 1, '2026-04-22 00:12:47.583979', 6, 5, 8, '2026-04-22 00:12:47.583979');

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS "public"."orders";
CREATE TABLE "public"."orders" (
  "total_amount" numeric(10,2) NOT NULL,
  "created_at" timestamp(6) NOT NULL,
  "id" int8 NOT NULL GENERATED BY DEFAULT AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "updated_at" timestamp(6),
  "user_id" int8 NOT NULL,
  "notes" text COLLATE "pg_catalog"."default",
  "order_number" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "payment_method" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "payment_status" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "shipping_address" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(255) COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO "public"."orders" VALUES (185000.00, '2026-04-18 19:33:06.843845', 2, '2026-04-18 19:33:06.893678', 4, '', 'ORD2', 'COD', 'PENDING', 'hgfhfghgf', 'DELIVERED');
INSERT INTO "public"."orders" VALUES (185000.00, '2026-04-18 19:43:57.076147', 3, '2026-04-18 19:43:57.088115', 4, '', 'ORD3', 'COD', 'PENDING', 'n,mnm,', 'DELIVERED');
INSERT INTO "public"."orders" VALUES (370000.00, '2026-04-18 19:47:10.340293', 4, '2026-04-18 19:47:10.347306', 3, '', 'ORD4', 'COD', 'PENDING', 'sdfghjk', 'DELIVERED');
INSERT INTO "public"."orders" VALUES (43000.00, '2026-04-22 00:12:47.570931', 5, '2026-04-22 00:12:47.597041', 4, '', 'ORD5', 'COD', 'PENDING', 'sadsad', 'DELIVERED');

-- ----------------------------
-- Table structure for pet_services
-- ----------------------------
DROP TABLE IF EXISTS "public"."pet_services";
CREATE TABLE "public"."pet_services" (
  "duration" int4 NOT NULL,
  "price" numeric(10,2) NOT NULL,
  "created_at" timestamp(6) NOT NULL,
  "id" int8 NOT NULL GENERATED BY DEFAULT AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "updated_at" timestamp(6),
  "category" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "image_url" varchar(255) COLLATE "pg_catalog"."default",
  "title" varchar(255) COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Records of pet_services
-- ----------------------------
INSERT INTO "public"."pet_services" VALUES (30, 150000.00, '2026-02-06 21:04:28.699367', 1, '2026-05-03 23:32:20.81667', 'medical', 'Khám sức khỏe tổng quát cho thú cưng, kiểm tra tim mạch, hô hấp', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777825940/PetsClinic/Services/yd0cmjztnwhm0naoexro.webp', 'Khám tổng quát');
INSERT INTO "public"."pet_services" VALUES (15, 200000.00, '2026-02-06 21:04:28.699367', 2, '2026-05-03 23:43:33.502506', 'medical', 'Tiêm vaccine phòng bệnh cho chó mèo theo lịch', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777826614/PetsClinic/Services/alkqcr9egc0sob8qstiw.jpg', 'Tiêm phòng');
INSERT INTO "public"."pet_services" VALUES (30, 300000.00, '2026-02-06 21:04:28.699367', 3, '2026-05-03 23:44:05.341272', 'medical', 'Siêu âm chẩn đoán bệnh lý nội tạng', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777826645/PetsClinic/Services/aw5aob0s3qpgikzooxq1.webp', 'Siêu âm');
INSERT INTO "public"."pet_services" VALUES (45, 250000.00, '2026-02-06 21:04:28.699367', 4, '2026-05-03 23:45:34.94192', 'medical', 'Xét nghiệm công thức máu, sinh hóa máu', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777826735/PetsClinic/Services/vaykxe8m1aoekk5hn6td.webp', 'Xét nghiệm máu');
INSERT INTO "public"."pet_services" VALUES (60, 150000.00, '2026-02-06 21:04:28.699367', 6, '2026-05-03 23:49:03.570214', 'grooming', 'Cắt tỉa lông theo yêu cầu, tạo kiểu', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777826943/PetsClinic/Services/vwybela39xgwenjuvjpa.jpg', 'Cắt tỉa lông');
INSERT INTO "public"."pet_services" VALUES (45, 100000.00, '2026-02-06 21:04:28.699367', 5, '2026-05-03 23:51:40.727356', 'grooming', 'Dịch vụ tắm gội, sấy khô cho thú cưng', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777827101/PetsClinic/Services/bbtndyonuisdjmel7idm.webp', 'Tắm gội cơ bản');
INSERT INTO "public"."pet_services" VALUES (90, 220000.00, '2026-02-06 21:04:28.699367', 7, '2026-05-03 23:51:53.75711', 'grooming', 'Trọn gói tắm gội và cắt tỉa lông', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777827114/PetsClinic/Services/tnq7v84ri2wftqpmyjda.webp', 'Combo tắm + cắt tỉa');
INSERT INTO "public"."pet_services" VALUES (15, 50000.00, '2026-02-06 21:04:28.699367', 8, '2026-05-03 23:52:56.203685', 'grooming', 'Vệ sinh tai, loại bỏ ráy tai an toàn', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777827176/PetsClinic/Services/hurdoryjscbbsfqc2cfy.webp', 'Vệ sinh tai');
INSERT INTO "public"."pet_services" VALUES (480, 150000.00, '2026-02-06 21:04:28.699367', 9, '2026-05-03 23:53:16.932791', 'boarding', 'Dịch vụ giữ thú cưng trong ngày', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777827197/PetsClinic/Services/olwrkzcyospt4jdwzffj.webp', 'Khách sạn thú cưng (ngày)');
INSERT INTO "public"."pet_services" VALUES (1440, 250000.00, '2026-02-06 21:04:28.699367', 10, '2026-05-03 23:54:06.990729', 'boarding', 'Dịch vụ giữ thú cưng qua đêm', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777827247/PetsClinic/Services/ugxactes91dvx4fgkxml.jpg', 'Khách sạn thú cưng (đêm)');
INSERT INTO "public"."pet_services" VALUES (90, 500000.00, '2026-02-06 21:04:28.699367', 11, '2026-05-03 23:54:21.317747', 'training', 'Huấn luyện các lệnh cơ bản: ngồi, nằm, lại đây', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777827261/PetsClinic/Services/bi89vwh68za7igbdfocd.webp', 'Huấn luyện cơ bản');
INSERT INTO "public"."pet_services" VALUES (120, 800000.00, '2026-02-06 21:04:28.699367', 12, '2026-05-03 23:54:41.98358', 'training', 'Huấn luyện các kỹ năng nâng cao cho chó', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777827282/PetsClinic/Services/q5dt11yr8prhmhkobfku.webp', 'Huấn luyện nâng cao');

-- ----------------------------
-- Table structure for pets
-- ----------------------------
DROP TABLE IF EXISTS "public"."pets";
CREATE TABLE "public"."pets" (
  "age" int4,
  "weight" float8,
  "created_at" timestamp(6) NOT NULL,
  "id" int8 NOT NULL GENERATED BY DEFAULT AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "updated_at" timestamp(6),
  "user_id" int8 NOT NULL,
  "breed" varchar(255) COLLATE "pg_catalog"."default",
  "gender" varchar(255) COLLATE "pg_catalog"."default",
  "image_url" varchar(255) COLLATE "pg_catalog"."default",
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "notes" text COLLATE "pg_catalog"."default",
  "species" varchar(255) COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Records of pets
-- ----------------------------
INSERT INTO "public"."pets" VALUES (12, 12, '2026-04-15 14:53:09.763877', 1, '2026-04-15 14:53:09.763877', 4, 'con ngựa', 'MALE', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1776239588/PetsClinic/eybmc3t3s8pabpnbzqf3.jpg', 'zom', '', 'DOG');
INSERT INTO "public"."pets" VALUES (12, 12, '2026-04-15 14:53:27.093037', 2, '2026-04-22 00:05:43.649118', 4, 'chos', 'MALE', '/assets/default-dog.svg', 'con chos', '', 'DOG');
INSERT INTO "public"."pets" VALUES (12, 12, '2026-04-29 19:36:17.994482', 3, '2026-04-29 19:36:17.994482', 2, 'không biết', 'MALE', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777466176/PetsClinic/ac4dvw3axagfr5eibzff.jpg', 'chó giả ', '', 'DOG');

-- ----------------------------
-- Table structure for product_reviews
-- ----------------------------
DROP TABLE IF EXISTS "public"."product_reviews";
CREATE TABLE "public"."product_reviews" (
  "id" int8 NOT NULL GENERATED BY DEFAULT AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "created_at" timestamp(6) NOT NULL,
  "updated_at" timestamp(6),
  "comment" text COLLATE "pg_catalog"."default",
  "rating" int4 NOT NULL,
  "product_id" int8 NOT NULL,
  "user_id" int8 NOT NULL
)
;

-- ----------------------------
-- Records of product_reviews
-- ----------------------------
INSERT INTO "public"."product_reviews" VALUES (1, '2026-04-18 19:34:18.695303', '2026-04-18 19:34:18.695303', 'cũng ổn ', 4, 7, 4);
INSERT INTO "public"."product_reviews" VALUES (2, '2026-04-18 19:47:42.299604', '2026-04-18 19:47:42.299604', 'ưerty
sdhjklc bn
vk
ghjghj', 5, 7, 3);

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS "public"."products";
CREATE TABLE "public"."products" (
  "price" numeric(10,2) NOT NULL,
  "stock" int4 NOT NULL,
  "created_at" timestamp(6) NOT NULL,
  "id" int8 NOT NULL GENERATED BY DEFAULT AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "updated_at" timestamp(6),
  "brand" varchar(255) COLLATE "pg_catalog"."default",
  "category" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "image_url" varchar(255) COLLATE "pg_catalog"."default",
  "material" varchar(255) COLLATE "pg_catalog"."default",
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "volume" varchar(255) COLLATE "pg_catalog"."default",
  "weight" varchar(255) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of products
-- ----------------------------
INSERT INTO "public"."products" VALUES (25000.00, 120, '2026-03-30 17:10:01.622487', 11, '2026-03-30 17:10:01.622487', 'Ciao', 'food', 'Pate mềm cho mèo, nhiều vị: cá, gà, tôm', '/assets/pate-meo-ciao.webp', NULL, 'Pate cho mèo Ciao', NULL, '80g');
INSERT INTO "public"."products" VALUES (280000.00, 35, '2026-03-30 17:10:01.622487', 12, '2026-03-30 17:10:01.622487', 'Purina', 'food', 'Thức ăn cho mèo con dưới 12 tháng tuổi, bổ sung taurine', '/assets/hat-meo-con-purina.jpg', NULL, 'Hạt cho mèo con Purina', NULL, '1.5kg');
INSERT INTO "public"."products" VALUES (85000.00, 50, '2026-03-30 17:10:01.622487', 13, '2026-03-30 17:10:01.622487', 'PetLove', 'accessories', 'Vòng cổ da PU có thể khắc tên, nhiều màu sắc', '/assets/vong-co-cho-meo.jpg', 'Da PU', 'Vòng cổ chó mèo có tên', NULL, NULL);
INSERT INTO "public"."products" VALUES (75000.00, 45, '2026-03-30 17:10:01.622487', 14, '2026-03-30 17:10:01.622487', 'PetHome', 'accessories', 'Bát ăn inox 2 ngăn, chống gỉ, dễ vệ sinh', '/assets/bat-an-inox.webp', 'Inox 304', 'Bát ăn inox đôi cho thú cưng', NULL, NULL);
INSERT INTO "public"."products" VALUES (450000.00, 20, '2026-03-30 17:10:01.622487', 15, '2026-03-30 17:10:01.622487', 'PetTravel', 'accessories', 'Lồng nhựa có tay xách, thông thoáng, an toàn cho thú cưng', '/assets/long-van-chuyen.jpg', 'Nhựa ABS', 'Lồng vận chuyển thú cưng', NULL, NULL);
INSERT INTO "public"."products" VALUES (45000.00, 60, '2026-03-30 17:10:01.622487', 16, '2026-03-30 17:10:01.622487', 'PetFun', 'accessories', 'Cần câu lông vũ cho mèo, kích thích vận động', '/assets/can-cau-meo.jpg', NULL, 'Đồ chơi cần câu mèo', NULL, NULL);
INSERT INTO "public"."products" VALUES (220000.00, 25, '2026-03-30 17:10:01.622487', 17, '2026-03-30 17:10:01.622487', 'PetHome', 'accessories', 'Nhà ngủ lều vải mềm, ấm áp, có thể gấp gọn', '/assets/nha-ngu-thu-cung.jpg', 'Vải nỉ', 'Nhà ngủ cho thú cưng', NULL, NULL);
INSERT INTO "public"."products" VALUES (120000.00, 40, '2026-03-30 17:10:01.622487', 18, '2026-03-30 17:10:01.622487', 'SOS', 'grooming', 'Sữa tắm diệt ve, bọ chét cho chó, an toàn với da', '/assets/sua-tam-cho-sos.jpg', NULL, 'Sữa tắm cho chó SOS', '300ml', NULL);
INSERT INTO "public"."products" VALUES (65000.00, 55, '2026-03-30 17:10:01.622487', 19, '2026-03-30 17:10:01.622487', 'PetGroom', 'grooming', 'Lược chải lông 2 mặt, loại bỏ lông rụng hiệu quả', '/assets/luoc-chai-long.jpg', 'Nhựa + Inox', 'Lược chải lông thú cưng', NULL, NULL);
INSERT INTO "public"."products" VALUES (95000.00, 30, '2026-03-30 17:10:01.622487', 20, '2026-03-30 17:10:01.622487', 'Beaphar', 'grooming', 'Nước hoa dành riêng cho thú cưng, hương thơm nhẹ nhàng', '/assets/nuoc-hoa-thu-cung.webp', NULL, 'Nước hoa thú cưng Beaphar', '150ml', NULL);
INSERT INTO "public"."products" VALUES (145000.00, 50, '2026-03-30 17:10:01.622487', 22, '2026-03-30 17:10:01.622487', 'Beaphar', 'medicine', 'Viên nhai bổ sung vitamin và khoáng chất cho chó mèo', '/assets/vitamin-thu-cung.jpg', NULL, 'Vitamin tổng hợp cho thú cưng', NULL, '150 viên');
INSERT INTO "public"."products" VALUES (420000.00, 30, '2026-03-30 17:10:01.758617', 23, '2026-03-30 17:10:01.758617', 'Royal Canin', 'food', 'Thức ăn khô cho chó cỡ vừa, hỗ trợ tiêu hoá và lông mượt', '/assets/hat-cho-royal-canin.jpg', NULL, 'Hạt cho chó Royal Canin Medium', NULL, '2kg');
INSERT INTO "public"."products" VALUES (55000.00, 90, '2026-03-30 17:10:01.758617', 24, '2026-03-30 17:10:01.758617', 'Pedigree', 'food', 'Que gặm làm sạch răng cho chó, giảm cao răng hiệu quả', '/assets/xuong-gam-dentastix.jpg', NULL, 'Xương gặm cho chó Dentastix', NULL, '180g');
INSERT INTO "public"."products" VALUES (28000.00, 100, '2026-03-30 17:10:01.758617', 25, '2026-03-30 17:10:01.758617', 'Alpo', 'food', 'Thức ăn đóng hộp cho chó trưởng thành, vị gà và rau củ', '/assets/thuc-an-uot-alpo.webp', NULL, 'Thức ăn ướt cho chó Alpo', NULL, '400g');
INSERT INTO "public"."products" VALUES (48000.00, 75, '2026-03-30 17:10:01.758617', 26, '2026-03-30 17:10:01.758617', 'Temptations', 'food', 'Bánh thưởng cho chó, giàu protein, nhiều vị hấp dẫn', '/assets/snack-cho-temptations.jpg', NULL, 'Snack thưởng cho chó Temptations', NULL, '100g');
INSERT INTO "public"."products" VALUES (380000.00, 28, '2026-03-30 17:10:01.758617', 27, '2026-03-30 17:10:01.758617', 'Royal Canin', 'food', 'Thức ăn cho mèo nuôi trong nhà, kiểm soát búi lông', '/assets/hat-meo-royal-canin.jpg', NULL, 'Hạt cho mèo Royal Canin Indoor', NULL, '2kg');
INSERT INTO "public"."products" VALUES (42000.00, 110, '2026-03-30 17:10:01.758617', 28, '2026-03-30 17:10:01.758617', 'Temptations', 'food', 'Bánh thưởng giòn rụm cho mèo, vị cá hồi', '/assets/snack-meo-temptations.jpg', NULL, 'Snack thưởng cho mèo Temptations', NULL, '85g');
INSERT INTO "public"."products" VALUES (32000.00, 95, '2026-03-30 17:10:01.758617', 29, '2026-03-30 17:10:01.758617', 'Fancy Feast', 'food', 'Pate cao cấp cho mèo trưởng thành, vị tôm và cá', '/assets/fancy-feast-meo.jpg', NULL, 'Thức ăn ướt cho mèo Fancy Feast', NULL, '85g');
INSERT INTO "public"."products" VALUES (95000.00, 40, '2026-03-30 17:10:01.758617', 30, '2026-03-30 17:10:01.758617', 'PetLove', 'accessories', 'Dây dắt chó dài 1.5m, tay cầm bọc đệm êm, chịu lực tốt', '/assets/day-dat-cho.jpg', 'Nylon', 'Dây dắt chó có tay cầm đệm', NULL, NULL);
INSERT INTO "public"."products" VALUES (135000.00, 30, '2026-03-30 17:10:01.758617', 31, '2026-03-30 17:10:01.758617', 'PetFashion', 'accessories', 'Áo mưa trong suốt cho thú cưng, có mũ trùm đầu, size S-XL', '/assets/ao-mua-thu-cung.jpg', 'Nhựa PVC', 'Áo mưa cho chó mèo', NULL, NULL);
INSERT INTO "public"."products" VALUES (350000.00, 15, '2026-03-30 17:10:01.758617', 32, '2026-03-30 17:10:01.758617', 'PetHome', 'accessories', 'Đệm memory foam cao cấp, chống thấm, có thể giặt máy', '/assets/dem-nam-memory-foam.jpg', 'Memory Foam', 'Đệm nằm memory foam cho thú cưng', NULL, NULL);
INSERT INTO "public"."products" VALUES (285000.00, 22, '2026-03-30 17:10:01.758617', 33, '2026-03-30 17:10:01.758617', 'PetAqua', 'accessories', 'Máy lọc nước tự động 2L, có lọc than hoạt tính, yên tĩnh', '/assets/may-uong-nuoc-tu-dong.webp', 'Nhựa ABS', 'Máy uống nước tự động thú cưng', NULL, NULL);
INSERT INTO "public"."products" VALUES (520000.00, 18, '2026-03-30 17:10:01.758617', 34, '2026-03-30 17:10:01.758617', 'PetTravel', 'accessories', 'Balo có cửa sổ tròn trong suốt, thông thoáng, tải trọng 6kg', '/assets/balo-van-chuyen-meo.webp', 'Nhựa PC + Vải', 'Balo vận chuyển mèo trong suốt', NULL, NULL);
INSERT INTO "public"."products" VALUES (145000.00, 35, '2026-03-30 17:10:01.758617', 35, '2026-03-30 17:10:01.758617', 'Bio-Groom', 'grooming', 'Sữa tắm dịu nhẹ cho mèo, pH cân bằng, không cay mắt', '/assets/sua-tam-meo-biogroom.webp', NULL, 'Sữa tắm cho mèo Bio-Groom', '250ml', NULL);
INSERT INTO "public"."products" VALUES (320000.00, 20, '2026-03-30 17:10:01.758617', 36, '2026-03-30 17:10:01.758617', 'PetGroom', 'grooming', 'Tông đơ không dây, 4 đầu lược, động cơ im lặng', '/assets/tong-do-cat-long.webp', 'Nhựa + Inox', 'Tông đơ cắt lông thú cưng', NULL, NULL);
INSERT INTO "public"."products" VALUES (38000.00, 65, '2026-03-30 17:10:01.758617', 37, '2026-03-30 17:10:01.758617', 'PetClean', 'grooming', 'Khăn ướt kháng khuẩn cho thú cưng, hương phấn nhẹ, 80 tờ/gói', '/assets/khan-uot-thu-cung.png', NULL, 'Khăn ướt vệ sinh thú cưng', NULL, '200g');
INSERT INTO "public"."products" VALUES (95000.00, 60, '2026-03-30 17:10:01.758617', 38, '2026-03-30 17:10:01.758617', 'Cazitel', 'medicine', 'Viên tẩy giun phổ rộng cho chó mèo, an toàn từ 2 tuần tuổi', '/assets/thuoc-tay-giun-cazitel.jpg', NULL, 'Thuốc tẩy giun cho chó mèo Cazitel', NULL, '4 viên');
INSERT INTO "public"."products" VALUES (125000.00, 45, '2026-03-30 17:10:01.758617', 39, '2026-03-30 17:10:01.758617', 'VetPro', 'medicine', 'Bột men vi sinh hỗ trợ tiêu hoá, giảm tiêu chảy cho chó mèo', '/assets/men-tieu-hoa-probiotic.webp', NULL, 'Men tiêu hoá cho thú cưng Probiotic', NULL, '30 gói');
INSERT INTO "public"."products" VALUES (85000.00, 40, '2026-03-30 17:10:01.758617', 40, '2026-03-30 17:10:01.758617', 'Optixcare', 'medicine', 'Dung dịch nhỏ mắt làm sạch, giảm ghèn và viêm nhẹ', '/assets/nho-mat-optixcare.webp', NULL, 'Nhỏ mắt cho chó mèo Optixcare', '20ml', NULL);
INSERT INTO "public"."products" VALUES (75000.00, 38, '2026-03-30 17:10:01.758617', 41, '2026-03-30 17:10:01.758617', 'PetDerm', 'medicine', 'Kem dưỡng ẩm mũi bị khô nứt cho chó mèo, thành phần tự nhiên', '/assets/kem-duong-mui-thu-cung.jpg', NULL, 'Kem dưỡng mũi cho thú cưng', NULL, '30g');
INSERT INTO "public"."products" VALUES (180000.00, 0, '2026-03-30 17:10:01.622487', 21, '2026-04-23 13:17:35.432926', 'Frontline', 'medicine', 'Thuốc nhỏ gáy diệt ve, bọ chét, hiệu quả 1 tháng', '/assets/nho-gay-frontline.jpg', NULL, 'Nhỏ gáy diệt ve chó Frontline', NULL, NULL);
INSERT INTO "public"."products" VALUES (35000.00, 81, '2026-03-30 17:10:01.622487', 8, '2026-04-26 16:45:04.52863', 'Ganador', 'food', 'Pate thịt bò cho chó, giàu protein, dễ tiêu hoá', '/assets/pate-cho-ganador.jpg', NULL, 'Pate cho chó Ganador', NULL, '400g');
INSERT INTO "public"."products" VALUES (320000.00, 41, '2026-03-30 17:10:01.622487', 9, '2026-04-26 16:45:10.169716', 'Nutrience', 'food', 'Thức ăn dành riêng cho chó con dưới 1 tuổi, giàu DHA', '/assets/hat-cho-con-nutrience.jpg', NULL, 'Hạt cho chó con Nutrience', NULL, '2kg');
INSERT INTO "public"."products" VALUES (95000.00, 72, '2026-03-30 17:10:01.622487', 10, '2026-04-26 16:45:23.290279', 'Whiskas', 'food', 'Thức ăn khô cho mèo trưởng thành, vị cá ngừ', '/assets/hat-meo-whiskas.jpg', NULL, 'Hạt cho mèo Whiskas', NULL, '1.2kg');
INSERT INTO "public"."products" VALUES (110000.00, 42, '2026-03-30 17:10:01.758617', 42, '2026-03-30 17:10:01.758617', 'Micovet', 'medicine', 'Gel kháng nấm ngoài da cho chó mèo, dùng được vùng nhạy cảm', '/assets/gel-tri-nam-micovet.jpg', NULL, 'Gel bôi ngoài da trị nấm Micovet', NULL, '30g');
INSERT INTO "public"."products" VALUES (35000.00, 80, '2026-03-30 17:10:01.815529', 43, '2026-03-30 17:10:01.815529', 'BirdFood', 'food', 'Hạt hướng dương sạch cho chim cảnh, giàu chất béo và protein', '/assets/hat-huong-duong-chim.jpg', NULL, 'Hạt hướng dương cho chim', NULL, '500g');
INSERT INTO "public"."products" VALUES (28000.00, 90, '2026-03-30 17:10:01.815529', 44, '2026-03-30 17:10:01.815529', 'BirdFood', 'food', 'Hạt kê vàng dinh dưỡng cho chim cu, chim vành khuyên', '/assets/hat-ke-chim.jpg', NULL, 'Hạt kê cho chim cảnh', NULL, '500g');
INSERT INTO "public"."products" VALUES (95000.00, 45, '2026-03-30 17:10:01.815529', 45, '2026-03-30 17:10:01.815529', 'ParrotMix', 'food', 'Hỗn hợp hạt và trái cây sấy khô dành riêng cho vẹt', '/assets/thuc-an-vet.jpg', NULL, 'Thức ăn hỗn hợp cho vẹt', NULL, '800g');
INSERT INTO "public"."products" VALUES (55000.00, 65, '2026-03-30 17:10:01.815529', 46, '2026-03-30 17:10:01.815529', 'HamsterMix', 'food', 'Hỗn hợp hạt ngũ cốc và rau củ sấy dành cho hamster', '/assets/hat-hamster.jpg', NULL, 'Hạt dinh dưỡng cho chuột hamster', NULL, '500g');
INSERT INTO "public"."products" VALUES (185000.00, 50, '2026-03-30 17:10:01.815529', 47, '2026-03-30 17:10:01.815529', 'Versele-Laga', 'food', 'Thức ăn hoàn chỉnh all-in-one cho hamster Syrian và Dwarf, giàu protein và xơ', '/assets/versele-laga-complete-hamster.webp', NULL, 'Thức ăn hamster Versele-Laga Complete Hamster', NULL, '500g');
INSERT INTO "public"."products" VALUES (155000.00, 55, '2026-03-30 17:10:01.815529', 48, '2026-03-30 17:10:01.815529', 'Vitakraft', 'food', 'Hỗn hợp hạt và ngũ cốc dinh dưỡng cho hamster, ít đường', '/assets/vitakraft-menu-hamster.webp', NULL, 'Thức ăn hamster Vitakraft Menu Vital', NULL, '400g');
INSERT INTO "public"."products" VALUES (45000.00, 80, '2026-03-30 17:10:01.815529', 49, '2026-03-30 17:10:01.815529', 'Alice', 'food', 'Rau củ sấy giòn nhiều chất xơ cho hamster, ngăn ngừa táo bón', '/assets/alice-rau-say-hamster.webp', NULL, 'Snack rau sấy cho hamster Alice Rau Sấy Giòn', NULL, '70g');
INSERT INTO "public"."products" VALUES (35000.00, 90, '2026-03-30 17:10:01.815529', 50, '2026-03-30 17:10:01.815529', 'Jolly', 'food', 'Bánh mài răng vị sữa và dâu cho hamster, giảm stress và phòng bệnh răng miệng', '/assets/jolly-banh-mai-rang.webp', NULL, 'Bánh mài răng cho hamster Jolly', NULL, '50g');
INSERT INTO "public"."products" VALUES (220000.00, 35, '2026-03-30 17:10:01.815529', 51, '2026-03-30 17:10:01.815529', 'Versele-Laga', 'food', 'Thức ăn viên tự nhiên cho thỏ trưởng thành, giàu cỏ timothy và chất xơ', '/assets/versele-laga-cuni-nature.webp', NULL, 'Thức ăn cho thỏ Versele-Laga Cuni Nature', NULL, '750g');
INSERT INTO "public"."products" VALUES (195000.00, 38, '2026-03-30 17:10:01.815529', 52, '2026-03-30 17:10:01.815529', 'Vitakraft', 'food', 'Hỗn hợp hạt và rau củ sấy cho thỏ cảnh, bổ sung vitamin C và E', '/assets/vitakraft-vita-special-rabbit.jpg', NULL, 'Thức ăn cho thỏ Vitakraft Vita Special', NULL, '600g');
INSERT INTO "public"."products" VALUES (98000.00, 45, '2026-03-30 17:10:01.815529', 53, '2026-03-30 17:10:01.815529', 'Kaytee', 'food', 'Cỏ Timothy sấy khô nhập khẩu Mỹ, hỗ trợ tiêu hoá và mài răng cho thỏ', '/assets/kaytee-timothy-hay.webp', NULL, 'Cỏ khô Timothy cho thỏ Kaytee', NULL, '284g');
INSERT INTO "public"."products" VALUES (75000.00, 50, '2026-03-30 17:10:01.815529', 54, '2026-03-30 17:10:01.815529', 'Kaytee', 'food', 'Hỗn hợp trái cây và rau củ sấy làm snack cho thỏ, hamster và chuột lang', '/assets/kaytee-country-harvest.jpg', NULL, 'Snack thưởng cho thỏ và hamster Kaytee Country Harvest', NULL, '170g');
INSERT INTO "public"."products" VALUES (95000.00, 40, '2026-03-30 17:10:01.815529', 55, '2026-03-30 17:10:01.815529', 'Jolly', 'accessories', 'Bánh xe chạy yên tĩnh đường kính 18cm, trục không kẹp đuôi, an toàn cho hamster', '/assets/jolly-banh-xe-hamster.webp', 'Nhựa', 'Bánh xe chạy im lặng cho hamster Jolly', NULL, NULL);
INSERT INTO "public"."products" VALUES (485000.00, 15, '2026-03-30 17:10:01.815529', 56, '2026-03-30 17:10:01.815529', 'GEX', 'accessories', 'Chuồng hamster thiết kế Nhật Bản, thông thoáng, dễ vệ sinh, có ngăn chứa cát', '/assets/gex-hamster-house.jpg', 'Nhựa ABS', 'Chuồng hamster GEX Hamster House', NULL, NULL);
INSERT INTO "public"."products" VALUES (720000.00, 10, '2026-03-30 17:10:01.815529', 57, '2026-03-30 17:10:01.815529', 'Jolly', 'accessories', 'Chuồng lưới thép sơn tĩnh điện 2 tầng cho thỏ, có khay hứng và cửa mở rộng', '/assets/jolly-chuong-tho.jpg', 'Thép sơn tĩnh điện', 'Chuồng thỏ lưới Jolly Pet', NULL, NULL);
INSERT INTO "public"."products" VALUES (65000.00, 45, '2026-03-30 17:10:01.815529', 58, '2026-03-30 17:10:01.815529', 'Vitakraft', 'accessories', 'Bộ máng cỏ treo và bình nước nhỏ giọt dành cho thỏ và thú nhỏ', '/assets/vitakraft-mang-nuoc-tho.webp', 'Nhựa + Inox', 'Máng cỏ và bình nước cho thỏ Vitakraft', NULL, NULL);
INSERT INTO "public"."products" VALUES (68000.00, 55, '2026-03-30 17:10:01.815529', 59, '2026-03-30 17:10:01.815529', 'Vitakraft', 'grooming', 'Cát tắm mịn vô trùng cho hamster tự vệ sinh lông, không bụi, không mùi', '/assets/vitakraft-cat-tam-hamster.webp', NULL, 'Cát tắm cho hamster Vitakraft Hamster Sand', NULL, '1kg');
INSERT INTO "public"."products" VALUES (55000.00, 60, '2026-03-30 17:10:01.815529', 60, '2026-03-30 17:10:01.815529', 'Vitakraft', 'grooming', 'Dăm bào gỗ mềm siêu thấm hút cho chuồng hamster và thỏ, khử mùi tự nhiên', '/assets/vitakraft-dam-bao.jpg', NULL, 'Dăm bào lót chuồng Vitakraft Hamster Comfort', NULL, '1kg');
INSERT INTO "public"."products" VALUES (145000.00, 35, '2026-03-30 17:10:01.815529', 61, '2026-03-30 17:10:01.815529', 'Beaphar', 'medicine', 'Viên nhai bổ sung vitamin C, D và khoáng chất cho thỏ cảnh', '/assets/beaphar-vitamin-tho.webp', NULL, 'Vitamin tổng hợp cho thỏ Beaphar', NULL, '50 viên');
INSERT INTO "public"."products" VALUES (2000.00, 40, '2026-03-30 17:10:01.815529', 62, '2026-03-30 17:10:01.815529', 'Beaphar', 'medicine', 'Vitamin tổng hợp dạng nhỏ vào nước uống cho hamster, tăng đề kháng', '/assets/beaphar-vitamin-hamster.webp', NULL, 'Vitamin nhỏ nước cho hamster Beaphar Hamster Vitamin', '50ml', NULL);
INSERT INTO "public"."products" VALUES (185000.00, 24, '2026-03-30 17:10:01.622487', 7, '2026-04-26 21:41:46.651892', 'Pedigree', 'food', 'Thức ăn khô dành cho chó trưởng thành, bổ sung canxi và vitamin', '/assets/hat-cho-pedigree.webp', NULL, 'Hạt cho chó Pedigree Adult', NULL, '1.5kg');
INSERT INTO "public"."products" VALUES (1231421.00, 12, '2026-04-30 14:21:01.74448', 2, '2026-05-03 23:42:33.364139', 'Pedigree', 'food', '321321321312321', 'https://res.cloudinary.com/dm1xwivqn/image/upload/v1777826553/PetsClinic/Products/dub4vfv2hqzbl312jkh4.jpg', '32', 'chó + rau củ quả 123', '5 kí', '3123');

-- ----------------------------
-- Table structure for reviews
-- ----------------------------
DROP TABLE IF EXISTS "public"."reviews";
CREATE TABLE "public"."reviews" (
  "id" int8 NOT NULL GENERATED BY DEFAULT AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "created_at" timestamp(6) NOT NULL,
  "updated_at" timestamp(6),
  "booking_code" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "comment" text COLLATE "pg_catalog"."default",
  "rating" int4 NOT NULL,
  "user_id" int8 NOT NULL
)
;

-- ----------------------------
-- Records of reviews
-- ----------------------------
INSERT INTO "public"."reviews" VALUES (1, '2026-04-18 19:08:10.195509', '2026-04-18 19:08:10.195509', 'BK-20260415-145903-3b33', 'ổn nhưng giá hơi mắc 
', 3, 4);
INSERT INTO "public"."reviews" VALUES (2, '2026-04-18 19:08:38.321917', '2026-04-18 19:08:38.322914', 'BK-20260418-185258-b962', '10đ, giá cả hợp lí, phòng khám sạch sẽ, tay nghề chuyên nghiệp', 5, 4);
INSERT INTO "public"."reviews" VALUES (3, '2026-04-18 19:17:38.398499', '2026-04-18 19:17:38.398499', 'BK-20260418-191530-82fb', 'dfkalkdsadsa', 5, 4);
INSERT INTO "public"."reviews" VALUES (4, '2026-04-18 19:17:45.237029', '2026-04-18 19:17:45.237029', 'BK-20260418-191557-bbc3', '.', 5, 4);
INSERT INTO "public"."reviews" VALUES (5, '2026-04-18 19:17:50.544432', '2026-04-18 19:17:50.544432', 'BK-20260418-191509-e2b3', '.', 5, 4);
INSERT INTO "public"."reviews" VALUES (6, '2026-04-18 19:17:52.856829', '2026-04-18 19:17:52.856829', 'BK-20260418-191540-93ed', 'dfg', 5, 4);
INSERT INTO "public"."reviews" VALUES (7, '2026-04-18 19:19:38.027626', '2026-04-18 19:19:38.027626', 'BK-20260418-191609-40d5', 'bla bla', 5, 4);
INSERT INTO "public"."reviews" VALUES (8, '2026-04-18 19:19:42.874535', '2026-04-18 19:19:42.874535', 'BK-20260418-191848-de3c', 'ok', 5, 4);

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
  "created_at" timestamp(6) NOT NULL,
  "id" int8 NOT NULL GENERATED BY DEFAULT AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "updated_at" timestamp(6),
  "address" varchar(255) COLLATE "pg_catalog"."default",
  "email" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "full_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "password" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "phone" varchar(255) COLLATE "pg_catalog"."default",
  "role" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(255) COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO "public"."users" VALUES ('2026-04-15 14:47:36.060991', 2, '2026-04-15 14:47:36.060991', NULL, 'admin@petclinic.com', 'Admin', 'admin123', NULL, 'ADMIN', 'ACTIVE');
INSERT INTO "public"."users" VALUES ('2026-04-15 14:47:36.06893', 3, '2026-04-15 14:47:36.06893', NULL, 'doctor@petclinic.com', 'BS. Nguyễn Văn An', 'doctor123', NULL, 'DOCTOR', 'ACTIVE');
INSERT INTO "public"."users" VALUES ('2026-04-15 14:47:35.870799', 1, '2026-05-05 13:18:53.922708', '123 Test Street', 'test@example.com', 'Test User', 'password123', '0123456789', 'USER', 'INACTIVE');
INSERT INTO "public"."users" VALUES ('2026-04-15 14:52:25.422704', 4, '2026-05-05 14:55:06.785652', NULL, 'duongproduction29@gmail.com', 'Dương Production', 'GOOGLE_AUTH', NULL, 'USER', 'INACTIVE');

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."appointments_id_seq"
OWNED BY "public"."appointments"."id";
SELECT setval('"public"."appointments_id_seq"', 13, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."cart_items_id_seq"
OWNED BY "public"."cart_items"."id";
SELECT setval('"public"."cart_items_id_seq"', 15, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."carts_id_seq"
OWNED BY "public"."carts"."id";
SELECT setval('"public"."carts_id_seq"', 3, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."medical_records_id_seq"
OWNED BY "public"."medical_records"."id";
SELECT setval('"public"."medical_records_id_seq"', 13, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."order_items_id_seq"
OWNED BY "public"."order_items"."id";
SELECT setval('"public"."order_items_id_seq"', 6, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."orders_id_seq"
OWNED BY "public"."orders"."id";
SELECT setval('"public"."orders_id_seq"', 5, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."pet_services_id_seq"
OWNED BY "public"."pet_services"."id";
SELECT setval('"public"."pet_services_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."pets_id_seq"
OWNED BY "public"."pets"."id";
SELECT setval('"public"."pets_id_seq"', 3, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."product_reviews_id_seq"
OWNED BY "public"."product_reviews"."id";
SELECT setval('"public"."product_reviews_id_seq"', 2, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."products_id_seq"
OWNED BY "public"."products"."id";
SELECT setval('"public"."products_id_seq"', 2, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."reviews_id_seq"
OWNED BY "public"."reviews"."id";
SELECT setval('"public"."reviews_id_seq"', 8, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."users_id_seq"
OWNED BY "public"."users"."id";
SELECT setval('"public"."users_id_seq"', 4, true);

-- ----------------------------
-- Auto increment value for appointments
-- ----------------------------
SELECT setval('"public"."appointments_id_seq"', 13, true);

-- ----------------------------
-- Checks structure for table appointments
-- ----------------------------
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_status_check" CHECK (status::text = ANY (ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying]::text[]));

-- ----------------------------
-- Primary Key structure for table appointments
-- ----------------------------
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Auto increment value for cart_items
-- ----------------------------
SELECT setval('"public"."cart_items_id_seq"', 15, true);

-- ----------------------------
-- Uniques structure for table cart_items
-- ----------------------------
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_cart_id_product_id_key" UNIQUE ("cart_id", "product_id");
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "uk6oue0maw421roerltnxn16a38" UNIQUE ("cart_id", "product_id");

-- ----------------------------
-- Primary Key structure for table cart_items
-- ----------------------------
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Auto increment value for carts
-- ----------------------------
SELECT setval('"public"."carts_id_seq"', 3, true);

-- ----------------------------
-- Uniques structure for table carts
-- ----------------------------
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_user_id_key" UNIQUE ("user_id");

-- ----------------------------
-- Primary Key structure for table carts
-- ----------------------------
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Auto increment value for medical_records
-- ----------------------------
SELECT setval('"public"."medical_records_id_seq"', 13, true);

-- ----------------------------
-- Uniques structure for table medical_records
-- ----------------------------
ALTER TABLE "public"."medical_records" ADD CONSTRAINT "medical_records_appointment_id_key" UNIQUE ("appointment_id");

-- ----------------------------
-- Primary Key structure for table medical_records
-- ----------------------------
ALTER TABLE "public"."medical_records" ADD CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Auto increment value for order_items
-- ----------------------------
SELECT setval('"public"."order_items_id_seq"', 6, true);

-- ----------------------------
-- Primary Key structure for table order_items
-- ----------------------------
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Auto increment value for orders
-- ----------------------------
SELECT setval('"public"."orders_id_seq"', 5, true);

-- ----------------------------
-- Uniques structure for table orders
-- ----------------------------
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");

-- ----------------------------
-- Checks structure for table orders
-- ----------------------------
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_payment_status_check" CHECK (payment_status::text = ANY (ARRAY['PENDING'::character varying, 'PAID'::character varying, 'FAILED'::character varying]::text[]));
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_status_check" CHECK (status::text = ANY (ARRAY['PENDING'::character varying, 'PROCESSING'::character varying, 'SHIPPED'::character varying, 'DELIVERED'::character varying, 'CANCELLED'::character varying]::text[]));

-- ----------------------------
-- Primary Key structure for table orders
-- ----------------------------
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Auto increment value for pet_services
-- ----------------------------
SELECT setval('"public"."pet_services_id_seq"', 1, false);

-- ----------------------------
-- Primary Key structure for table pet_services
-- ----------------------------
ALTER TABLE "public"."pet_services" ADD CONSTRAINT "pet_services_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Auto increment value for pets
-- ----------------------------
SELECT setval('"public"."pets_id_seq"', 3, true);

-- ----------------------------
-- Checks structure for table pets
-- ----------------------------
ALTER TABLE "public"."pets" ADD CONSTRAINT "pets_species_check" CHECK (species::text = ANY (ARRAY['DOG'::character varying, 'CAT'::character varying, 'BIRD'::character varying, 'RABBIT'::character varying, 'HAMSTER'::character varying, 'OTHER'::character varying]::text[]));
ALTER TABLE "public"."pets" ADD CONSTRAINT "pets_gender_check" CHECK (gender::text = ANY (ARRAY['MALE'::character varying, 'FEMALE'::character varying]::text[]));

-- ----------------------------
-- Primary Key structure for table pets
-- ----------------------------
ALTER TABLE "public"."pets" ADD CONSTRAINT "pets_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Auto increment value for product_reviews
-- ----------------------------
SELECT setval('"public"."product_reviews_id_seq"', 2, true);

-- ----------------------------
-- Primary Key structure for table product_reviews
-- ----------------------------
ALTER TABLE "public"."product_reviews" ADD CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Auto increment value for products
-- ----------------------------
SELECT setval('"public"."products_id_seq"', 2, true);

-- ----------------------------
-- Primary Key structure for table products
-- ----------------------------
ALTER TABLE "public"."products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Auto increment value for reviews
-- ----------------------------
SELECT setval('"public"."reviews_id_seq"', 8, true);

-- ----------------------------
-- Primary Key structure for table reviews
-- ----------------------------
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Auto increment value for users
-- ----------------------------
SELECT setval('"public"."users_id_seq"', 4, true);

-- ----------------------------
-- Uniques structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");

-- ----------------------------
-- Checks structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_role_check" CHECK (role::text = ANY (ARRAY['USER'::character varying, 'ADMIN'::character varying, 'DOCTOR'::character varying]::text[]));
ALTER TABLE "public"."users" ADD CONSTRAINT "users_status_check" CHECK (status::text = ANY (ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying]::text[]));

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table appointment_services
-- ----------------------------
ALTER TABLE "public"."appointment_services" ADD CONSTRAINT "fk7smp9csy21h26g51aii9gvfn8" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."appointment_services" ADD CONSTRAINT "fksur5ashgueygkm7jameh178k5" FOREIGN KEY ("service_id") REFERENCES "public"."pet_services" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table appointments
-- ----------------------------
ALTER TABLE "public"."appointments" ADD CONSTRAINT "fk62dl3dvwsbveq3vv067becwmj" FOREIGN KEY ("pet_id") REFERENCES "public"."pets" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."appointments" ADD CONSTRAINT "fk6u6s6egu60m2cbdjno44jbipa" FOREIGN KEY ("doctor_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."appointments" ADD CONSTRAINT "fk886ced1atxgvnf1o3oxtj5m4s" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table cart_items
-- ----------------------------
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "fk1re40cjegsfvw58xrkdp6bac6" FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "fkpcttvuq4mxppo8sxggjtn5i2c" FOREIGN KEY ("cart_id") REFERENCES "public"."carts" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table carts
-- ----------------------------
ALTER TABLE "public"."carts" ADD CONSTRAINT "fkb5o626f86h46m4s7ms6ginnop" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table medical_records
-- ----------------------------
ALTER TABLE "public"."medical_records" ADD CONSTRAINT "fkifeec8p5v06rt258odelw8s7j" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table order_items
-- ----------------------------
ALTER TABLE "public"."order_items" ADD CONSTRAINT "fkbioxgbv59vetrxe0ejfubep1w" FOREIGN KEY ("order_id") REFERENCES "public"."orders" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."order_items" ADD CONSTRAINT "fkocimc7dtr037rh4ls4l95nlfi" FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table orders
-- ----------------------------
ALTER TABLE "public"."orders" ADD CONSTRAINT "fk32ql8ubntj5uh44ph9659tiih" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table pets
-- ----------------------------
ALTER TABLE "public"."pets" ADD CONSTRAINT "fkc47kjb41qf50bwgddm024m5xn" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table product_reviews
-- ----------------------------
ALTER TABLE "public"."product_reviews" ADD CONSTRAINT "fk35kxxqe2g9r4mww80w9e3tnw9" FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."product_reviews" ADD CONSTRAINT "fk58i39bhws2hss3tbcvdmrm60f" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table reviews
-- ----------------------------
ALTER TABLE "public"."reviews" ADD CONSTRAINT "fkcgy7qjc1r99dp117y9en6lxye" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
