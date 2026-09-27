"""Doi chieu mapping_dogfinal3.csv voi dogfinal3.csv va shared/symptoms.json.

Chay: python ai_service/scripts/check_mapping.py

Muc dich: bang anh xa nay nam tren duong di cua moi con so bao cao (R1/R2/R3 - QD-12).
Sua symptoms.json ma quen sua bang anh xa thi notebook VAN CHAY va VAN RA KET QUA,
chi la ket qua sai. Khong co script nay thi khong cach nao phat hien.
"""

import csv
import json
import sys
from pathlib import Path

# Console Windows mac dinh khong dung UTF-8, khong reconfigure thi in tieng Viet co dau se loi
sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SYMPTOMS_PATH = PROJECT_ROOT / "shared" / "symptoms.json"
MAPPING_PATH = PROJECT_ROOT / "ai_service" / "data" / "mapping_dogfinal3.csv"
DOGFINAL3_PATH = PROJECT_ROOT / "ai_service" / "data" / "external" / "dogfinal3.csv"

EXPECTED_COLUMNS = ["kind", "source", "target", "note"]
LABEL_COLUMN = "diseases"


def load_symptoms_file():
    with open(SYMPTOMS_PATH, encoding="utf-8") as f:
        return json.load(f)


def load_mapping_rows():
    with open(MAPPING_PATH, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        return reader.fieldnames, list(reader)


def load_dogfinal3_header_and_labels():
    """Tra ve (danh sach cot trieu chung, tap nhan benh) cua dogfinal3.csv."""
    with open(DOGFINAL3_PATH, encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        symptom_columns = []
        for column in header:
            if column != LABEL_COLUMN:
                symptom_columns.append(column)

        labels = set()
        for row in reader:
            if row:
                labels.add(row[0].strip())

    return symptom_columns, labels


def check_header(header, errors):
    if header != EXPECTED_COLUMNS:
        errors.append("Dong tieu de khong khop")
        errors.append(f"  Mong doi: {EXPECTED_COLUMNS}")
        errors.append(f"  Thuc te:  {header}")


def check_symptom_mapping(symptom_rows, symptom_columns, valid_symptoms, errors):
    """Moi cot cua dogfinal3 phai xuat hien dung mot lan, target phai ton tai."""
    sources = []
    for row in symptom_rows:
        sources.append(row["source"].strip())

    for column in symptom_columns:
        count = sources.count(column)
        if count == 0:
            errors.append(f"cot '{column}' cua dogfinal3 chua duoc anh xa")
        elif count > 1:
            errors.append(f"cot '{column}' xuat hien {count} lan trong bang anh xa")

    for source in sources:
        if source not in symptom_columns:
            errors.append(f"source '{source}' khong co trong dogfinal3.csv")

    for row in symptom_rows:
        target = row["target"].strip()
        # Target rong = co y bo cot do. Bat buoc phai giai thich trong cot note.
        if target == "":
            if row["note"].strip() == "":
                errors.append(f"'{row['source']}' bi bo ma khong ghi ly do o cot note")
            continue
        if target not in valid_symptoms:
            errors.append(f"'{row['source']}' -> '{target}' khong co trong symptoms.json")


def check_disease_mapping(disease_rows, labels, valid_diseases, errors):
    sources = []
    for row in disease_rows:
        sources.append(row["source"].strip())

    for label in sorted(labels):
        if label not in sources:
            errors.append(f"nhan benh '{label}' cua dogfinal3 chua duoc anh xa")

    for row in disease_rows:
        source = row["source"].strip()
        target = row["target"].strip()

        if source not in labels:
            errors.append(f"nhan benh '{source}' khong co trong dogfinal3.csv")

        if target == "":
            if row["note"].strip() == "":
                errors.append(f"nhan '{source}' bi bo ma khong ghi ly do o cot note")
            continue
        if target not in valid_diseases:
            errors.append(f"nhan '{source}' -> '{target}' khong co trong symptoms.json")


def print_summary(symptom_rows, disease_rows, valid_symptoms):
    mapped = []
    dropped = []
    targets = set()
    for row in symptom_rows:
        if row["target"].strip():
            mapped.append(row)
            targets.add(row["target"].strip())
        else:
            dropped.append(row["source"].strip())

    mapped_diseases = []
    dropped_diseases = []
    for row in disease_rows:
        if row["target"].strip():
            mapped_diseases.append(row)
        else:
            dropped_diseases.append(row["source"].strip())

    print(f"Trieu chung: {len(symptom_rows)} cot -> anh xa {len(mapped)}, bo {len(dropped)}")
    print(f"             gom ve {len(targets)} ma cua symptoms.json")
    if dropped:
        print(f"             bo: {', '.join(dropped)}")

    print(f"Nhan benh  : {len(disease_rows)} nhan -> anh xa {len(mapped_diseases)}, "
          f"bo {len(dropped_diseases)}")
    if dropped_diseases:
        print(f"             bo: {', '.join(dropped_diseases)}")

    # Ma khong co nguon trong dogfinal3 se LUON bang 0 o tap test that.
    # Khong phai loi, nhung phai biet truoc de khong hieu nham ket qua R2/R3.
    orphans = sorted(valid_symptoms - targets)
    print(f"\nMa symptoms.json khong co nguon trong dogfinal3: {len(orphans)}")
    print(f"  {', '.join(orphans)}")
    print("  (cac ma nay luon = 0 o tap test that - anh huong toi recall cua R2/R3)")


def main():
    for path in (SYMPTOMS_PATH, MAPPING_PATH, DOGFINAL3_PATH):
        if not path.exists():
            print(f"Khong tim thay {path}")
            return 1

    symptoms_data = load_symptoms_file()
    valid_symptoms = set()
    for symptom in symptoms_data["symptoms"]:
        valid_symptoms.add(symptom["code"])
    valid_diseases = set()
    for disease in symptoms_data["diseases"]:
        valid_diseases.add(disease["code"])

    header, rows = load_mapping_rows()

    errors = []
    check_header(header, errors)
    if errors:
        print("KHONG DAT - loi cau truc file:")
        for error in errors:
            print(f"  - {error}")
        return 1

    symptom_columns, labels = load_dogfinal3_header_and_labels()

    symptom_rows = []
    disease_rows = []
    for row in rows:
        kind = row["kind"].strip()
        if kind == "symptom":
            symptom_rows.append(row)
        elif kind == "disease":
            disease_rows.append(row)
        else:
            errors.append(f"cot 'kind' phai la 'symptom' hoac 'disease' (dang la {kind!r})")

    check_symptom_mapping(symptom_rows, symptom_columns, valid_symptoms, errors)
    check_disease_mapping(disease_rows, labels, valid_diseases, errors)

    print(f"symptoms.json  : version {symptoms_data['version']}, "
          f"{len(valid_symptoms)} trieu chung, {len(valid_diseases)} benh")
    print(f"dogfinal3.csv  : {len(symptom_columns)} cot trieu chung, {len(labels)} nhan benh")
    print()

    if errors:
        print(f"KHONG DAT - {len(errors)} loi:")
        for error in errors:
            print(f"  - {error}")
        return 1

    print("DAT - tat ca kiem tra deu qua.\n")
    print_summary(symptom_rows, disease_rows, valid_symptoms)
    return 0


if __name__ == "__main__":
    sys.exit(main())
