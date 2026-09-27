"""Doi chieu disease_constraints.csv voi shared/symptoms.json.

Chay: python ai_service/scripts/check_constraints.py

Muc dich: bat cac loi im lang truoc khi sinh du lieu. Lech mot cot hoac sai mot ma
benh se khong lam script sinh du lieu bao loi, no chi lam model hoc sai.
"""

import csv
import json
import sys
from pathlib import Path

# Console Windows mac dinh khong dung UTF-8, khong reconfigure thi in tieng Viet co dau se loi
sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SYMPTOMS_PATH = PROJECT_ROOT / "shared" / "symptoms.json"
CONSTRAINTS_PATH = PROJECT_ROOT / "ai_service" / "data" / "disease_constraints.csv"

# Thu tu cot phai khop chinh xac. Doi thu tu la lech du lieu ma khong bao loi.
# Cot 'species' da bo tu v3 (QD-10): chi con mot loai DOG nen cot do khong con thong tin.
EXPECTED_COLUMNS = [
    "disease",
    "age_months_min",
    "age_months_max",
    "age_peak_min",
    "age_peak_max",
    "age_peak_ratio",
    "gender",
    "male_ratio",
    "breed_hint",
    "breed_hint_ratio",
    "duration_days_mean",
    "duration_days_sd",
    "n_samples",
    "verified",
    "note",
]

EXPECTED_SPECIES = "DOG"
VALID_GENDERS = ["ANY", "MALE", "FEMALE"]
VALID_BREED_GROUPS = ["toy", "small", "medium", "large", "giant"]


def load_symptoms_file():
    """Doc symptoms.json - day la nguon su that duy nhat (QD-04)."""
    with open(SYMPTOMS_PATH, encoding="utf-8") as f:
        return json.load(f)


def build_disease_index(symptoms_data):
    """Tra ve dict ma benh -> thong tin can doi chieu."""
    diseases = {}
    for disease in symptoms_data["diseases"]:
        code = disease["code"]
        diseases[code] = {
            # Benh khong ghi 'gender' nghia la khong gioi han gioi tinh
            "gender": disease.get("gender", "ANY"),
        }
    return diseases


