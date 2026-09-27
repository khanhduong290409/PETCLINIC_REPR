# Nhật ký quyết định

> Ghi lại các quyết định đã chốt **cùng với phương án đã loại và lý do loại**.
> Mục đích: session sau không phải bàn lại từ đầu, và không vô tình đảo ngược một quyết định có chủ đích.
> Muốn đổi một quyết định ở đây → nêu vấn đề với người dùng trước, đừng tự đổi.

---

## QĐ-01 · Kiến trúc: FastAPI riêng + Groq diễn giải

**Ngày:** 2026-08-12 · **Trạng thái:** Đã chốt

Model chạy trong một service Python FastAPI độc lập. Spring Boot gọi sang qua `RestTemplate`. Groq LLM được gọi ở tầng Spring Boot **sau khi** đã có kết quả, chỉ để viết đoạn diễn giải tiếng Việt.

**Lý do:** yêu cầu phi chức năng bắt buộc Random Forest/XGBoost + confusion matrix + Accuracy/Precision/Recall/F1 — đó là hệ sinh thái scikit-learn. Dùng Python gốc thì notebook train và các biểu đồ cho báo cáo làm được trực tiếp, không phải vòng vo. Việc gọi service AI bên ngoài đã có sẵn pattern trong `ChatService`, nên phần Java gần như không có rủi ro.

Tách Groq khỏi đường đi của con số dự đoán để metrics trong báo cáo chỉ phản ánh RandomForest, không bị LLM làm nhiễu.

**Đã loại:**
- *Export ONNX chạy trong Java* — thêm thư viện nặng vào `pom.xml`, convert sklearn→ONNX rườm rà, khó debug khi sai số. Trái nguyên tắc "hạn chế lib mới" của project.
- *Chỉ dùng LLM Groq prompt thẳng* — dễ nhất nhưng **không đáp ứng yêu cầu phi chức năng**: không có train/test split, không có confusion matrix. Mất điểm phần lõi của đề tài.

**Đánh đổi chấp nhận:** phải deploy thêm một service; free tier có cold start. Giảm nhẹ bằng Hugging Face Spaces (ngủ sau ~48h thay vì 15 phút) + UptimeRobot ping.

---

## QĐ-02 · Dữ liệu: sinh từ y văn, trộn thêm Kaggle

**Ngày:** 2026-08-12 · **Trạng thái:** Đã chốt

Xây ma trận P(triệu chứng | bệnh) từ [10] Ettinger và [11] Nelson & Couto, sinh ~7.900 ca bằng Bernoulli sampling có tiêm nhiễu. Khảo sát 2 dataset Kaggle được chỉ định rồi trộn phần dùng được.

**Lý do:** các dataset thú y trên Kaggle thường nhỏ, nhiễu và phần lớn là gia súc, không đủ để train một model chó/mèo tử tế. Sinh từ y văn cho phép kiểm soát chất lượng và bảo vệ được nguồn khi báo cáo. Vẫn phải khảo sát Kaggle vì đó là dataset giảng viên chỉ định — kể cả khi kết luận là không dùng, việc trình bày quá trình khảo sát và lý do loại vẫn là một mục có giá trị trong báo cáo.

**Đã loại:**
- *Ưu tiên Kaggle trước* — rủi ro cao: nếu dataset không dùng được thì mất thời gian mà vẫn phải quay về sinh dữ liệu.
- *Chỉ sinh từ sách, bỏ hẳn Kaggle* — sạch hơn nhưng khó trả lời câu hỏi "sao không dùng dataset đã chỉ định".

**Ràng buộc bắt buộc kèm theo:**
1. Phải tiêm đủ 4 loại nhiễu, mục tiêu accuracy **78–88%**. Nếu ra > 92% là dấu hiệu dữ liệu giả, phải quay lại tăng nhiễu.
2. Báo cáo **phải nêu rõ** phần lớn dữ liệu là sinh tổng hợp.
3. **Không được bịa số trang / trích dẫn** Ettinger hay Nelson cho tới khi đã thực sự tra sách. Cột "Xác minh" trong [03-DATA.md](03-DATA.md) theo dõi việc này.

### Tên gọi chính thức của phương pháp *(bổ sung 2026-09-07)*

**Knowledge-based synthetic data generation** — sinh dữ liệu tổng hợp dựa trên tri thức chuyên gia.

Đầy đủ hơn: *probabilistic synthetic patient generation from a literature-derived symptom–disease probability matrix.*

Ghép từ ba kỹ thuật có tên riêng, nêu đúng tên khi viết báo cáo:

| Bước | Tên kỹ thuật |
|---|---|
| Đọc sách, đổi "hầu hết" → 0.85 | **Expert knowledge elicitation** (*verbal-to-numeric probability mapping*) |
| Bảng 34 bệnh × 60 xác suất | **Symptom–disease probability matrix** |
| Tung xu sinh từng ca | **Independent Bernoulli sampling** |

**Tiền lệ trích dẫn được — đây không phải cách tự chế:**

- **SymCAT** — cơ sở dữ liệu triệu chứng–bệnh kèm xác suất biên từng triệu chứng. Nhiều nghiên cứu về chẩn đoán tự động sinh bệnh nhân giả bằng đúng quy trình này (Bernoulli trial trên mỗi triệu chứng theo xác suất tương ứng). Xem BSODA, arXiv:2012.01065.
- **Sherman Kent, *Words of Estimative Probability*, CIA, 1964** — thang quy đổi từ ngữ định tính sang xác suất số (*almost certain* = 93% ± 6, *probable* = 75% ± 12...), kể cả cách cho khoảng ± thay vì một số cứng. Là tiền lệ cho bảng thang đo ở [03-DATA.md](03-DATA.md).

