"""Chay R1 - moc doi chung tren 141 dong du lieu that (QD-12).

Chay: ai_service/.venv/Scripts/python.exe ai_service/scripts/train_baseline.py

Xuat ra:
  ai_service/reports/r1_metrics.md           - toan bo bang so lieu, SINH TU DONG
  ai_service/reports/r1_confusion_matrix.png - confusion matrix cua Random Forest

Luu y ve pham vi R1: dogfinal3 khong co cot giong/tuoi/gioi tinh/can nang, nen R1
chi chay tren feature trieu chung - hep hon R2/R3 (QD-12, rui ro 3).

Moi con so deu co random_state=42 de chay lai ra dung ket qua cu. Doi phien ban
numpy/scikit-learn cung co the lam lech ket qua, xem ghi chu trong requirements.txt.
"""

import sys
from datetime import date
from pathlib import Path

import matplotlib

# Phai dat truoc khi import pyplot: script chay tu terminal, khong co cua so do hoa
matplotlib.use("Agg")

import matplotlib.pyplot as plt
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split

from load_real_data import load_real_data

sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORTS_DIR = PROJECT_ROOT / "ai_service" / "reports"
METRICS_PATH = REPORTS_DIR / "r1_metrics.md"
CONFUSION_PATH = REPORTS_DIR / "r1_confusion_matrix.png"

RANDOM_STATE = 42
TEST_SIZE = 0.2
CV_FOLDS = 5

# Model chinh thuc cua R1 la Random Forest (yeu cau phi chuc nang cua de bai).
# Hai model kia de doi chieu: Dummy cho biet san ngau nhien, Logistic Regression
# cho biet bai toan nay co can den model phi tuyen khong.
MAIN_MODEL_NAME = "Random Forest"


def build_models():
    """Tao moi lan mot bo model moi de khong dung lai model da fit o buoc truoc."""
    return {
        "Dummy (luon doan lop pho bien nhat)": DummyClassifier(strategy="most_frequent"),
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
        MAIN_MODEL_NAME: RandomForestClassifier(n_estimators=300, random_state=RANDOM_STATE),
    }


def split_data(X, y):
    """Split 80/20 stratified, random_state=42 - dung yeu cau giang vien (QD-12)."""
    return train_test_split(
        X, y,
        test_size=TEST_SIZE,
        stratify=y,
        random_state=RANDOM_STATE,
    )


def evaluate_holdout(model, X_train, y_train, X_test, y_test):
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    # zero_division=0: tap test chi 28 dong nen co lop khong duoc doan lan nao,
    # luc do precision la 0/0. De mac dinh thi sklearn in canh bao va tra NaN.
    accuracy = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
    return accuracy, macro_f1, y_pred


def evaluate_cross_validation(model, X, y):
    """5-fold stratified CV - moi dong duoc dung lam test dung mot lan.

    Can co vi tap test 80/20 chi 28 dong, khoang 4-5 dong moi lop: sai mot ca la
    recall cua lop do nhay ~20 diem (QD-12).
    """
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    accuracy_scores = cross_val_score(model, X, y, cv=cv, scoring="accuracy")
    macro_f1_scores = cross_val_score(model, X, y, cv=cv, scoring="f1_macro")
    return accuracy_scores, macro_f1_scores


def build_summary_table(results, test_size):
    lines = []
    lines.append(f"| Model | Accuracy (n={test_size}) | Macro-F1 (n={test_size}) "
                 f"| Accuracy {CV_FOLDS}-fold CV | Macro-F1 {CV_FOLDS}-fold CV |")
    lines.append("|---|---|---|---|---|")
    for name, result in results.items():
        accuracy_scores = result["cv_accuracy"]
        macro_f1_scores = result["cv_macro_f1"]
        lines.append(
            f"| {name} | {result['accuracy']:.3f} | {result['macro_f1']:.3f} | "
            f"{accuracy_scores.mean():.3f} ± {accuracy_scores.std():.3f} | "
            f"{macro_f1_scores.mean():.3f} ± {macro_f1_scores.std():.3f} |"
        )
    return "\n".join(lines)


def build_per_class_table(y_test, y_pred, labels):
    report = classification_report(
        y_test, y_pred, labels=labels, output_dict=True, zero_division=0
    )

    lines = []
    lines.append("| Bệnh | Precision | Recall | F1 | Số ca trong tập test |")
    lines.append("|---|---|---|---|---|")
    for label in labels:
        stats = report[label]
        lines.append(
            f"| `{label}` | {stats['precision']:.2f} | {stats['recall']:.2f} | "
            f"{stats['f1-score']:.2f} | {int(stats['support'])} |"
        )
    return "\n".join(lines)


