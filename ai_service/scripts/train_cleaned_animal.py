"""Danh gia model tren cleaned_animal - 8 loai, 44 benh (QD-16).

Chay: ai_service/.venv/Scripts/python.exe ai_service/scripts/train_cleaned_animal.py

Xuat ra:
  ai_service/reports/ca_metrics.md           - toan bo bang so lieu, SINH TU DONG
  ai_service/reports/ca_confusion_matrix.png - confusion matrix Random Forest, tach theo loai

Giao thuc (QD-16):
- 3-fold stratified CV, random_state=42 la cach danh gia chinh. Hold-out 70/30, 80/20 chi la thi nghiem so sanh
  (benh 3 dong chia mot lan thi chi co 1 dong test, so dao dong manh).
- Chi so: Accuracy, Precision, Recall, F1 (macro va weighted), mean +/- std qua cac fold.
- Moi model deu du doan QUA species mask, dung nhu app.py: chi chon trong cac benh cua
  dung loai. Nho vay Dummy tro thanh "doan benh pho bien nhat cua loai do" - san so sanh
  cong bang hon "doan benh pho bien nhat ca dataset".
- Trieu chung chi lay tu 4 cot chu Symptom_1..4; 9 cot Yes/No bi bo vi mau thuan voi cot chu
  (bang do o muc 3 cua bao cao). Thi nghiem "giu 9 cot Yes/No" van chay de so sanh.
- Per-class va confusion matrix lay tu du doan out-of-fold: moi dong duoc du doan
  dung mot lan boi model KHONG thay dong do luc train.
- Hai thi nghiem bo sung (theo yeu cau so sanh nhu R1):
  * Cach chia du lieu: hold-out 70/30 va 80/20, moi ti le chay 5 seed vi mot lan chia
    rat phu thuoc may rui (benh 3 dong chi co 1 dong test).
  * Tang cuong du lieu: chi tang cuong TAP TRAIN cua tung fold. Tang cuong truoc khi chia
    thi ban sao cua dong test lot vao train -> so dep gia.
"""

import sys
from datetime import date
from pathlib import Path

import matplotlib

# Phai dat truoc khi import pyplot: script chay tu terminal, khong co cua so do hoa
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from load_cleaned_animal import (
    NUMERIC_FIELDS,
    load_dataset,
    load_symptoms_json,
    measure_yes_no_consistency,
)

sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORTS_DIR = PROJECT_ROOT / "ai_service" / "reports"
METRICS_PATH = REPORTS_DIR / "ca_metrics.md"
CONFUSION_PATH = REPORTS_DIR / "ca_confusion_matrix.png"

RANDOM_STATE = 42
MAIN_MIN_ROWS = 3
MAIN_FOLDS = 3
COMPARE_MIN_ROWS = 5
COMPARE_FOLDS = 5

MAIN_MODEL_NAME = "Random Forest"

# Thi nghiem cach chia du lieu: (ti le test, ten hien thi)
HOLDOUT_SPLITS = [(0.3, "70/30"), (0.2, "80/20")]
HOLDOUT_SEEDS = [0, 1, 2, 3, 4]

# Thi nghiem tang cuong: (so ban sao moi dong train, ti le dao bit trieu chung)
# Dong (0, 0) = khong tang cuong, de so sanh truoc / sau trong cung mot bang
AUGMENT_CONFIGS = [(0, 0.0), (2, 0.05), (5, 0.05), (5, 0.10)]
# Do lech chuan tuong doi khi xe dich cot so (tuoi, can nang...): 5%
AUGMENT_NUMERIC_NOISE = 0.05

# Thu tu cot trong bang tong hop
METRIC_KEYS = [
    "accuracy",
    "precision_macro", "recall_macro", "f1_macro",
    "precision_weighted", "recall_weighted", "f1_weighted",
]
METRIC_TITLES = {
    "accuracy": "Accuracy",
    "precision_macro": "Precision (macro)",
    "recall_macro": "Recall (macro)",
    "f1_macro": "F1 (macro)",
    "precision_weighted": "Precision (weighted)",
    "recall_weighted": "Recall (weighted)",
    "f1_weighted": "F1 (weighted)",
}