**Câu trả lời khi bị hỏi "sao em tự sinh dữ liệu":**

> "Đây là quy trình chuẩn của mảng automatic diagnosis khi không tiếp cận được EHR thật. SymCAT và các nghiên cứu dựa trên nó đều sinh bệnh nhân tổng hợp bằng Bernoulli sampling trên ma trận xác suất triệu chứng–bệnh. Điểm khác của đồ án là nguồn xác suất lấy từ y văn thú y thay vì cơ sở dữ liệu y khoa người, vì mảng thú y chưa có tài nguyên tương đương."

### Giả định ngầm và giới hạn đã biết

Ma trận + tung xu độc lập **chính là một mô hình sinh Naive Bayes**, mang theo giả định **conditional independence**: khi đã biết bệnh, các triệu chứng độc lập với nhau.

Giả định này **sai trên lâm sàng** — nôn nhiều và mất nước đi kèm nhau chặt hơn nhiều so với hai đồng xu tung độc lập. Ta đang bỏ qua tương quan giữa các triệu chứng.

Bản nâng cấp có tên là **Bayesian network** (mô hình hóa được cả quan hệ giữa các triệu chứng). **Cố ý không làm:** cần xác định thêm cấu trúc phụ thuộc cho từng bệnh — nhân đôi khối lượng tra sách, đổi lấy cải thiện mà ở quy mô đồ án gần như không đo được.

**Bắt buộc ghi vào mục Giới hạn của báo cáo**, kèm câu "hướng phát triển: thay Bernoulli độc lập bằng Bayesian network". Tự nêu ra là hiểu sâu; bị giảng viên chỉ ra là lỗ hổng.

---

## QĐ-03 · Phạm vi: phủ cả 6 loài

**Ngày:** 2026-08-12 · **Trạng thái:** Đã chốt (người dùng chọn khác đề xuất ban đầu)

Hỗ trợ đủ 6 giá trị của `Pet.Species`: DOG, CAT, BIRD, RABBIT, HAMSTER, OTHER. `OTHER` không có bệnh riêng, trả về thông báo chưa hỗ trợ.

**Bối cảnh:** đề xuất ban đầu là chỉ chó + mèo (dữ liệu y khoa dồi dào, >90% ca khám thực tế, model chính xác hơn hẳn). Người dùng chọn phủ đủ 6 loài để khớp với enum sẵn có trong hệ thống.

**Hệ quả đã biết:** nhóm thỏ/hamster/chim chỉ có ~70–90 mẫu/bệnh so với 350–400 của chó/mèo. Macro F1 nhóm này sẽ thấp hơn rõ rệt.

**Ba biện pháp bắt buộc kèm theo** (chi tiết ở [04-MODEL.md](04-MODEL.md)):
1. **Species mask** khi suy luận — loại bỏ cặp loài–bệnh bất khả rồi chuẩn hóa lại xác suất
2. **Báo cáo metrics tách theo nhóm loài**, không gộp thành một con số duy nhất
3. **Cơ chế từ chối trả lời** khi độ tin cậy < 0.40

Cả ba đều biến hạn chế thành nội dung phân tích tốt cho báo cáo, thay vì che giấu.

**Lối thoát nếu cần:** nếu tới giai đoạn 2 macro F1 nhóm exotic quá thấp, cân nhắc cắt 4 bệnh chim + 3 bệnh hamster (34 → 27 lớp). **Phải bàn với người dùng trước**, vì đây là quyết định họ đã chủ động lựa chọn.

---

## QĐ-04 · `symptoms.json` là nguồn sự thật duy nhất

**Ngày:** 2026-08-12 · **Trạng thái:** Đã chốt

Danh sách triệu chứng và bệnh nằm ở một file duy nhất `shared/symptoms.json`, cả Python, Java và React đều đọc từ đó.

**Lý do:** thứ tự phần tử trong mảng `symptoms` chính là thứ tự cột của feature vector. Nếu ba tầng tự khai báo riêng, chỉ cần lệch một dòng là model dự đoán sai hoàn toàn **mà không hề báo lỗi** — loại bug tốn hàng ngày để truy.

**Quy tắc bảo vệ:** chỉ thêm vào cuối mảng, không chèn giữa, không xóa. Mỗi lần đổi phải tăng `version` và retrain. FastAPI đối chiếu `version` lúc khởi động, lệch thì từ chối chạy.

---

## QĐ-05 · Khách hàng không được thấy tên bệnh

**Ngày:** 2026-08-12 · **Trạng thái:** Đã chốt

Actor phụ (USER) chỉ nhận về mức độ ưu tiên khám — NORMAL / SOON / URGENT — không bao giờ nhận tên bệnh cụ thể.

**Lý do:** tránh khách tự chẩn đoán, hoảng loạn không cần thiết, hoặc tự mua thuốc điều trị. Đúng tinh thần đề bài: kết quả cuối cùng vẫn cần bác sĩ xác nhận.

**Chi tiết triển khai quan trọng:** việc lọc bỏ tên bệnh phải làm ở **tầng Spring Boot**, không phải ẩn ở React. Nếu chỉ ẩn trên giao diện thì tên bệnh vẫn nằm trong network response, mở DevTools là thấy.

---

## QĐ-06 · Chỉ tách một service, gọi đúng tên là Strangler Fig

**Ngày:** 2026-08-12 · **Trạng thái:** Đã chốt