def build_confusion_table(y_test, y_pred, labels):
    """Ban chu cua confusion matrix, de file .md doc duoc ma khong can mo anh."""
    matrix = confusion_matrix(y_test, y_pred, labels=labels)

    header_cells = []
    for label in labels:
        header_cells.append(f"`{label}`")

    lines = []
    lines.append("| thật \\ đoán | " + " | ".join(header_cells) + " |")
    lines.append("|---" * (len(labels) + 1) + "|")
    for row_index, label in enumerate(labels):
        value_cells = []
        for column_index in range(len(labels)):
            value = matrix[row_index][column_index]
            # To dam o duong cheo chinh cho de doc
            if row_index == column_index:
                value_cells.append(f"**{value}**")
            else:
                value_cells.append(str(value))
        lines.append(f"| **`{label}`** | " + " | ".join(value_cells) + " |")
    return "\n".join(lines)


def save_confusion_matrix_image(y_test, y_pred, labels):
    figure, axes = plt.subplots(figsize=(7, 6))
    ConfusionMatrixDisplay.from_predictions(
        y_test, y_pred,
        labels=labels,
        cmap="Blues",
        colorbar=False,
        ax=axes,
    )
    axes.set_title(f"R1 - {MAIN_MODEL_NAME} (n={len(y_test)})")
    axes.set_xlabel("Nhan du doan")
    axes.set_ylabel("Nhan that")
    plt.setp(axes.get_xticklabels(), rotation=45, ha="right")
    figure.tight_layout()
    figure.savefig(CONFUSION_PATH, dpi=150)
    plt.close(figure)


def count_leaked_test_rows(X_train, y_train, X_test, y_test):
    """Dem dong test co ban sao y het (ca feature lan nhan) nam trong tap train.

    Tap that co 6,4% dong trung lap hoan toan, nen split ngau nhien co the day ban sao
    vao ca hai ben. Do la ro ri du lieu - dung loai da dung de loai symtomdata.csv
    (QD-11, 29,2% trung lap). Phai do o tap that cho cong bang, va vi accuracy cao
    thi day la kha nang dau tien phai loai tru.
    """
    train_keys = set()
    for index in X_train.index:
        key = (tuple(X_train.loc[index]), y_train[index])
        train_keys.add(key)

    leaked_count = 0
    for index in X_test.index:
        key = (tuple(X_test.loc[index]), y_test[index])
        if key in train_keys:
            leaked_count += 1
    return leaked_count


def find_empty_row_location(X_train, X_test):
    """Dong vector toan 0 (ca rabies chi ghi 'pica') roi vao tap nao.

    Giu dong nay la co y - xem hieu chinh QD-10 ngay 2026-09-14. Nhung neu no roi
    vao tap test thi no chiem 1/28 = 3,6% accuracy, phai biet de giai thich.
    """
    empty_in_train = (X_train.sum(axis=1) == 0).sum()
    empty_in_test = (X_test.sum(axis=1) == 0).sum()
    return empty_in_train, empty_in_test