def build_models():
    """Tao bo model moi moi lan goi, de khong dung lai model da fit o fold truoc.

    Logistic Regression can chuan hoa: cot nhip tim (~100) va cot co 0/1 lech thang do
    rat xa, khong chuan hoa thi LR hoi tu cham va bi cot so lon chi phoi.
    Random Forest khong can chuan hoa vi chi so sanh nguong tren tung cot.
    """
    return {
        "Dummy (bệnh phổ biến nhất của loài)": DummyClassifier(strategy="prior"),
        "Logistic Regression": make_pipeline(
            StandardScaler(),
            LogisticRegression(max_iter=2000, random_state=RANDOM_STATE),
        ),
        MAIN_MODEL_NAME: RandomForestClassifier(n_estimators=300, random_state=RANDOM_STATE),
    }


# ─── Species mask ────────────────────────────────────────────────────────────

def build_disease_species_map(records):
    """Ma benh -> ma loai. Moi benh trong mapping chi thuoc dung mot loai."""
    disease_species = {}
    for record in records:
        disease_species[record["disease"]] = record["species"]
    return disease_species


def predict_with_species_mask(model, X_test, test_species, disease_species):
    """Chon benh co xac suat cao nhat TRONG cac benh cua dung loai.

    Benh khac loai gan -1 thay vi 0: neu model cho moi benh dung loai xac suat 0
    thi argmax van chon trong dung loai, khong roi sang benh cua loai khac.
    """
    probabilities = model.predict_proba(X_test)
    classes = list(model.classes_)

    predictions = []
    for row_index, species in enumerate(test_species):
        masked = probabilities[row_index].copy()
        for class_index, disease in enumerate(classes):
            if disease_species[disease] != species:
                masked[class_index] = -1.0
        best_index = int(np.argmax(masked))
        predictions.append(classes[best_index])
    return predictions


# ─── Cross-validation ────────────────────────────────────────────────────────

def compute_fold_metrics(y_true, y_pred):
    # zero_division=0: benh 3 dong co the khong duoc doan lan nao trong mot fold,
    # khi do precision la 0/0. De mac dinh thi sklearn in canh bao.
    macro = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division=0)
    weighted = precision_recall_fscore_support(y_true, y_pred, average="weighted", zero_division=0)
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision_macro": macro[0],
        "recall_macro": macro[1],
        "f1_macro": macro[2],
        "precision_weighted": weighted[0],
        "recall_weighted": weighted[1],
        "f1_weighted": weighted[2],
    }


def count_leaked_rows(X_train, y_train, X_test, y_test):
    """Dem dong test co ban sao y het (ca feature lan nhan) trong tap train cua fold do."""
    train_keys = set()
    for index in X_train.index:
        train_keys.add((tuple(X_train.loc[index]), y_train[index]))

    leaked_count = 0
    for index in X_test.index:
        if (tuple(X_test.loc[index]), y_test[index]) in train_keys:
            leaked_count += 1
    return leaked_count


def augment_training_rows(X_train, y_train, copies, flip_ratio, rng):
    """Tao them `copies` ban sao cho moi dong train.

    Moi ban sao: dao (0<->1) ngau nhien `flip_ratio` cot trieu chung, va nhan cac cot so
    voi (1 + nhieu chuan 5%). Loai, giong, gioi tinh va nhan benh giu nguyen.
    """
    symptom_columns = []
    for column in X_train.columns:
        if column.startswith("species_") or column.startswith("breed_"):
            continue
        if column in NUMERIC_FIELDS or column == "gender_male":
            continue
        symptom_columns.append(column)

    feature_parts = [X_train]
    label_parts = [y_train]
    for _ in range(copies):
        copy = X_train.copy()

        flip_mask = rng.random((len(copy), len(symptom_columns))) < flip_ratio
        original = copy[symptom_columns].values
        copy[symptom_columns] = np.where(flip_mask, 1 - original, original)

        for field in NUMERIC_FIELDS:
            noise = rng.normal(0, AUGMENT_NUMERIC_NOISE, len(copy))
            copy[field] = copy[field] * (1 + noise)

        feature_parts.append(copy)
        label_parts.append(y_train)

    return pd.concat(feature_parts, ignore_index=True), pd.concat(label_parts, ignore_index=True)