Chỉ trích xuất **duy nhất** `ai_service`. Không tách thêm `notification-service`, `payment-service` hay bất kỳ chức năng nào khác.

**Bối cảnh:** người dùng muốn thể hiện hiểu biết về microservices cho CV và cho giảng viên. Đã bàn kỹ ba điều:

1. **`ai_service` đã là một microservice hoàn chỉnh rồi** — stateless, deploy độc lập, container riêng, một trách nhiệm duy nhất. Không có gì để "làm thật hơn" ở phía nó. Thứ còn thiếu để gọi là kiến trúc microservices nằm ở **monolith bên cạnh**, không nằm trong `ai_service`.
2. **Microservices là thuộc tính của cả hệ thống**, không phải của từng service. Ví von: sơ đồ 4-3-3 là thuộc tính của cả đội bóng, một cầu thủ không "đá theo sơ đồ 4-3-3" được.
3. Muốn microservices thật thì phải đập monolith ra — ước tính 3–5 tuần, phá vỡ nhiều khóa ngoại (`Appointment` → User/Pet/PetService, `Order` → User/Product), cần 3 database, 4 cold start trên Render free tier. **Demo trực tiếp sẽ tệ đi rõ rệt** — mà link demo chạy mượt mới là thứ nhà tuyển dụng thực sự bấm vào.

**Quyết định của người dùng:** chỉ làm một service, không tìm thêm chức năng thứ hai.

**Cách bù đắp giá trị chứng minh** — thay vì tăng số lượng service, tăng chất lượng pattern:
- Dùng đúng tên **Strangler Fig Pattern** (Martin Fowler) — bóc tách dần monolith có sẵn là cách chuẩn của ngành, không cần biện minh
- Cài **circuit breaker, retry + timeout, correlation ID, graceful degradation** — đây mới là thứ người phỏng vấn backend hỏi tới
- **Cố ý bỏ** Eureka và Config Server, và giải thích được vì sao bỏ (over-engineering với 3 endpoint cố định). Biết khi nào *không* dùng một công cụ cũng là biểu hiện của hiểu biết

**Cách viết vào báo cáo và CV** (không được viết "áp dụng kiến trúc Microservices"):

> Áp dụng Strangler Fig Pattern để bóc tách dần monolith: trích xuất chức năng dự đoán bệnh thành dedicated ML inference service (Python/FastAPI, Random Forest, 34 lớp bệnh, macro-F1 0.8x), tích hợp với Spring Boot qua REST; áp dụng circuit breaker, retry/timeout và graceful degradation để luồng khám bệnh vẫn hoạt động khi service AI gián đoạn.

Chi tiết định vị kiến trúc và bảng pattern → [02-ARCHITECTURE.md](02-ARCHITECTURE.md).

**Nếu sau này muốn làm microservices thật:** nên làm ở project riêng sau khi nộp đồ án, hoặc trên nhánh git riêng — để `main` luôn còn bản chạy được.

---

## QĐ-07 · `ai_service` stateless, không có database riêng

**Ngày:** 2026-08-12 · **Trạng thái:** Đã chốt

`ai_service` không có database. Bảng `disease_predictions` nằm trong Postgres (Neon) của monolith.

**Lý do 1 — hiểu đúng nguyên tắc.** "Database per service" nghĩa là *không service nào dùng chung DB với service khác*, **không** phải *mỗi service phải có một DB*. Một service stateless thỏa mãn nguyên tắc này một cách hiển nhiên. `ai_service` không vi phạm gì cả.

**Lý do 2 — stateless là hình dạng chuẩn của inference service.** TensorFlow Serving, TorchServe, KServe, Seldon, SageMaker Endpoint — **không cái nào có database**. Chúng là hàm thuần túy: feature vào, prediction ra. Đây không phải bản rút gọn của một microservice "đầy đủ", mà là cách ngành thực sự xây model server.

**Lý do 3 — dữ liệu thuộc bounded context của phòng khám.** Bản ghi dự đoán chứa: bác sĩ nào bấm, cho thú cưng nào, trong lần khám nào, bác sĩ xác nhận đúng/sai, chẩn đoán thật. Đó là **hồ sơ lâm sàng**, gắn chặt với `Pet`/`Appointment`/`User`. Việc bác sĩ xác nhận đúng/sai là một hành vi y tế, cùng loại với ghi chẩn đoán.

**Chi phí nếu tách DB** — ba màn hình đều mất khả năng JOIN:

| Màn hình | Hiện tại | Nếu tách DB |
|---|---|---|
| Lịch sử dự đoán của pet | 1 JOIN | 2 lời gọi API + ghép tay |
| Panel bác sĩ trong bệnh án | khóa ngoại `appointmentId` | mất FK, phải tự xử lý dữ liệu mồ côi |
| Thống kê Admin | GROUP BY | gộp ở tầng ứng dụng |

Cộng thêm: Neon free tier chỉ cho một project.

**Nếu sau này cần dữ liệu để retrain:** monolith mở `GET /api/admin/predictions/export` (chỉ đọc, có phân quyền) cho script retrain kéo về. **Tuyệt đối không** cho `ai_service` cắm thẳng vào DB của monolith — đó mới là vi phạm nguyên tắc thật sự.

**Câu trả lời khi bị hỏi trong phỏng vấn:**

> "Service AI được thiết kế stateless theo mô hình model serving chuẩn — nó chỉ làm suy luận. Dữ liệu dự đoán thuộc hồ sơ bệnh án nên monolith sở hữu. Nhờ stateless nên service scale ngang được tự do và không có vấn đề đồng bộ dữ liệu."

---

