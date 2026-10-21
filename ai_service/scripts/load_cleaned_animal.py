"""Doc cleaned_animal_disease_prediction.csv va dung ma tran feature (QD-16).

Chay truc tiep de xem thong ke: python ai_service/scripts/load_cleaned_animal.py

Dung chung cho script danh gia (train_cleaned_animal.py) VA service (app.py).
Hai noi phai dung cung mot cach dung feature: lech mot cot la model doan sai
hoan toan ma khong bao loi (cung ly do voi QD-04).

Moi dong CSV -> mot "ban ghi" (dict) gom: species, breed, age, gender, weight,
temperature, heart_rate, duration_days, symptoms (set ma), disease.
app.py cung tao ban ghi y het tu request roi goi records_to_matrix(),
nen feature luc train va luc du doan di qua dung mot ham.
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
MAPPING_PATH = PROJECT_ROOT / "ai_service" / "data" / "mapping_cleaned_animal.csv"
DATA_PATH = PROJECT_ROOT / "ai_service" / "data" / "cleaned_animal_disease_prediction.csv"

# Nguong so dong toi thieu moi benh - model chinh dung 3 (QD-16)
DEFAULT_MIN_ROWS = 3

# 9 cot Yes/No (Vomiting, Diarrhea...) mac dinh KHONG dung: do bang
# measure_yes_no_consistency() thay chung gan nhu ngau nhien, khong khop voi
# 4 cot chu (vd. cot chu ghi Diarrhea -> cot Diarrhea = Yes 56%, khong ghi -> van 48%).
# Phep do nay khong nhin nhan benh, nen bo cot la sua loi du lieu, khong phai chon feature theo ket qua.
DEFAULT_USE_YES_NO_COLUMNS = False

SYMPTOM_TEXT_COLUMNS = ["Symptom_1", "Symptom_2", "Symptom_3", "Symptom_4"]
NUMERIC_FIELDS = ["age", "weight", "temperature", "heart_rate", "duration_days"]


# ─── Doc file cau hinh ───────────────────────────────────────────────────────

def load_symptoms_json():
    with open(SYMPTOMS_PATH, encoding="utf-8") as f:
        return json.load(f)


def load_mapping():
    """Tra ve (symptom_map, column_map, disease_map). Target rong = co y bo, khong dua vao dict.

    symptom_map: chuoi trong cot Symptom_1..4 -> ma trieu chung
    column_map : ten cot Yes/No -> ma trieu chung
    disease_map: "Loai|Nhan goc" -> ma benh
    """
    symptom_map = {}
    column_map = {}
    disease_map = {}

    with open(MAPPING_PATH, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            kind = row["kind"].strip()
            source = row["source"].strip()
            target = row["target"].strip()

            if target == "":
                continue

            if kind == "symptom":
                symptom_map[source] = target
            elif kind == "column":
                column_map[source] = target
            elif kind == "disease":
                disease_map[source] = target

    return symptom_map, column_map, disease_map


# ─── Chuyen chuoi trong CSV sang so ──────────────────────────────────────────

def parse_duration_days(text):
    """'5 days' -> 5, '1 week' -> 7, '2 weeks' -> 14."""
    parts = text.strip().split()
    amount = int(parts[0])
    unit = parts[1].lower()
    if unit.startswith("week"):
        return amount * 7
    if unit.startswith("day"):
        return amount
    raise ValueError(f"Khong hieu don vi thoi gian: {text!r}")


def parse_temperature(text):
    """'39.5°C' -> 39.5"""
    cleaned = text.strip().replace("°C", "").replace("°", "").replace("C", "")
    return float(cleaned)


# ─── Doc du lieu ─────────────────────────────────────────────────────────────

def load_records(min_rows=DEFAULT_MIN_ROWS, use_yes_no_columns=DEFAULT_USE_YES_NO_COLUMNS):
    """Doc CSV -> danh sach ban ghi, chi giu benh co >= min_rows dong sau khi gop ten.

    Nguong tinh SAU khi gop ten dong nghia (nhieu nhan goc -> mot ma benh),
    vi mot benh co the chi 1-2 dong moi cach viet nhung tong lai du nguong.
    """
    symptoms_data = load_symptoms_json()
    symptom_map, column_map, disease_map = load_mapping()

    species_by_source = {}
    for species in symptoms_data["species"]:
        species_by_source[species["source"]] = species["code"]

    all_records = []
    with open(DATA_PATH, encoding="utf-8-sig", newline="") as f:
        for line_number, row in enumerate(csv.DictReader(f), start=2):
            source_species = row["Animal_Type"].strip()
            disease_key = source_species + "|" + row["Disease_Prediction"].strip()

            # Khong co trong dict = benh duoi nguong da danh dau bo trong mapping
            if disease_key not in disease_map:
                continue

            # Trieu chung lay tu 4 cot chu; chi OR them 9 cot Yes/No khi chay thi nghiem so sanh
            symptoms = set()
            for column in SYMPTOM_TEXT_COLUMNS:
                text = row[column].strip()
                if text in symptom_map:
                    symptoms.add(symptom_map[text])

            if use_yes_no_columns:
                for column, code in column_map.items():
                    value = row[column].strip()
                    if value == "Yes":
                        symptoms.add(code)
                    elif value != "No":
                        raise ValueError(f"Dong {line_number}, cot '{column}': {value!r} khong phai Yes/No")

            record = {
                "species": species_by_source[source_species],
                "breed": row["Breed"].strip(),
                "age": float(row["Age"]),
                "gender": row["Gender"].strip().upper(),
                "weight": float(row["Weight"]),
                "temperature": parse_temperature(row["Body_Temperature"]),
                "heart_rate": float(row["Heart_Rate"]),
                "duration_days": parse_duration_days(row["Duration"]),
                "symptoms": symptoms,
                "disease": disease_map[disease_key],
            }
            all_records.append(record)

    # Dem so dong moi benh roi loc theo nguong
    count_by_disease = {}
    for record in all_records:
        disease = record["disease"]
        count_by_disease[disease] = count_by_disease.get(disease, 0) + 1

    kept_records = []
    for record in all_records:
        if count_by_disease[record["disease"]] >= min_rows:
            kept_records.append(record)

    return kept_records


# ─── Dung feature ────────────────────────────────────────────────────────────

def build_feature_columns(records, include_breed=True):
    """Thu tu cot feature. Thu tu nay phai giong het luc train va luc du doan.

    1. Loai     : species_<CODE>, theo thu tu mang 'species' cua symptoms.json
    2. Giong    : breed_<CODE>_<Ten giong>, sap xep chu cai (giong co the trung ten giua 2 loai)
    3. Trieu chung: ma theo thu tu mang 'symptoms' cua symptoms.json (QD-04)
    4. So       : NUMERIC_FIELDS + gender_male
    """
    symptoms_data = load_symptoms_json()
    columns = []

    for species in symptoms_data["species"]:
        columns.append("species_" + species["code"])

    if include_breed:
        breed_columns = set()
        for record in records:
            breed_columns.add(breed_column_name(record["species"], record["breed"]))
        columns.extend(sorted(breed_columns))

    for symptom in symptoms_data["symptoms"]:
        columns.append(symptom["code"])

    columns.extend(NUMERIC_FIELDS)
    columns.append("gender_male")
    return columns


def breed_column_name(species_code, breed):
    return f"breed_{species_code}_{breed}"


def records_to_matrix(records, columns):
    """Danh sach ban ghi -> DataFrame theo dung thu tu cot.

    Giong khong co trong danh sach cot (giong la, hoac bo feature giong) thi
    moi cot giong deu = 0. Ban ghi phai co du cac truong so - app.py tu dien
    gia tri thieu truoc khi goi ham nay.
    """
    column_set = set(columns)
    rows = []
    for record in records:
        values = {}
        for column in columns:
            values[column] = 0

        values["species_" + record["species"]] = 1

        breed_column = breed_column_name(record["species"], record["breed"])
        if breed_column in column_set:
            values[breed_column] = 1

        for code in record["symptoms"]:
            if code in column_set:
                values[code] = 1

        for field in NUMERIC_FIELDS:
            values[field] = record[field]

        if record["gender"] == "MALE":
            values["gender_male"] = 1

        rows.append(values)

    return pd.DataFrame(rows, columns=columns)


def load_dataset(min_rows=DEFAULT_MIN_ROWS, include_breed=True,
                 use_yes_no_columns=DEFAULT_USE_YES_NO_COLUMNS):
    """Tien dung cho script danh gia: tra ve (X, y, records)."""
    records = load_records(min_rows, use_yes_no_columns)
    columns = build_feature_columns(records, include_breed)
    X = records_to_matrix(records, columns)

    labels = []
    for record in records:
        labels.append(record["disease"])
    y = pd.Series(labels, name="disease")
    return X, y, records


# ─── Kiem tra chat luong du lieu ─────────────────────────────────────────────

def measure_yes_no_consistency():
    """Moi cot Yes/No co khop voi 4 cot chu khong? Doc toan bo 431 dong, KHONG nhin nhan benh.

    Tra ve list (ten cot, so dong cot chu co ghi, ti le Yes khi cot chu co ghi,
    ti le Yes khi cot chu khong ghi). Du lieu nhat quan thi cot 1 gan 100%, cot 2 gan 0%.
    """
    symptom_map, column_map, _ = load_mapping()

    stats = {}
    for column in column_map:
        stats[column] = {"mentioned": 0, "mentioned_yes": 0, "not_mentioned": 0, "not_mentioned_yes": 0}

    with open(DATA_PATH, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            text_codes = set()
            for text_column in SYMPTOM_TEXT_COLUMNS:
                text = row[text_column].strip()
                if text in symptom_map:
                    text_codes.add(symptom_map[text])

            for column, code in column_map.items():
                is_yes = row[column].strip() == "Yes"
                if code in text_codes:
                    stats[column]["mentioned"] += 1
                    if is_yes:
                        stats[column]["mentioned_yes"] += 1
                else:
                    stats[column]["not_mentioned"] += 1
                    if is_yes:
                        stats[column]["not_mentioned_yes"] += 1

    results = []
    for column, counts in stats.items():
        mentioned_ratio = 0.0
        if counts["mentioned"] > 0:
            mentioned_ratio = counts["mentioned_yes"] / counts["mentioned"]
        not_mentioned_ratio = 0.0
        if counts["not_mentioned"] > 0:
            not_mentioned_ratio = counts["not_mentioned_yes"] / counts["not_mentioned"]
        results.append((column, counts["mentioned"], mentioned_ratio, not_mentioned_ratio))
    return results


# ─── Thong ke khi chay truc tiep ─────────────────────────────────────────────

def print_statistics(X, y, records):
    print(f"Ma tran feature: {X.shape[0]} dong x {X.shape[1]} cot")
    print(f"So benh: {y.nunique()}")

    count_by_species = {}
    diseases_by_species = {}
    for record in records:
        species = record["species"]
        count_by_species[species] = count_by_species.get(species, 0) + 1
        if species not in diseases_by_species:
            diseases_by_species[species] = set()
        diseases_by_species[species].add(record["disease"])

    print("\nTheo loai (so dong / so benh):")
    for species, count in count_by_species.items():
        print(f"  {species:<7} {count:>3} dong / {len(diseases_by_species[species])} benh")

    print("\nPhan bo nhan:")
    for disease, count in y.value_counts().items():
        print(f"  {disease:<28} {count:>3} dong")

    # Dong trung hoan toan la nguon ro ri khi chia fold - do va cong bo, khong xoa (QD-12)
    combined = X.copy()
    combined["_label"] = y
    duplicate_count = combined.duplicated().sum()
    print(f"\nDong trung lap hoan toan: {duplicate_count}/{len(combined)}")

    empty_count = 0
    for record in records:
        if len(record["symptoms"]) == 0:
            empty_count += 1
    print(f"Dong khong co trieu chung nao: {empty_count}")


def main():
    for path in (SYMPTOMS_PATH, MAPPING_PATH, DATA_PATH):
        if not path.exists():
            print(f"Khong tim thay {path}")
            return 1

    X, y, records = load_dataset()
    print_statistics(X, y, records)

    print("\nDo khop cot Yes/No voi 4 cot chu (ti le Yes):")
    for column, mentioned_count, mentioned_ratio, not_mentioned_ratio in measure_yes_no_consistency():
        print(f"  {column:<18} cot chu co ghi (n={mentioned_count:>3}): {mentioned_ratio:.2f} | "
              f"khong ghi: {not_mentioned_ratio:.2f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