def run_cross_validation(model_name, X, y, species_per_row, disease_species, n_folds, use_mask=True,
                         augment_copies=0, flip_ratio=0.0):
    """Chay CV thu cong (khong dung cross_validate) vi can chen species mask vao buoc du doan.

    augment_copies > 0: tang cuong CHI tap train cua fold, tap test giu nguyen du lieu that.
    Tra ve: diem tung fold, du doan out-of-fold cho tung dong, so dong ro ri moi fold.
    """
    folds = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=RANDOM_STATE)

    fold_scores = []
    out_of_fold = [None] * len(y)
    leaked_per_fold = []

    for train_index, test_index in folds.split(X, y):
        X_train = X.iloc[train_index]
        X_test = X.iloc[test_index]
        y_train = y.iloc[train_index]
        y_test = y.iloc[test_index]

        model = build_models()[model_name]
        if augment_copies > 0:
            rng = np.random.default_rng(RANDOM_STATE)
            X_fit, y_fit = augment_training_rows(X_train, y_train, augment_copies, flip_ratio, rng)
            model.fit(X_fit, y_fit)
        else:
            model.fit(X_train, y_train)

        if use_mask:
            test_species = []
            for index in test_index:
                test_species.append(species_per_row[index])
            y_pred = predict_with_species_mask(model, X_test, test_species, disease_species)
        else:
            y_pred = list(model.predict(X_test))

        fold_scores.append(compute_fold_metrics(y_test, y_pred))
        leaked_per_fold.append(count_leaked_rows(X_train, y_train, X_test, y_test))

        for position, index in enumerate(test_index):
            out_of_fold[index] = y_pred[position]

    return fold_scores, out_of_fold, leaked_per_fold


def summarize(fold_scores):
    """Danh sach diem tung fold -> {metric: (mean, std)}."""
    summary = {}
    for key in METRIC_KEYS:
        values = []
        for scores in fold_scores:
            values.append(scores[key])
        summary[key] = (float(np.mean(values)), float(np.std(values)))
    return summary


# ─── Thi nghiem phu ──────────────────────────────────────────────────────────

def keep_species_and_symptoms(X):
    """Bo cot giong, cot so va gioi tinh - chi con loai + trieu chung."""
    columns = []
    for column in X.columns:
        if column.startswith("breed_"):
            continue
        if column in NUMERIC_FIELDS or column == "gender_male":
            continue
        columns.append(column)
    return X[columns]


def drop_breed_columns(X):
    columns = []
    for column in X.columns:
        if not column.startswith("breed_"):
            columns.append(column)
    return X[columns]


def run_random_forest(X, y, records, n_folds, use_mask=True, augment_copies=0, flip_ratio=0.0):
    species_per_row = [record["species"] for record in records]
    disease_species = build_disease_species_map(records)

    fold_scores, _, _ = run_cross_validation(
        MAIN_MODEL_NAME, X, y, species_per_row, disease_species, n_folds, use_mask,
        augment_copies, flip_ratio,
    )
    return summarize(fold_scores)


def run_holdout_random_forest(X, y, records, test_size):
    """Chia hold-out mot lan, lap lai voi tung seed trong HOLDOUT_SEEDS.

    Tra ve (summary mean +/- std qua cac seed, accuracy thap nhat, accuracy cao nhat, so dong test).
    """
    species_per_row = [record["species"] for record in records]
    disease_species = build_disease_species_map(records)
    all_indexes = np.arange(len(y))

    seed_scores = []
    test_count = 0
    for seed in HOLDOUT_SEEDS:
        train_index, test_index = train_test_split(
            all_indexes, test_size=test_size, stratify=y, random_state=seed
        )
        model = build_models()[MAIN_MODEL_NAME]
        model.fit(X.iloc[train_index], y.iloc[train_index])

        test_species = []
        for index in test_index:
            test_species.append(species_per_row[index])
        y_pred = predict_with_species_mask(model, X.iloc[test_index], test_species, disease_species)
        seed_scores.append(compute_fold_metrics(y.iloc[test_index], y_pred))
        test_count = len(test_index)

    accuracy_values = []
    for scores in seed_scores:
        accuracy_values.append(scores["accuracy"])
    return summarize(seed_scores), min(accuracy_values), max(accuracy_values), test_count


# ─── Dung bang markdown ──────────────────────────────────────────────────────