## QĐ-08 · Quy tắc gán số trong ma trận xác suất

**Ngày:** 2026-09-07 · **Trạng thái:** Đã chốt

Ba quy tắc bắt buộc khi điền `disease_matrix.csv`. Bảng thang đo đầy đủ ở [03-DATA.md](03-DATA.md).

**1. Lấy điểm giữa khoảng.** Thang đo cho khoảng (*most cases* → 0.80–0.90), nhưng file CSV cần đúng một số vì bộ sinh dữ liệu cần một ngưỡng duy nhất để so sánh. Luôn lấy điểm giữa (→ 0.85).

*Lý do:* ai làm lại quy trình cũng ra đúng con số đó; không bị nghi chọn số cho đẹp kết quả; nhiễu đã tiêm có kiểm soát ở bước sau nên không cần thêm ngẫu nhiên ở đây.

*Đã loại:* bốc ngẫu nhiên trong khoảng — mất khả năng lặp lại mà không được gì thêm.

**2. "Sách không nhắc tới" = `0.02`, không phải `0.00`.**

*Lý do:* `0.00` nghĩa là *tuyệt đối không bao giờ*. Model học thành luật cứng, chỉ cần gặp một ca thật có triệu chứng đó là loại thẳng bệnh đúng ra khỏi danh sách. "Không nhắc" chỉ có nghĩa là *hiếm*, không phải *bất khả*.

**3. 🔒 Ma trận chốt xong TRƯỚC khi train lần đầu. Không sửa sau khi đã nhìn thấy accuracy.**

*Lý do:* train ra 71%, chỉnh vài con số, train lại được 85% → con số 85% đó **vô nghĩa**. Đó là điều chỉnh dữ liệu cho khớp kết quả mong muốn, lập luận thành vòng tròn, và không có câu trả lời nào cho "sao chọn 0.85 mà không phải 0.70" ngoài "vì nó cho accuracy đẹp hơn".

*Ngoại lệ duy nhất:* tra lại sách và phát hiện đọc nhầm. Mỗi lần sửa phải ghi vào chính file này kèm câu trích trong sách.

*Accuracy thấp thì xử lý ở tầng model* (đổi thuật toán, tune hyperparameter, thêm feature), **không** xử lý bằng cách sửa dữ liệu.

**Hệ quả cho phần "chồng lấn có chủ ý" (QĐ-02, nhiễu loại 4):** không ép, không chỉnh tay cho hai bệnh giống nhau. Đọc sách trung thực thì chồng lấn tự khắc xuất hiện, vì các bệnh khó phân biệt trên lâm sàng vốn được mô tả bằng những từ gần giống nhau. Nếu tra xong mà hai bệnh nổi tiếng khó phân biệt lại ra vector rất khác nhau → dấu hiệu **đọc thiếu**, quay lại đọc kỹ hơn.

---

## QĐ-09 · Không tìm thêm dataset ngoài nữa

**Ngày:** 2026-09-07 · **Trạng thái:** Đã chốt

Đã khảo sát mở rộng ngoài 2 dataset Kaggle được chỉ định. **Không tập nào thay thế được kế hoạch sinh dữ liệu.** Dừng tìm, không quay lại việc này nữa.

| Tập | Vì sao loại |
|---|---|
| Pet Health Symptoms (Kaggle / HuggingFace) | 2.000 dòng nhưng nhãn chỉ là **5 nhóm thô** (da liễu / tiêu hóa / ký sinh trùng / viêm tai / vận động), dạng text tự do. Và **do Gemini 2.5 Pro sinh ra** |
| UCI Horse Colic | Dữ liệu lâm sàng **thật** nhưng là **ngựa**, ~370 dòng, nhãn là "sống/chết/cần mổ" chứ không phải tên bệnh |
| Disease Symptom Prediction (Kaggle) | **Bệnh người**, không phải thú y |
| VetCompass (RVC) | Phần open access chỉ là tập con đính kèm từng bài báo, đã redact — không phải bộ triệu chứng → bệnh |
| SAVSNET (Liverpool) | EHR thú y thật, quy mô lớn, nhưng phải **nộp đơn + ký thỏa thuận nghiên cứu**. Không kịp cho đồ án |

**Nguyên nhân gốc:** dữ liệu thú y thật nằm trong hệ thống EHR của phòng khám, đều đóng và phải xin phép. Cái mở thì hoặc quá nhỏ, hoặc không có nhãn, hoặc là sinh tổng hợp. Đây là đặc thù của ngành thú y, không phải do tìm chưa kỹ.

**Ghi nhận đáng dùng cho báo cáo:** tập "Pet Health Symptoms" trên Kaggle **cũng là dữ liệu sinh tổng hợp, bằng LLM**. Điều này xác nhận sinh dữ liệu tổng hợp là cách làm được chấp nhận trong bài toán này — và cách của đồ án chặt chẽ hơn hẳn (sinh từ vector xác suất đọc trong y văn, có nguồn tra cứu từng bệnh; họ thì prompt LLM "hãy sáng tạo tối đa"). Đưa so sánh này vào chương phương pháp.

**Việc kèm theo, chưa làm:** mở rộng `ai_service/reports/kaggle_survey.md` thành `dataset_survey.md` — khảo sát 5 tập thay vì 2, kèm lý do loại từng tập. Tùy chọn, không chặn giai đoạn 1.

> ⚠️ **QĐ-09 đã được mở lại ngày 2026-09-07** sau khi giảng viên thu hẹp phạm vi còn một loài. Bài toán đổi (1 loài thay vì 6) nên kết luận cũ không còn áp dụng. Kết quả khảo sát lần hai → QĐ-11.