def write_report(results, y_test, labels, empty_in_train, empty_in_test,
                 class_counts, train_size, leaked_count):
    main_result = results[MAIN_MODEL_NAME]
    test_size = len(y_test)

    class_count_lines = []
    for label in labels:
        class_count_lines.append(f"| `{label}` | {class_counts[label]} |")

    if leaked_count == 0:
        leakage_note = (
            "**0 dòng.** Không có dòng test nào trùng khớp hoàn toàn với dòng train, "
            "nên kết quả trên **không** bị thổi phồng bởi bản sao."
        )
    else:
        leaked_ratio = leaked_count / test_size * 100
        leakage_note = (
            f"⚠️ **{leaked_count}/{test_size} dòng ({leaked_ratio:.1f}%)** của tập test có bản sao "
            f"y hệt nằm trong tập train. Model chỉ cần nhớ lại là đúng, nên accuracy ở trên "
            f"**cao hơn thực lực**. Phải nêu rõ con số này khi báo cáo."
        )

    content = f"""# R1 — Kết quả trên dữ liệu thật

> ⚠️ **File này sinh tự động bởi `ai_service/scripts/train_baseline.py`. Đừng sửa tay.**
> Phần diễn giải và nhận xét nằm ở `R1_results.md`.

**Ngày chạy:** {date.today().isoformat()}
**Chế độ:** R1 — train và test đều trên dữ liệu lâm sàng thật (QĐ-12)
**Dữ liệu:** `dogfinal3.csv` — 141 dòng / {len(labels)} bệnh, sau khi bỏ 24 dòng `heartworm`
**Split:** 80/20 stratified, `random_state={RANDOM_STATE}` → **{train_size} dòng train / {test_size} dòng test**
*(QĐ-12 ước tính tay là 113/28; `test_size=0.2` × 141 = 28,2 và scikit-learn làm tròn lên, nên số thật là {train_size}/{test_size}.)*
**Cross-validation:** {CV_FOLDS}-fold stratified, `shuffle=True`, `random_state={RANDOM_STATE}`

**Phạm vi feature:** chỉ {main_result['feature_count']} mã triệu chứng. `dogfinal3` không có cột
giống/tuổi/giới tính/cân nặng, nên R1 chạy trên tập feature **hẹp hơn R2/R3** (QĐ-12, rủi ro 3).

---

## Phân bố nhãn

| Bệnh | Số dòng |
|---|---|
{chr(10).join(class_count_lines)}

---

## Bảng so sánh model

{build_summary_table(results, test_size)}

Con số `n={test_size}` là kết quả trên tập test 80/20 — đúng yêu cầu giảng viên.
Con số CV đo trên cả 141 dòng nên **đáng tin hơn**; báo cáo cả hai (QĐ-12).

---

## Kiểm tra rò rỉ dữ liệu do dòng trùng lặp

{leakage_note}

---

## Metrics từng lớp — {MAIN_MODEL_NAME}, tập test n={test_size}

{build_per_class_table(y_test, main_result['y_pred'], labels)}

> Bảng per-class là **bắt buộc**, không được chỉ báo cáo macro-F1 (QĐ-10).
> Precision của `rabies` cao là **đặc tính của bệnh** — `aggression` gần như độc quyền
> cho lớp này — chứ không phải thành tích của model.

---

## Confusion matrix — {MAIN_MODEL_NAME}, tập test n={test_size}

{build_confusion_table(y_test, main_result['y_pred'], labels)}

Bản hình: `r1_confusion_matrix.png`

---

## Ghi chú về chất lượng dữ liệu

- **Dòng vector toàn 0:** {empty_in_train} ở tập train, {empty_in_test} ở tập test.
  Đây là ca `rabies` chỉ ghi mỗi triệu chứng `pica` — mã đã cố ý bỏ khi ánh xạ.
  Giữ dòng này là có chủ đích (hiệu chỉnh QĐ-10 ngày 2026-09-14): bỏ một dòng vì
  biết trước model sẽ đoán sai chính là chọn dữ liệu theo kết quả mong muốn.
- **Cột luôn bằng 0:** {main_result['always_zero_count']}/{main_result['feature_count']} mã
  không có dòng nào bật lên. Giữ đủ cột để R1/R2/R3 cùng một không gian feature.
"""

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        f.write(content)


def main():
    X, y = load_real_data()

    labels = sorted(y.unique())
    class_counts = y.value_counts().to_dict()

    X_train, X_test, y_train, y_test = split_data(X, y)
    empty_in_train, empty_in_test = find_empty_row_location(X_train, X_test)
    leaked_count = count_leaked_test_rows(X_train, y_train, X_test, y_test)

    print(f"\nTrain {len(X_train)} dong / Test {len(X_test)} dong / {len(labels)} lop")
    print(f"Dong vector toan 0: {empty_in_train} o train, {empty_in_test} o test")
    print(f"Dong test co ban sao trong train: {leaked_count}/{len(X_test)}\n")

    always_zero_count = 0
    for code in X.columns:
        if X[code].sum() == 0:
            always_zero_count += 1

    results = {}
    for name, model in build_models().items():
        accuracy, macro_f1, y_pred = evaluate_holdout(model, X_train, y_train, X_test, y_test)
        cv_accuracy, cv_macro_f1 = evaluate_cross_validation(model, X, y)

        results[name] = {
            "accuracy": accuracy,
            "macro_f1": macro_f1,
            "y_pred": y_pred,
            "cv_accuracy": cv_accuracy,
            "cv_macro_f1": cv_macro_f1,
            "feature_count": X.shape[1],
            "always_zero_count": always_zero_count,
        }

        print(f"{name}")
        print(f"  hold-out n={len(X_test)} : accuracy {accuracy:.3f} | macro-F1 {macro_f1:.3f}")
        print(f"  {CV_FOLDS}-fold CV    : accuracy {cv_accuracy.mean():.3f} +/- {cv_accuracy.std():.3f} "
              f"| macro-F1 {cv_macro_f1.mean():.3f} +/- {cv_macro_f1.std():.3f}")

    save_confusion_matrix_image(y_test, results[MAIN_MODEL_NAME]["y_pred"], labels)
    write_report(results, y_test, labels, empty_in_train, empty_in_test,
                 class_counts, len(X_train), leaked_count)

    print(f"\nDa ghi {METRICS_PATH.relative_to(PROJECT_ROOT)}")
    print(f"Da ghi {CONFUSION_PATH.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