def format_mean_std(pair):
    return f"{pair[0]:.3f} ± {pair[1]:.3f}"


def build_summary_table(summaries):
    header = "| Model | " + " | ".join(METRIC_TITLES[key] for key in METRIC_KEYS) + " |"
    lines = [header, "|---" * (len(METRIC_KEYS) + 1) + "|"]
    for name, summary in summaries.items():
        cells = []
        for key in METRIC_KEYS:
            cells.append(format_mean_std(summary[key]))
        lines.append(f"| {name} | " + " | ".join(cells) + " |")
    return "\n".join(lines)


def build_per_class_tables(y_true, y_pred, species_order, diseases_by_species, disease_names):
    """Mot bang per-class cho moi loai, kem dong trung binh macro cua loai do."""
    report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)

    sections = []
    for species_code, species_name in species_order:
        lines = [f"### {species_name}", ""]
        lines.append("| Bệnh | Mã | Precision | Recall | F1 | Số ca |")
        lines.append("|---|---|---|---|---|---|")

        precision_values = []
        recall_values = []
        f1_values = []
        for disease in diseases_by_species[species_code]:
            stats = report[disease]
            precision_values.append(stats["precision"])
            recall_values.append(stats["recall"])
            f1_values.append(stats["f1-score"])
            lines.append(
                f"| {disease_names[disease]} | `{disease}` | {stats['precision']:.2f} | "
                f"{stats['recall']:.2f} | {stats['f1-score']:.2f} | {int(stats['support'])} |"
            )

        lines.append(
            f"| **Trung bình loài** | | **{np.mean(precision_values):.2f}** | "
            f"**{np.mean(recall_values):.2f}** | **{np.mean(f1_values):.2f}** | |"
        )
        sections.append("\n".join(lines))
    return "\n\n".join(sections)


def build_confusion_tables(y_true, y_pred, species_order, diseases_by_species):
    """Confusion matrix tach theo loai: co species mask nen khong the nham sang loai khac."""
    sections = []
    for species_code, species_name in species_order:
        labels = diseases_by_species[species_code]
        species_true = []
        species_pred = []
        for true_label, predicted_label in zip(y_true, y_pred):
            if true_label in labels:
                species_true.append(true_label)
                species_pred.append(predicted_label)
        matrix = confusion_matrix(species_true, species_pred, labels=labels)

        header_cells = []
        for label in labels:
            header_cells.append(f"`{label}`")
        lines = [f"### {species_name}", ""]
        lines.append("| thật \\ đoán | " + " | ".join(header_cells) + " |")
        lines.append("|---" * (len(labels) + 1) + "|")
        for row_index, label in enumerate(labels):
            value_cells = []
            for column_index in range(len(labels)):
                value = matrix[row_index][column_index]
                if row_index == column_index:
                    value_cells.append(f"**{value}**")
                else:
                    value_cells.append(str(value))
            lines.append(f"| **`{label}`** | " + " | ".join(value_cells) + " |")
        sections.append("\n".join(lines))
    return "\n\n".join(sections)


