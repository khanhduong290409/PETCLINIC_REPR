"""Doc dogfinal3.csv va chuyen thanh ma tran feature theo chuan symptoms.json.

Chay truc tiep de xem thong ke: python ai_service/scripts/load_real_data.py

Dung chung cho ca R1 va R3 (QD-12). De o file rieng thay vi nhet trong
train_baseline.py vi R3 phai tron dung 113 dong that da dung o R1 - copy code sang
file khac thi hai che do co the lech nhau ma khong co gi bao loi.

Gia dinh dau vao da duoc check_mapping.py xac minh truoc do:
moi cot cua dogfinal3 deu co dong tuong ung trong bang anh xa, va moi target
deu ton tai trong symptoms.json. File nay khong kiem tra lai viec do.
"""

import csv
import json
import sys
from pathlib import Path

import pandas as pd

# Console Windows mac dinh khong dung UTF-8, khong reconfigure thi in tieng Viet co dau se loi
sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SYMPTOMS_PATH = PROJECT_ROOT / "shared" / "symptoms.json"
MAPPING_PATH = PROJECT_ROOT / "ai_service" / "data" / "mapping_dogfinal3.csv"
DOGFINAL3_PATH = PROJECT_ROOT / "ai_service" / "data" / "external" / "dogfinal3.csv"

LABEL_COLUMN = "diseases"


def load_symptom_codes():
    """Danh sach ma trieu chung theo DUNG thu tu trong symptoms.json.

    Thu tu nay chinh la thu tu cot cua feature vector (QD-04). Doi thu tu la hong
    model ma khong he bao loi, nen tuyet doi khong sort lai o day.
    """
    with open(SYMPTOMS_PATH, encoding="utf-8") as f:
        symptoms_data = json.load(f)

    codes = []
    for symptom in symptoms_data["symptoms"]:
        codes.append(symptom["code"])
    return codes


def load_mapping():
    """Tra ve (symptom_map, disease_map). Dong co target rong = co y bo, khong dua vao dict."""
    symptom_map = {}
    disease_map = {}

    with open(MAPPING_PATH, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            kind = row["kind"].strip()
            source = row["source"].strip()
            target = row["target"].strip()

            if target == "":
                continue

            if kind == "symptom":
                symptom_map[source] = target
            elif kind == "disease":
                disease_map[source] = target

    return symptom_map, disease_map


def load_real_data():
    """Doc dogfinal3.csv -> (X, y).

    X: DataFrame 141 dong x 51 cot, gia tri 0/1, ten cot la ma cua symptoms.json.
    y: Series nhan benh da doi sang ma cua symptoms.json.

    Giu du 51 cot chu khong phai 33 cot map duoc: R2 train tren du lieu sinh (du 51
    cot) roi test tren chinh tap nay, nen ba che do phai cung mot khong gian feature
    thi moi so sanh duoc (QD-12). 18 cot khong co nguon trong dogfinal3 se luon bang 0
    o R1 - da biet truoc, check_mapping.py in ra danh sach do.
    """
    symptom_codes = load_symptom_codes()
    symptom_map, disease_map = load_mapping()

    feature_rows = []
    labels = []
    dropped_count = 0

    with open(DOGFINAL3_PATH, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        for line_number, row in enumerate(reader, start=2):
            raw_label = row[LABEL_COLUMN].strip()

            # Nhan khong co trong dict = benh da bi loai khoi pham vi (heartworm, QD-10)
            if raw_label not in disease_map:
                dropped_count += 1
                continue

            # Tao vector 51 so 0, roi bat len 1 theo tung cot co trong dong nay.
            # Nhieu cot goc co the tro cung mot ma (vi du 4 cot -> lethargy);
            # gan 1 nhieu lan van ra 1 nen day chinh la phep OR.
            feature_values = {}
            for code in symptom_codes:
                feature_values[code] = 0

            for source_column, cell in row.items():
                if source_column == LABEL_COLUMN:
                    continue
                if source_column not in symptom_map:
                    continue

                value = cell.strip()
                if value == "1":
                    feature_values[symptom_map[source_column]] = 1
                elif value != "0":
                    raise ValueError(
                        f"dogfinal3.csv dong {line_number}, cot '{source_column}': "
                        f"gia tri {value!r} khong phai 0 hoac 1"
                    )

            feature_rows.append(feature_values)
            labels.append(disease_map[raw_label])

    X = pd.DataFrame(feature_rows, columns=symptom_codes)
    y = pd.Series(labels, name="disease")

    print(f"dogfinal3.csv: doc {len(feature_rows) + dropped_count} dong, "
          f"bo {dropped_count} dong ngoai pham vi -> con {len(feature_rows)} dong")

    return X, y


def print_statistics(X, y):
    """Thong ke de dua vao bao cao va de phat hien som van de cua tap du lieu."""
    print(f"\nMa tran feature: {X.shape[0]} dong x {X.shape[1]} cot")

    print("\nPhan bo nhan:")
    for disease, count in y.value_counts().items():
        print(f"  {disease:<16} {count:>3} dong")

    # Dong trung lap hoan toan (ca feature lan nhan) la nguon ro ri du lieu khi split:
    # ban sao co the roi vao ca train lan test. Da loai symtomdata.csv vi ly do nay (QD-11),
    # nen phai do luon o tap that de bao cao trung thuc.
    combined = X.copy()
    combined["_label"] = y
    duplicate_count = combined.duplicated().sum()
    duplicate_ratio = duplicate_count / len(combined) * 100
    print(f"\nDong trung lap hoan toan: {duplicate_count}/{len(combined)} ({duplicate_ratio:.1f}%)")

    # Dong khong co trieu chung nao: model khong the hoc gi tu no, ma van tinh vao accuracy
    symptom_count_per_row = X.sum(axis=1)
    empty_count = (symptom_count_per_row == 0).sum()
    print(f"Dong khong co trieu chung nao: {empty_count}")
    print(f"So trieu chung moi dong: trung binh {symptom_count_per_row.mean():.1f}, "
          f"it nhat {symptom_count_per_row.min()}, nhieu nhat {symptom_count_per_row.max()}")

    always_zero = []
    for code in X.columns:
        if X[code].sum() == 0:
            always_zero.append(code)
    print(f"\nCot luon bang 0: {len(always_zero)}/{X.shape[1]}")
    print(f"  {', '.join(always_zero)}")


def main():
    for path in (SYMPTOMS_PATH, MAPPING_PATH, DOGFINAL3_PATH):
        if not path.exists():
            print(f"Khong tim thay {path}")
            return 1

    X, y = load_real_data()
    print_statistics(X, y)
    return 0


if __name__ == "__main__":
    sys.exit(main())