---

## QĐ-10 · Thu hẹp phạm vi: chỉ loài CHÓ, 20 bệnh

**Ngày:** 2026-09-07 · **Trạng thái:** Đã chốt · **Thay thế [QĐ-03](#qđ-03--phạm-vi-phủ-cả-6-loài)**

Hệ thống chỉ dự đoán cho **DOG**. Danh sách bệnh rút từ 34 xuống **20**.

**Bối cảnh — đây là yêu cầu từ giảng viên, không phải lựa chọn kỹ thuật.** Sau khi báo cáo rằng 2 dataset được chỉ định không dùng để train được, giảng viên thu hẹp đề tài: chỉ cần làm **một loài (chó hoặc mèo)**; được phép làm cả hai nếu tìm đủ dữ liệu cho cả hai.

**Vì sao chọn chó chứ không phải mèo:** khảo sát lại (QĐ-11) không tìm được tập dữ liệu dạng bảng nào cho mèo. Toàn bộ nguồn dùng được đều là chó. Không phải chọn theo sở thích mà theo dữ liệu sẵn có.

### 20 bệnh

**17 bệnh chó có sẵn trong `symptoms.json` v2:**
`parvo` `distemper` `kennel_cough` `tick_borne_disease` `pyoderma` `intestinal_worms` `flea_tick_infestation` `otitis_externa` `arthritis_dysplasia` `pyometra` `dermatophytosis` `ear_mites` `diabetes_mellitus` `gastroenteritis` `food_poisoning` `periodontal_disease` `food_allergy`

**3 bệnh thêm mới** — lý do thêm là để tập kiểm định ngoại lai dùng được: `rabies` `leptospirosis` `ckd_dog`

**17 bệnh loại bỏ vì khác loài:** 6 bệnh chỉ mèo + 4 thỏ + 3 hamster + 4 chim.
Loại vì **thu hẹp phạm vi**, KHÔNG phải vì thiếu nguồn — MSD Vet Manual có đủ trang cho tất cả. Mở lại được bất cứ lúc nào nếu phạm vi thay đổi.

### Hai bệnh đã cân nhắc riêng

**`rabies` — GIỮ.** Dại là bệnh của chó, ở Việt Nam chó là nguồn lây chính. Chiếm 25/165 dòng của tập kiểm định `dogfinal3`.

*Rủi ro đã biết:* `aggression` và `jaw_drop` chỉ xuất hiện ở đúng bệnh này → model học được luật gần như tuyệt đối, lớp này sẽ quá dễ và kéo macro-F1 lên. **Bắt buộc báo cáo metrics per-class**, không được chỉ khoe macro-F1.

> #### ✏️ Hiệu chỉnh 2026-09-14 — đã đo thật, mô tả rủi ro trên chỉ đúng một nửa
>
> Đo `aggression` và `jaw_drop` trên 141 dòng thật của `dogfinal3`:
>
> | | Kết quả đo |
> |---|---|
> | `jaw_drop` | **0/141 dòng** — không xuất hiện trong dữ liệu thật |
> | `aggression` | 18 dòng, **cả 18 đều là rabies** (không lẫn bệnh nào khác) |
> | `aggression` phủ được | **18/25 ca rabies = 72%**, không phải 100% |
>
> **Đúng về precision, sai về recall.** Thấy `aggression` thì đoán rabies gần như chắc đúng (precision ≈ 1.00), nhưng còn **7/25 ca rabies không hề có `aggression`** — chúng chỉ có `paralysis`, `drooling`, `fever`, tức triệu chứng dùng chung với bệnh khác. Một trong bảy ca đó (dòng 52) sau khi áp bảng ánh xạ thì **thành vector toàn 0**, vì triệu chứng duy nhất được ghi là `pica` — mã đã cố ý bỏ.
>
> Nên recall của rabies **không thể đạt 100%**, dự kiến rơi vào khoảng 70–85%.
>
> **Quyết định giữ `rabies` không đổi**, và số liệu này làm nó vững hơn: lớp này không "quá dễ" như lo ban đầu, 28% số ca vẫn phải đoán bằng triệu chứng không đặc hiệu. `jaw_drop` thì không làm R1 dễ đi chút nào vì nó không có mặt.
>
> **Hai điều kiện bắt buộc khi báo cáo:**
> 1. Báo cáo precision/recall/F1 **từng lớp**. Nêu rõ precision rabies cao là **đặc tính của bệnh** (`aggression` gần như độc quyền), không phải thành tích của model.
> 2. Ở R2/R3, `jaw_drop` có trong dữ liệu sinh nhưng luôn = 0 ở tập test thật → recall rabies sẽ thấp hơn kỳ vọng. Đây là **kết quả hợp lệ, không phải lỗi ma trận**. Không được sửa ma trận vì lý do này (QĐ-08 luật 3).
>
> **Dòng 52 (vector toàn 0): giữ, không xóa.** Bỏ một dòng vì biết trước model sẽ đoán sai chính là chọn dữ liệu theo kết quả mong muốn — đúng thứ QĐ-08 luật 3 cấm. Giữ và ghi chú trong báo cáo, chi phí chỉ 0,7% accuracy.

**`heartworm` — BỎ.** Bốn lý do, xếp theo độ mạnh:

1. **Chẩn đoán thật dựa trên xét nghiệm kháng nguyên/microfilaria, không dựa trên triệu chứng** → nằm ngoài khả năng của phương pháp dự đoán theo triệu chứng
2. **Thiên lệch chọn mẫu:** MSD ghi *"Most dogs have no, or only mild, clinical signs"*. Ca có triệu chứng chỉ là tập con nhỏ và thiên lệch
3. **Trùng lặp nặng** với `kennel_cough` (ho, khó thở, ngất)
4. MSD **không cho dữ liệu tuổi/giống/giới** → không điền được `disease_constraints.csv`

⚠️ *Lý do KHÔNG dùng:* "xác suất các triệu chứng đều bằng 0". Sai — MSD vẫn cho triệu chứng khi bệnh biểu hiện (ho là phổ biến nhất), dòng ma trận sẽ có số thật.

*Chi phí:* mất 24/165 dòng của `dogfinal3` và 2/71 dòng của `cleaned_animal`.

**Không thêm** `lyme_disease`, `pancreatitis`, `canine_influenza`: mỗi bệnh chỉ có 2 dòng trong tập kiểm định, không đáng một lượt tra sách và một lớp mới.

### Hệ quả

| Việc | Thay đổi |
|---|---|
| `symptoms.json` | v2 → **v3**. Thêm 4 mã: `abdominal_pain` `oral_ulceration` `aggression` `jaw_drop` → 50 triệu chứng + 14 tiền sử = **64 feature** |
| `disease_matrix.csv` | 34 × 60 → **20 × 64** |
| `disease_constraints.csv` | 34 dòng → 20, bỏ cột `species` |
| Công tra sách | ~34 lượt → **20 lượt** |
| **Species mask** (QĐ-03) | **Không cần nữa** — một loài thì không có cặp loài–bệnh bất khả |
| Bảng metrics tách nhóm loài (QĐ-03) | Không còn ý nghĩa. Thay bằng phần **kiểm định trên 2 tập ngoại lai** |
| Cơ chế từ chối trả lời (QĐ-03) | **Giữ nguyên** — vẫn cần |

Ba biện pháp bù của QĐ-03 mất 2 còn 1. Đổi lại có kiểm định trên dữ liệu thật — mạnh hơn ablation trên dữ liệu tự sinh.

---

## QĐ-11 · Ba nguồn dữ liệu và vai trò từng nguồn

**Ngày:** 2026-09-07 · **Trạng thái:** Đã chốt

| Nguồn | Quy mô | Vai trò | Train? |
|---|---|---|---|
| Ma trận y văn → sinh tổng hợp | ~20 bệnh × ~300 ≈ 6.000 dòng | **Tập train chính** | ✅ |
| `dogfinal3.csv` | 165 dòng, 7 bệnh, dữ liệu phòng khám **thật** (Cagayan de Oro, Philippines), Unlicense | **Tập dữ liệu thật** — split 8/2, vừa train vừa test. Xem **QĐ-12** | ✅ 80% |
| `cleaned_animal` lọc chó | 71 dòng / 10 bệnh sau khi gộp nhãn (từ 75 dòng thô) | **Tập kiểm định thứ hai** + là dataset [12] giảng viên chỉ định | ❌ |
| `symtomdata.csv` | 23.999 dòng, 12 bệnh | **Loại khỏi mọi khâu kỹ thuật** | ❌ |

**Vì sao ma trận vẫn phải là nguồn train chính:** hai tập kiểm định cộng lại chỉ 236 dòng, và **chỉ `cleaned_animal` có cột giống/tuổi/giới tính/cân nặng**. Đề bài bắt buộc dùng các trường này ([01-OVERVIEW.md](01-OVERVIEW.md)). Không tập nào thay được việc sinh dữ liệu.

**Vì sao loại `symtomdata.csv`** — đã đo trực tiếp:

- Đúng **2.000 mẫu mỗi bệnh**, không lệch một con → sinh tự động
- **29,2% dòng trùng lặp hoàn toàn** → split ngẫu nhiên là rò rỉ dữ liệu, accuracy giả 97%+
- Tần suất triệu chứng trong mỗi bệnh **đều ~0.44**: ở Parvo, `vomiting` 0.45 ngang bằng `sepsis` 0.44 và `Redness around Eye area` 0.42. Không có cấu trúc xác suất lâm sàng nào
- Nhãn thô: `Cancers`, `Allergies`, `Skin Rashes` là **nhóm bệnh**, không phải chẩn đoán
- Không có cột giống/tuổi/giới tính

**Giữ lại đúng một thứ:** bảng tần suất ~0.44 nói trên, đưa vào `kaggle_survey.md` làm **dẫn chứng định lượng** cho chương phương pháp — trả lời câu "sao không dùng dataset 24.000 dòng có sẵn". Đối chiếu với `dogfinal3` (dữ liệu thật): Parvo có `bloodystool` 0.62, `vomiting` 0.62, `fever` 0.58, tụt dần tới 0.12 — có thứ bậc, có đuôi. Đó là hình dạng của dữ liệu lâm sàng thật.

### 🔒 Quy tắc niêm phong `dogfinal3.csv` — ĐÃ THAY ĐỔI 2026-09-13

> **Quy tắc gốc (2026-09-07):** không mở `dogfinal3.csv` cho tới khi ma trận chốt xong, để giữ nó làm tập kiểm định ngoại lai sạch.
>
> **Đã bỏ** theo yêu cầu giảng viên — `dogfinal3` giờ được split 8/2 để train và test. Xem **QĐ-12**.
>
> **Phần còn giữ lại:** vẫn **không được dùng `dogfinal3` để chỉnh ma trận xác suất**. Ma trận chỉ lấy từ y văn. Nếu chỉnh ma trận theo `dogfinal3` thì chế độ R2 ở QĐ-12 mất hết ý nghĩa.

⚠️ **Ghi nhận để minh bạch:** ngày 2026-09-07 đã mở xem tần suất triệu chứng của **`canineparvovirus` (1/7 bệnh)** của `dogfinal3`. Nêu rõ điều này khi báo cáo kết quả R2.

---

## QĐ-12 · Thiết kế thí nghiệm 3 chế độ trên dữ liệu thật

**Ngày:** 2026-09-13 · **Trạng thái:** Đã chốt · **Sửa đổi QĐ-11**

**Bối cảnh — yêu cầu của giảng viên:** *"em cứ chia 8/2 train và test cho dữ liệu thật ghi nhận kết quả"*, sau khi có kết quả rồi mới sinh dữ liệu từ y văn và test lại, ghi nhận tiếp.

Đây không phải "dùng 400 dòng làm tập train chính" mà là **ablation study**: đo xem việc bổ sung dữ liệu sinh từ y văn có thực sự cải thiện kết quả hay không.

### Ba chế độ — cùng một tập test, khác cách train

| | Train bằng | Test trên | Trả lời câu hỏi |
|---|---|---|---|
| **R1** | 113 dòng thật (80%) | 28 dòng thật (20%) | **Mốc đối chứng** — giảng viên yêu cầu |
| **R2** | Chỉ dữ liệu sinh từ y văn | 28 dòng thật | **Ma trận y văn có đúng với lâm sàng không?** Không dùng dòng thật nào để train |
| **R3** | Dữ liệu sinh + 113 dòng thật | 28 dòng thật | Kết hợp có tốt hơn từng cái riêng lẻ không? |

**R2 là con số đắt giá nhất của cả đồ án** — nó đo trực tiếp khoảng cách giữa y văn và thực tế lâm sàng. Rất ít đồ án sinh viên đo được đại lượng này.

### Tập dữ liệu

`dogfinal3.csv` bỏ 24 dòng `heartworm` (bệnh này đã loại ở QĐ-10) → **141 dòng / 6 bệnh**:

`caninedistemper` 25 · `rabies` 25 · `canineparvovirus` 24 · `leptospirosis` 24 · `kennelcough` 22 · `kidneydisease` 21

Ba chế độ phải dùng **cùng bộ nhãn** thì so sánh mới công bằng.

`cleaned_animal` (71 dòng chó) giữ nguyên vai trò **tập kiểm định thứ hai**, không tham gia vào R1/R2/R3 — nó có từ vựng triệu chứng khác hẳn, trộn vào sẽ làm nhiễu phép so sánh.

### Quy trình đánh giá

- Split **80/20 stratified**, `random_state=42` — đúng yêu cầu giảng viên và yêu cầu phi chức năng
- **Kèm thêm 5-fold stratified cross-validation**, báo cáo `mean ± std`

**Vì sao phải có cross-validation:** tập test chỉ **28 dòng**, khoảng 4–5 dòng mỗi lớp. Sai một ca là recall của lớp đó nhảy ~20 điểm. Với 5-fold, mỗi dòng được dùng làm test đúng một lần → đánh giá trên cả 141 dòng thay vì 28. Đây là cách xử lý tiêu chuẩn cho tập nhỏ, không phải lách yêu cầu.

Báo cáo **cả hai**: con số 80/20 (theo yêu cầu) và con số CV (đáng tin hơn).

### Vì sao thiết kế này mạnh hơn phương án niêm phong

Phương án cũ cho một con số trên dữ liệu thật nhưng **không có gì để so sánh với nó** — không biết 65% là tốt hay tệ. Thiết kế 3 chế độ cho một mốc đối chứng đo trên cùng tập test, nên mọi con số đều đọc được.

### Rủi ro đã biết

1. **Tập test 28 dòng** → giảm nhẹ bằng 5-fold CV như trên
2. **R2 chỉ chấm được 6 lớp** trong khi model biết 20 bệnh → model R2 bị bất lợi vì có nhiều lựa chọn sai hơn. Báo cáo **hai biến thể**: R2 giới hạn softmax trong 6 lớp, và R2 đầy đủ 20 lớp. Nêu rõ sự khác biệt
3. **`dogfinal3` không có cột giống/tuổi/giới tính/cân nặng** → R1 chỉ dùng được feature triệu chứng. Ghi rõ trong báo cáo rằng R1 chạy trên tập feature hẹp hơn R2/R3

### Việc phát sinh, thành đường găng

Cần **bảng ánh xạ 52 cột triệu chứng + 7 nhãn bệnh** của `dogfinal3` sang mã trong `symptoms.json` → `ai_service/data/mapping_dogfinal3.csv`. Trước đây xếp "làm sau", giờ chặn mọi việc khác.

### Lợi ích cho tiến độ

**R1 chạy được ngay, không cần chờ tra y văn.** Có confusion matrix và bảng metrics trên dữ liệu thật trong vài ngày — đúng thứ cần để báo cáo mốc 21/08–03/09 đang trễ.

---

## QĐ-13 · Phạm vi đánh giá R2 và vai trò `cleaned_animal`

**Ngày:** 2026-09-14 · **Trạng thái:** Đã chốt · **Bổ sung [QĐ-12](#qđ-12--thiết-kế-thí-nghiệm-3-chế-độ-trên-dữ-liệu-thật)**

Ba việc chốt cùng lúc, đều xoay quanh một câu hỏi: đo R2 trên bao nhiêu dữ liệu thì vừa.

### A. R2 được chấm thêm trên **cả 141 dòng**, ngoài con số 28 dòng

**R2 không dùng dòng thật nào để train**, nên chấm nó trên toàn bộ 141 dòng là hoàn toàn hợp lệ — không có rò rỉ dữ liệu. Đây là đặc quyền **chỉ R2 có**.

**R1 và R3 tuyệt đối không được làm vậy:** cả hai train trên 113 dòng thật, chấm trên 141 dòng nghĩa là 113 dòng đã thấy lúc train lại xuất hiện trong test → accuracy đẹp giả tạo.

**Vì sao cần con số 141:** 28 dòng là quá ít để kết luận. Giả sử accuracy thật 70%:

| Đo trên | Khoảng tin cậy 95% |
|---|---|
| 28 dòng | 70% **± 17 điểm** (53–87%) — gần như không kết luận được gì |
| 141 dòng | 70% **± 7,6 điểm** (62–78%) |

R2 là con số đắt giá nhất của cả đồ án (đo khoảng cách y văn ↔ lâm sàng), không nên để nó mang sai số ±17 điểm khi có sẵn cách đo tốt hơn miễn phí.

Dự án **đã thừa nhận vấn đề 28 dòng là quá nhỏ** từ QĐ-12 — đó là lý do thêm 5-fold CV. R1/R3 phải dùng CV để lách; R2 có lối thoát sạch hơn.

**Hai con số không chọi nhau:** 28 dòng nằm *trong* 141 dòng, nên R2-trên-28 chỉ là mẫu ngẫu nhiên 20% của R2-trên-141 — cùng một đại lượng, khác độ chính xác. Còn R1-trên-28 đo **một thứ khác** (model train khác hẳn), đó mới là lý do bảng so sánh buộc phải dùng chung tập test.

### B. **Không** trộn `cleaned_animal` vào tập train của R1

Đã cân nhắc và **loại**. Bốn lý do, xếp theo độ nặng:

| | Vấn đề |
|---|---|
| 1 | **Chỉ trùng 4/6 bệnh.** Gộp nhãn xong lọc theo 6 bệnh được 51 dòng: parvo 21 · distemper 12 · kennel_cough 11 · leptospirosis 7 · **rabies 0** · **ckd_dog 0**. Bơm thêm dữ liệu cho 4 lớp, bỏ đói 2 lớp |
| 2 | **Model sẽ học nguồn dữ liệu thay vì học bệnh** (*batch effect*). `cleaned_animal` chỉ có 16 giá trị triệu chứng + 9 cột nhị phân; `dogfinal3` phủ 33 mã. Trộn vào thì 51 dòng mới có hàng loạt cột = 0 **không phải vì con chó không có triệu chứng, mà vì dataset không hỏi tới**. Model học ngay quy luật "dòng nào thưa triệu chứng thì thuộc nhóm này". ⚠️ Cái bẫy: accuracy sẽ **tăng**, nhìn số tưởng tốt hơn |
| 3 | **Mất tập kiểm định độc lập.** Bỏ species mask (QĐ-10) đã mất một bảng ablation; thứ dùng để bù chính là kiểm định ngoại lai. Đem đi train là tiêu nốt khoản bù |
| 4 | **Chất lượng kém.** Cột `Appetite_Loss` chỉ có duy nhất giá trị `Yes` ở cả 75 dòng chó — cột chết |

**Thay vào đó — dùng `cleaned_animal` làm tập kiểm định thứ hai cho R2.** Model R2 train thuần từ y văn, chưa từng thấy dòng lâm sàng nào, đem chấm trên **hai tập thật độc lập, khác quốc gia, khác từ vựng ghi chép**. Đây là bằng chứng mạnh hơn nhiều so với việc thêm 51 dòng vào tập train, và không tốn thêm công tra sách nào.

*(Ghi chú số liệu: 75 dòng chó thô có **22 nhãn**, phần lớn là cùng một bệnh viết nhiều kiểu — `Canine Parvovirus` 12 + `Parvovirus` 9; `Kennel Cough` 9 + `Canine Cough` 1 + `Bordetella Infection` 1. Con số "71 dòng / 10 bệnh" ghi ở QĐ-11 là kết quả gộp theo phạm vi 10 bệnh, khác với phép lọc 6 bệnh ở đây.)*

### C. 🔒 Hai quy tắc trình bày — khóa TRƯỚC khi chạy

Có hai con số cho cùng một chế độ là mảnh đất tốt để vô tình chọn lọc kết quả. Chốt cách trình bày ngay bây giờ, trước khi nhìn thấy bất kỳ con số nào:

1. **Hai bảng tách hẳn nhau.** Bảng *"So sánh R1/R2/R3"* — cả ba đều 28 dòng, ghi rõ `n=28` ngay tiêu đề. Bảng *"Đánh giá riêng R2"* — 141 dòng + `cleaned_animal`, ghi rõ `n` từng cột. **Không được để chung một bảng.**
2. **Báo cáo cả hai con số bất kể con số nào đẹp hơn.** Không được chọn khoe con số có lợi.

Quy tắc 2 là QĐ-08 luật 3 áp cho khâu trình bày: chốt giao thức trước khi thấy kết quả, đúng như chốt ma trận trước khi train.

### Đã loại

- *Chỉ chấm R2 trên 28 dòng cho "nhất quán"* — bảng so sánh vẫn nguyên vẹn dù có thêm con số 141 hay không, nên bỏ nó chỉ là vứt 80% bằng chứng sẵn có cho câu hỏi quan trọng nhất mà không đổi lại được gì.
- *Chấm R2 trên 141 dòng rồi bỏ luôn con số 28* — mất khả năng so sánh với R1/R3, tức mất chính cái trục của QĐ-12.