def save_confusion_image(y_true, y_pred, species_order, diseases_by_species):
    figure, axes_grid = plt.subplots(2, 4, figsize=(22, 11))
    axes_list = axes_grid.flatten()

    for position, (species_code, _) in enumerate(species_order):
        labels = diseases_by_species[species_code]
        species_true = []
        species_pred = []
        for true_label, predicted_label in zip(y_true, y_pred):
            if true_label in labels:
                species_true.append(true_label)
                species_pred.append(predicted_label)

        axes = axes_list[position]
        ConfusionMatrixDisplay.from_predictions(
            species_true, species_pred, labels=labels,
            cmap="Blues", colorbar=False, ax=axes,
        )
        axes.set_title(f"{species_code} (n={len(species_true)})")
        axes.set_xlabel("Nhan du doan")
        axes.set_ylabel("Nhan that")
        plt.setp(axes.get_xticklabels(), rotation=45, ha="right", fontsize=8)
        plt.setp(axes.get_yticklabels(), fontsize=8)

    figure.suptitle(f"{MAIN_MODEL_NAME} - {MAIN_FOLDS}-fold CV out-of-fold, co species mask")
    figure.tight_layout()
    figure.savefig(CONFUSION_PATH, dpi=130)
    plt.close(figure)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    X, y, records = load_dataset(min_rows=MAIN_MIN_ROWS, include_breed=True)
    species_per_row = [record["species"] for record in records]
    disease_species = build_disease_species_map(records)

    symptoms_data = load_symptoms_json()
    species_order = []
    for species in symptoms_data["species"]:
        species_order.append((species["code"], species["vi"]))
    disease_names = {}
    for disease in symptoms_data["diseases"]:
        disease_names[disease["code"]] = disease["vi"]

    # Danh sach benh cua tung loai, sap xep theo ma de bang co dinh giua cac lan chay
    diseases_by_species = {}
    for species_code, _ in species_order:
        diseases_by_species[species_code] = []
    for disease in sorted(disease_species):
        diseases_by_species[disease_species[disease]].append(disease)

    print(f"Du lieu: {len(y)} dong / {y.nunique()} benh / {X.shape[1]} cot feature")
    print(f"{MAIN_FOLDS}-fold stratified CV, random_state={RANDOM_STATE}\n")

    # 1. So sanh 3 model tren cau hinh chinh
    summaries = {}
    main_out_of_fold = None
    leaked_per_fold = None
    for name in build_models():
        fold_scores, out_of_fold, leaked = run_cross_validation(
            name, X, y, species_per_row, disease_species, MAIN_FOLDS
        )
        summaries[name] = summarize(fold_scores)
        if name == MAIN_MODEL_NAME:
            main_out_of_fold = out_of_fold
            leaked_per_fold = leaked

        summary = summaries[name]
        print(f"{name}")
        print(f"  accuracy {format_mean_std(summary['accuracy'])} | "
              f"precision {format_mean_std(summary['precision_macro'])} | "
              f"recall {format_mean_std(summary['recall_macro'])} | "
              f"F1 {format_mean_std(summary['f1_macro'])}  (macro)")

    # 2. Thi nghiem phu - chi Random Forest
    print("\nThi nghiem phu (Random Forest):")
    experiments = {}
    experiments[f"Mô hình chính: ≥ {MAIN_MIN_ROWS} dòng, đủ feature, {MAIN_FOLDS}-fold"] = summaries[MAIN_MODEL_NAME]
    X_yes_no, y_yes_no, records_yes_no = load_dataset(min_rows=MAIN_MIN_ROWS, use_yes_no_columns=True)
    experiments["Giữ 9 cột Yes/No"] = run_random_forest(X_yes_no, y_yes_no, records_yes_no, MAIN_FOLDS)
    experiments["Bỏ feature giống"] = run_random_forest(drop_breed_columns(X), y, records, MAIN_FOLDS)
    experiments["Chỉ loài + triệu chứng"] = run_random_forest(keep_species_and_symptoms(X), y, records, MAIN_FOLDS)
    experiments["Không dùng species mask"] = run_random_forest(X, y, records, MAIN_FOLDS, use_mask=False)

    X_compare, y_compare, records_compare = load_dataset(min_rows=COMPARE_MIN_ROWS, include_breed=True)
    compare_name = (f"Ngưỡng ≥ {COMPARE_MIN_ROWS} dòng ({y_compare.nunique()} bệnh / "
                    f"{len(y_compare)} dòng), {COMPARE_FOLDS}-fold")
    experiments[compare_name] = run_random_forest(X_compare, y_compare, records_compare, COMPARE_FOLDS)

    for name, summary in experiments.items():
        print(f"  {name}: accuracy {format_mean_std(summary['accuracy'])} | "
              f"F1 macro {format_mean_std(summary['f1_macro'])}")

    # 3. Cach chia du lieu - Random Forest
    print("\nCach chia du lieu (Random Forest):")
    split_summaries = {}
    split_notes = []
    split_summaries[f"{MAIN_FOLDS}-fold CV (mô hình chính)"] = summaries[MAIN_MODEL_NAME]
    for test_size, split_name in HOLDOUT_SPLITS:
        summary, lowest, highest, test_count = run_holdout_random_forest(X, y, records, test_size)
        row_name = f"Hold-out {split_name} ({len(y) - test_count} train / {test_count} test)"
        split_summaries[row_name] = summary
        split_notes.append(
            f"- **{split_name}**: accuracy thấp nhất {lowest:.3f}, cao nhất {highest:.3f} "
            f"qua {len(HOLDOUT_SEEDS)} seed"
        )
        print(f"  {row_name}: accuracy {format_mean_std(summary['accuracy'])} "
              f"[{lowest:.2f} - {highest:.2f}] | F1 macro {format_mean_std(summary['f1_macro'])}")

    # 4. Tang cuong du lieu - Random Forest
    print("\nTang cuong du lieu (Random Forest, chi tang cuong tap train):")
    augment_summaries = {}
    for copies, flip_ratio in AUGMENT_CONFIGS:
        if copies == 0:
            row_name = "Trước tăng cường (dữ liệu gốc)"
            augment_summaries[row_name] = summaries[MAIN_MODEL_NAME]
        else:
            row_name = f"Sau tăng cường: ×{copies} bản sao, đảo {flip_ratio:.0%} triệu chứng"
            augment_summaries[row_name] = run_random_forest(
                X, y, records, MAIN_FOLDS, augment_copies=copies, flip_ratio=flip_ratio
            )
        summary = augment_summaries[row_name]
        print(f"  {row_name}: accuracy {format_mean_std(summary['accuracy'])} | "
              f"F1 macro {format_mean_std(summary['f1_macro'])}")

    save_confusion_image(list(y), main_out_of_fold, species_order, diseases_by_species)
    write_report(X, y, summaries, experiments, split_summaries, split_notes, augment_summaries,
                 main_out_of_fold, leaked_per_fold, species_order, diseases_by_species, disease_names)

    print(f"\nDa ghi {METRICS_PATH.relative_to(PROJECT_ROOT)}")
    print(f"Da ghi {CONFUSION_PATH.relative_to(PROJECT_ROOT)}")
    return 0