def load_constraint_rows():
    """Doc CSV. Tra ve (danh sach ten cot, danh sach dong)."""
    # utf-8-sig de phong file bi them BOM khi mo bang Excel
    with open(CONSTRAINTS_PATH, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        header = reader.fieldnames
        rows = list(reader)
    return header, rows


def parse_number(row, column, errors, allow_float=True):
    """Doc mot o thanh so. Loi thi ghi vao errors va tra ve None de ben goi bo qua."""
    raw = row[column]
    text = raw.strip() if raw is not None else ""
    if text == "":
        errors.append(f"{row['disease']}: cot '{column}' bi bo trong")
        return None

    try:
        if allow_float:
            return float(text)
        return int(text)
    except ValueError:
        errors.append(f"{row['disease']}: cot '{column}' khong phai so hop le ({text!r})")
        return None


def check_species_scope(symptoms_data, errors):
    """File rang buoc nay chi dung cho mot loai. Doi pham vi ma quen sua script la hong."""
    species = symptoms_data.get("species")
    if species != EXPECTED_SPECIES:
        errors.append(
            f"symptoms.json co species='{species}' nhung script nay viet cho '{EXPECTED_SPECIES}'"
        )


def check_header(header, errors):
    if header is None:
        errors.append("File CSV rong, khong doc duoc dong tieu de")
        return

    if header != EXPECTED_COLUMNS:
        errors.append("Dong tieu de khong khop danh sach cot mong doi")
        errors.append(f"  Mong doi: {EXPECTED_COLUMNS}")
        errors.append(f"  Thuc te:  {header}")


def check_disease_codes(rows, diseases_json, errors):
    """Kiem tra du so benh, khong trung, khong thua ma la."""
    seen = []
    for row in rows:
        code = row["disease"].strip()
        if code in seen:
            errors.append(f"{code}: ma benh bi lap lai")
        seen.append(code)

        if code not in diseases_json:
            errors.append(f"{code}: khong co trong symptoms.json")

    for code in diseases_json:
        if code not in seen:
            errors.append(f"{code}: co trong symptoms.json nhung thieu trong CSV")


def check_gender(row, diseases_json, errors):
    code = row["disease"].strip()
    gender = row["gender"].strip()

    if gender not in VALID_GENDERS:
        errors.append(f"{code}: gioi tinh '{gender}' khong hop le")
        return

    if code in diseases_json:
        gender_in_json = diseases_json[code]["gender"]
        if gender != gender_in_json:
            errors.append(
                f"{code}: gioi tinh khong khop symptoms.json "
                f"(CSV: {gender}, JSON: {gender_in_json})"
            )

    male_ratio = parse_number(row, "male_ratio", errors)
    if male_ratio is None:
        return

    if male_ratio < 0.0 or male_ratio > 1.0:
        errors.append(f"{code}: male_ratio phai nam trong 0.0-1.0 (dang la {male_ratio})")

    # Rang buoc cung ve gioi tinh phai keo theo ty le tuong ung, neu khong bo sinh du lieu se mau thuan
    if gender == "FEMALE" and male_ratio != 0.0:
        errors.append(f"{code}: gender=FEMALE thi male_ratio phai la 0.00 (dang la {male_ratio})")
    if gender == "MALE" and male_ratio != 1.0:
        errors.append(f"{code}: gender=MALE thi male_ratio phai la 1.00 (dang la {male_ratio})")


def check_age_range(row, errors):
    code = row["disease"].strip()
    # Tuoi de dang so thuc vi sach hay ghi theo tuan: "6 weeks" = 1.5 thang
    age_min = parse_number(row, "age_months_min", errors)
    age_max = parse_number(row, "age_months_max", errors)
    peak_min = parse_number(row, "age_peak_min", errors)
    peak_max = parse_number(row, "age_peak_max", errors)
    peak_ratio = parse_number(row, "age_peak_ratio", errors)

    if age_min is None or age_max is None or peak_min is None or peak_max is None:
        return

    if age_min < 0:
        errors.append(f"{code}: age_months_min am ({age_min})")

    # Khoang peak phai nam gon trong khoang tuoi tong, va min <= max o ca hai cap
    if age_min > age_max:
        errors.append(f"{code}: age_months_min > age_months_max ({age_min} > {age_max})")
    if peak_min > peak_max:
        errors.append(f"{code}: age_peak_min > age_peak_max ({peak_min} > {peak_max})")
    if peak_min < age_min:
        errors.append(f"{code}: age_peak_min < age_months_min ({peak_min} < {age_min})")
    if peak_max > age_max:
        errors.append(f"{code}: age_peak_max > age_months_max ({peak_max} > {age_max})")

    if peak_ratio is None:
        return
    # Duoi 0.5 thi khoang peak khong con la "khoang tap trung" nua
    if peak_ratio < 0.5 or peak_ratio > 1.0:
        errors.append(f"{code}: age_peak_ratio phai nam trong 0.5-1.0 (dang la {peak_ratio})")

    # Benh khong lech tuoi thi quy uoc: peak phu toan khoang va ratio = 1.00
    peak_covers_all_ages = peak_min == age_min and peak_max == age_max
    if peak_covers_all_ages and peak_ratio != 1.0:
        errors.append(
            f"{code}: peak phu toan khoang tuoi thi age_peak_ratio phai la 1.00 "
            f"(dang la {peak_ratio})"
        )


def check_breed_hint(row, errors):
    code = row["disease"].strip()
    breed_hint = row["breed_hint"].strip()
    breed_ratio = parse_number(row, "breed_hint_ratio", errors)

    if breed_ratio is None:
        return

    if breed_hint == "any":
        # Khong co nhom giong nguy co thi ty le phai la 0, de 0.60 se thanh so treo khong ai doc
        if breed_ratio != 0.0:
            errors.append(
                f"{code}: breed_hint='any' thi breed_hint_ratio phai la 0.00 "
                f"(dang la {breed_ratio})"
            )
        return

    for group in breed_hint.split("|"):
        if group not in VALID_BREED_GROUPS:
            errors.append(f"{code}: nhom giong '{group}' khong hop le")

    if breed_ratio <= 0.0 or breed_ratio > 1.0:
        errors.append(
            f"{code}: co breed_hint thi breed_hint_ratio phai lon hon 0 va toi da 1.0 "
            f"(dang la {breed_ratio})"
        )


def check_duration_and_samples(row, errors):
    code = row["disease"].strip()
    duration_mean = parse_number(row, "duration_days_mean", errors)
    duration_sd = parse_number(row, "duration_days_sd", errors)
    n_samples = parse_number(row, "n_samples", errors, allow_float=False)

    if duration_mean is not None and duration_mean <= 0:
        errors.append(f"{code}: duration_days_mean phai lon hon 0 (dang la {duration_mean})")

    if duration_sd is not None and duration_sd < 0:
        errors.append(f"{code}: duration_days_sd khong duoc am (dang la {duration_sd})")

    if n_samples is not None and n_samples <= 0:
        errors.append(f"{code}: n_samples phai lon hon 0 (dang la {n_samples})")


def check_verified(row, errors):
    """verified=1 chi khi ca dong da doi chieu nguon va ghi vao disease_constraints_source.csv."""
    code = row["disease"].strip()
    value = row["verified"].strip()
    if value not in ("0", "1"):
        errors.append(f"{code}: cot 'verified' phai la 0 hoac 1 (dang la {value!r})")


def print_summary(rows):
    """In tong so mau va phan bo theo muc pho bien, de doi chieu bang o 03-DATA.md."""
    total = 0
    count_by_tier = {}
    verified_count = 0

    for row in rows:
        raw = row["n_samples"].strip()
        if not raw.isdigit():
            continue

        n_samples = int(raw)
        total += n_samples
        count_by_tier[n_samples] = count_by_tier.get(n_samples, 0) + 1

        if row["verified"].strip() == "1":
            verified_count += 1

    print(f"\nTong so mau se sinh: {total}")
    print("Phan bo theo muc pho bien:")
    for n_samples in sorted(count_by_tier, reverse=True):
        benh = count_by_tier[n_samples]
        print(f"  {n_samples} mau/benh  x  {benh} benh  =  {n_samples * benh}")

    print(f"\nDa doi chieu nguon: {verified_count}/{len(rows)} benh")
    if verified_count < len(rows):
        print("  (xem muc 'No ky thuat' trong docs/ai-disease-prediction/PROGRESS.md)")


def main():
    if not SYMPTOMS_PATH.exists():
        print(f"Khong tim thay {SYMPTOMS_PATH}")
        return 1
    if not CONSTRAINTS_PATH.exists():
        print(f"Khong tim thay {CONSTRAINTS_PATH}")
        return 1

    symptoms_data = load_symptoms_file()
    diseases_json = build_disease_index(symptoms_data)
    header, rows = load_constraint_rows()

    errors = []
    check_species_scope(symptoms_data, errors)
    check_header(header, errors)

    # Sai tieu de thi moi kiem tra sau do deu vo nghia, dung lai luon
    if errors:
        print("KHONG DAT - loi cau truc file:")
        for error in errors:
            print(f"  - {error}")
        return 1

    check_disease_codes(rows, diseases_json, errors)
    for row in rows:
        check_gender(row, diseases_json, errors)
        check_age_range(row, errors)
        check_breed_hint(row, errors)
        check_duration_and_samples(row, errors)
        check_verified(row, errors)

    print(f"symptoms.json  : version {symptoms_data['version']}, "
          f"loai {symptoms_data['species']}, {len(diseases_json)} benh")
    print(f"constraints.csv: {len(rows)} dong")

    if errors:
        print(f"\nKHONG DAT - {len(errors)} loi:")
        for error in errors:
            print(f"  - {error}")
        return 1

    print("\nDAT - tat ca kiem tra deu qua.")
    print_summary(rows)
    return 0


if __name__ == "__main__":
    sys.exit(main())