def write_report(X, y, summaries, experiments, split_summaries, split_notes, augment_summaries,
                 out_of_fold, leaked_per_fold, species_order, diseases_by_species, disease_names):
    y_true = list(y)
    total_leaked = sum(leaked_per_fold)
    leaked_text = ", ".join(str(count) for count in leaked_per_fold)

    consistency_lines = []
    for column, mentioned_count, mentioned_ratio, not_mentioned_ratio in measure_yes_no_consistency():
        consistency_lines.append(
            f"| `{column}` | {mentioned_count} | {mentioned_ratio:.0%} | {not_mentioned_ratio:.0%} |"
        )

    species_lines = []
    for species_code, species_name in species_order:
        row_count = 0
        for label in y_true:
            if label in diseases_by_species[species_code]:
                row_count += 1
        species_lines.append(
            f"| {species_name} | {len(diseases_by_species[species_code])} | {row_count} |"
        )

    content = f"""# Kết quả đánh giá — `cleaned_animal`, 8 loài

> ⚠️ **File này sinh tự động bởi `ai_service/scripts/train_cleaned_animal.py`. Đừng sửa tay.**
> Phần nhận xét, đánh giá nằm ở `ca_results.md`.

**Ngày chạy:** {date.today().isoformat()}
**Dữ liệu:** `cleaned_animal_disease_prediction.csv` qua `mapping_cleaned_animal.csv` — **{len(y)} dòng / {y.nunique()} bệnh** (bệnh ≥ {MAIN_MIN_ROWS} dòng sau khi gộp tên đồng nghĩa)
**Feature:** {X.shape[1]} cột = loài (one-hot) + giống (one-hot) + triệu chứng (0/1, chỉ từ 4 cột chữ `Symptom_1..4`) + tuổi, cân nặng, nhiệt độ, nhịp tim, số ngày bệnh, giới tính
**Đánh giá:** {MAIN_FOLDS}-fold stratified CV, `shuffle=True`, `random_state={RANDOM_STATE}`. Hold-out 70/30 và 80/20 chỉ là thí nghiệm so sánh ở mục 3 (QĐ-16)
**Dự đoán:** mọi model đều qua species mask — chỉ chọn trong các bệnh của đúng loài, giống `app.py`

| Loài | Số bệnh | Số dòng |
|---|---|---|
{chr(10).join(species_lines)}

---

## 1. So sánh model — Accuracy, Precision, Recall, F1

Mỗi ô là `trung bình ± độ lệch chuẩn` qua {MAIN_FOLDS} fold.

{build_summary_table(summaries)}

- **Macro**: trung bình cộng của từng bệnh, mỗi bệnh nặng như nhau — bệnh 3 dòng có tiếng nói ngang bệnh 21 dòng.
- **Weighted**: trung bình có trọng số theo số ca — gần với accuracy hơn.
- Dummy ở đây luôn đoán bệnh có nhiều ca nhất **của loài đó**, nên đã là mức sàn cao hơn đoán ngẫu nhiên.

---

## 2. Thí nghiệm so sánh — Random Forest

{build_summary_table(experiments)}

---

## 3. So sánh cách chia dữ liệu — Random Forest

Hold-out chia **một lần**, nên mỗi tỉ lệ chạy với {len(HOLDOUT_SEEDS)} seed khác nhau (`random_state` = {", ".join(str(seed) for seed in HOLDOUT_SEEDS)}) và lấy `trung bình ± độ lệch chuẩn` qua các seed.

{build_summary_table(split_summaries)}

{chr(10).join(split_notes)}

Đổi cách chia chỉ đổi **cách đo**, không làm model học tốt hơn. Bệnh 3 dòng: 70/30 chỉ còn 2 dòng train / 1 dòng test.

---

## 4. Trước và sau tăng cường dữ liệu — Random Forest, {MAIN_FOLDS}-fold CV

Mỗi dòng **train** sinh thêm N bản sao: đảo ngẫu nhiên một tỉ lệ cột triệu chứng (0 ↔ 1) và nhân các cột số với (1 + nhiễu chuẩn {AUGMENT_NUMERIC_NOISE:.0%}).
Chỉ tăng cường tập train của từng fold — tập test giữ nguyên dữ liệu thật. Tăng cường trước khi chia thì bản sao của dòng test lọt vào train, số sẽ đẹp giả.

{build_summary_table(augment_summaries)}

---

## 5. Vì sao bỏ 9 cột Yes/No

Mỗi dòng ghi triệu chứng ở hai nơi: 4 cột chữ `Symptom_1..4` và 9 cột Yes/No (`Vomiting`, `Diarrhea`...).
Dữ liệu nhất quán thì cột chữ có ghi → cột Yes/No phải gần 100% Yes, không ghi → gần 0%. Đo trên toàn bộ 431 dòng, **không nhìn nhãn bệnh**:

| Cột Yes/No | Số dòng cột chữ có ghi | Tỉ lệ Yes khi cột chữ **có** ghi | Tỉ lệ Yes khi cột chữ **không** ghi |
|---|---|---|---|
{chr(10).join(consistency_lines)}

Hai cột tỉ lệ gần bằng nhau → cột Yes/No gần như điền ngẫu nhiên, mâu thuẫn với cột chữ. Vì phép đo không dùng nhãn,
việc bỏ cột là sửa lỗi dữ liệu chứ không phải chọn feature theo kết quả. Kết quả khi vẫn giữ các cột này: xem dòng "Giữ 9 cột Yes/No" ở mục 2.

---

## 6. Kiểm tra rò rỉ dữ liệu do dòng trùng lặp

Số dòng test có bản sao y hệt (cả feature lẫn nhãn) trong tập train của cùng fold: **{leaked_text}** (tổng {total_leaked}/{len(y)}).
Những dòng này model chỉ cần nhớ lại là đúng — kết quả bị nâng lên tương ứng. Không xóa dòng trùng (QĐ-12).

---

## 7. Precision / Recall / F1 từng bệnh — {MAIN_MODEL_NAME}, out-of-fold

Mỗi dòng dữ liệu được dự đoán đúng một lần bởi model **không** thấy dòng đó lúc train.
Bệnh chỉ có 3 ca thì recall chỉ có thể là 0.00 / 0.33 / 0.67 / 1.00.

{build_per_class_tables(y_true, out_of_fold, species_order, diseases_by_species, disease_names)}

---

## 8. Confusion matrix — {MAIN_MODEL_NAME}, out-of-fold, theo loài

Có species mask nên model chỉ có thể nhầm giữa các bệnh **cùng loài**.

{build_confusion_tables(y_true, out_of_fold, species_order, diseases_by_species)}

Bản hình: `ca_confusion_matrix.png`
"""

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        f.write(content)


if __name__ == "__main__":
    sys.exit(main())
