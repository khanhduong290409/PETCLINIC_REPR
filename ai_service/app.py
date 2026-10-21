"""FastAPI micro-service chẩn đoán bệnh thú y — 8 loài, 44 bệnh (QĐ-16).

Train Random Forest khi khởi động trên toàn bộ dữ liệu cleaned_animal (351 dòng),
đúng cấu hình đã đánh giá ở scripts/train_cleaned_animal.py (RF 300 cây,
random_state=42). Hiệu năng được báo cáo bằng 3-fold CV trong reports/ca_metrics.md,
nên ở đây không giữ lại tập test.

Đọc dữ liệu và dựng feature dùng chung module scripts/load_cleaned_animal.py với
script đánh giá — hai nơi lệch nhau một cột là model đoán sai mà không báo lỗi.

Service chỉ được Spring Boot gọi (AiController), nên không cấu hình CORS.

Chạy: uvicorn app:app --port 8001 --reload
Hoặc: python -m uvicorn app:app --port 8001
"""

import statistics
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestClassifier

# Module đọc dữ liệu nằm trong scripts/ để script đánh giá import trực tiếp được
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "scripts"))

from load_cleaned_animal import (  # noqa: E402
    NUMERIC_FIELDS,
    build_feature_columns,
    load_records,
    load_symptoms_json,
    records_to_matrix,
)

RANDOM_STATE = 42

# Tên tiếng Việt của các ô số, dùng trong thông báo "đã tự điền"
NUMERIC_FIELD_VI = {
    "age": "tuổi",
    "weight": "cân nặng",
    "temperature": "nhiệt độ",
    "heart_rate": "nhịp tim",
    "duration_days": "số ngày bệnh",
}

# ─── Trạng thái toàn cục, dựng một lần lúc khởi động ─────────────────────────
_model: Optional[RandomForestClassifier] = None
_feature_columns: list[str] = []
_symptoms_data: dict = {}
_disease_species: dict[str, str] = {}   # mã bệnh -> mã loài
_species_profiles: dict[str, dict] = {}  # mã loài -> thống kê lấy từ dữ liệu train


def _count_values(values: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    return counts


def _build_species_profiles(records: list[dict]) -> dict[str, dict]:
    """Thống kê theo loài: triệu chứng, giống, giới tính, trung vị các ô số, danh sách bệnh.

    Dùng để (1) điền giá trị thiếu khi dự đoán và (2) trả về cho frontend,
    chỉ hiện những triệu chứng/giống thực sự có trong dữ liệu train của loài đó.
    """
    records_by_species: dict[str, list[dict]] = {}
    for record in records:
        species = record["species"]
        if species not in records_by_species:
            records_by_species[species] = []
        records_by_species[species].append(record)

    profiles = {}
    for species, species_records in records_by_species.items():
        symptom_codes = set()
        breeds = []
        genders = []
        diseases = set()
        numeric_values: dict[str, list[float]] = {}
        for field in NUMERIC_FIELDS:
            numeric_values[field] = []

        for record in species_records:
            symptom_codes.update(record["symptoms"])
            breeds.append(record["breed"])
            genders.append(record["gender"])
            diseases.add(record["disease"])
            for field in NUMERIC_FIELDS:
                numeric_values[field].append(record[field])

        medians = {}
        for field in NUMERIC_FIELDS:
            medians[field] = float(statistics.median(numeric_values[field]))

        profiles[species] = {
            "symptom_codes": symptom_codes,
            "breed_counts": _count_values(breeds),
            "gender_counts": _count_values(genders),
            "medians": medians,
            "diseases": sorted(diseases),
        }
    return profiles


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model, _feature_columns, _symptoms_data, _disease_species, _species_profiles
    print("[AI] Đọc dữ liệu và train model...")
    _symptoms_data = load_symptoms_json()

    records = load_records()
    _feature_columns = build_feature_columns(records)
    X = records_to_matrix(records, _feature_columns)

    labels = []
    for record in records:
        labels.append(record["disease"])
        _disease_species[record["disease"]] = record["species"]

    _species_profiles = _build_species_profiles(records)

    model = RandomForestClassifier(n_estimators=300, random_state=RANDOM_STATE)
    model.fit(X, labels)
    _model = model
    print(f"[AI] Train xong: {len(records)} dòng, {len(model.classes_)} bệnh, {len(_feature_columns)} cột feature")
    yield


# ─── FastAPI app ─────────────────────────────────────────────────────────────
app = FastAPI(title="PawCare AI — Chẩn đoán bệnh thú y", version="2.0.0", lifespan=lifespan)


# ─── Schemas ─────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    species: str                                 # VD: "DOG"
    symptom_codes: list[str]                     # VD: ["vomiting", "fever"]
    breed: Optional[str] = None                  # Không nhập -> lấy trung bình theo các giống của loài
    gender: Optional[str] = None                 # "MALE" / "FEMALE"; không nhập -> lấy trung bình hai giới
    # Không nhập -> điền trung vị của loài. Giới hạn rộng chỉ để chặn số vô lý
    age: Optional[float] = Field(default=None, ge=0, le=60)
    weight: Optional[float] = Field(default=None, gt=0, le=2000)
    temperature: Optional[float] = Field(default=None, ge=30, le=45)
    heart_rate: Optional[float] = Field(default=None, ge=10, le=400)
    duration_days: Optional[float] = Field(default=None, ge=0, le=365)


class DiseaseResult(BaseModel):
    disease_code: str
    disease_vi: str
    probability: float
    severity: str


class PredictResponse(BaseModel):
    species: str
    top_disease: str
    top_disease_vi: str
    confidence: float
    severity: str
    top3: list[DiseaseResult]
    imputed_fields: list[str]   # tên tiếng Việt các ô đã tự điền vì người dùng bỏ trống
    supported: bool
    message: str


# ─── Dự đoán ─────────────────────────────────────────────────────────────────
def _find_disease_info(code: str) -> dict:
    for disease in _symptoms_data["diseases"]:
        if disease["code"] == code:
            return disease
    return {"code": code, "vi": code, "severity": "NORMAL"}


def _build_candidates(req: PredictRequest, profile: dict) -> tuple[list[dict], list[float], list[str]]:
    """Dựng các bản ghi để đưa vào model, kèm trọng số và danh sách ô đã tự điền.

    Ô số thiếu -> trung vị của loài. Giống / giới tính thiếu thì không đoán bừa một giá trị
    (model chưa từng thấy dòng không có giống), mà tạo một bản ghi cho MỖI giống / giới tính
    của loài, trọng số theo tần suất trong dữ liệu train. Xác suất cuối là trung bình có trọng số.
    """
    imputed_fields = []

    numeric_values = {}
    for field in NUMERIC_FIELDS:
        value = getattr(req, field)
        if value is None:
            numeric_values[field] = profile["medians"][field]
            imputed_fields.append(NUMERIC_FIELD_VI[field])
        else:
            numeric_values[field] = value

    breed_counts = profile["breed_counts"]
    if req.breed is not None and req.breed in breed_counts:
        breed_options = {req.breed: 1}
    else:
        breed_options = breed_counts
        imputed_fields.append("giống")

    gender_counts = profile["gender_counts"]
    if req.gender is not None and req.gender.upper() in gender_counts:
        gender_options = {req.gender.upper(): 1}
    else:
        gender_options = gender_counts
        imputed_fields.append("giới tính")

    candidates = []
    weights = []
    for breed, breed_weight in breed_options.items():
        for gender, gender_weight in gender_options.items():
            record = {
                "species": req.species,
                "breed": breed,
                "gender": gender,
                "symptoms": set(req.symptom_codes),
            }
            record.update(numeric_values)
            candidates.append(record)
            weights.append(breed_weight * gender_weight)
    return candidates, weights, imputed_fields


@app.get("/health")
def health():
    class_count = 0
    if _model is not None:
        class_count = len(_model.classes_)
    return {"status": "ok", "model_loaded": _model is not None, "class_count": class_count}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if _model is None:
        raise HTTPException(status_code=503, detail="Model chưa sẵn sàng")

    profile = _species_profiles.get(req.species)
    if profile is None:
        raise HTTPException(status_code=400, detail="Loài không được hỗ trợ")
    if len(req.symptom_codes) == 0:
        raise HTTPException(status_code=400, detail="Chọn ít nhất một triệu chứng")

    candidates, weights, imputed_fields = _build_candidates(req, profile)
    X = records_to_matrix(candidates, _feature_columns)
    candidate_probabilities = _model.predict_proba(X)
    probabilities = np.average(candidate_probabilities, axis=0, weights=weights)

    # Species mask: chỉ giữ bệnh của đúng loài, rồi chuẩn hóa lại cho tổng = 1
    species_scores = []
    for index, disease in enumerate(_model.classes_):
        if _disease_species[disease] == req.species:
            species_scores.append((float(probabilities[index]), disease))

    total = 0.0
    for score, _ in species_scores:
        total += score

    species_scores.sort(reverse=True)
    top3 = []
    for score, code in species_scores[:3]:
        probability = 0.0
        if total > 0:
            probability = score / total
        info = _find_disease_info(code)
        top3.append(DiseaseResult(
            disease_code=code,
            disease_vi=info["vi"],
            probability=round(probability, 4),
            severity=info["severity"],
        ))

    top = top3[0]
    return PredictResponse(
        species=req.species,
        top_disease=top.disease_code,
        top_disease_vi=top.disease_vi,
        confidence=top.probability,
        severity=top.severity,
        top3=top3,
        imputed_fields=imputed_fields,
        supported=True,
        message="",
    )


@app.get("/symptoms")
def get_symptoms():
    """Dữ liệu cho trang chẩn đoán: loài, triệu chứng, giống, giá trị mặc định, thông tin bệnh.

    Mỗi loài chỉ trả những triệu chứng / giống có trong dữ liệu train của loài đó —
    chọn triệu chứng model chưa từng thấy ở loài đó cũng không đổi kết quả.
    """
    species_list = []
    for species in _symptoms_data["species"]:
        profile = _species_profiles.get(species["code"])
        if profile is None:
            continue

        # Giữ thứ tự của symptoms.json để giao diện ổn định
        symptom_codes = []
        for symptom in _symptoms_data["symptoms"]:
            if symptom["code"] in profile["symptom_codes"]:
                symptom_codes.append(symptom["code"])

        species_list.append({
            "code": species["code"],
            "vi": species["vi"],
            "symptomCodes": symptom_codes,
            "breeds": sorted(profile["breed_counts"]),
            "diseaseCodes": profile["diseases"],
            "defaults": profile["medians"],
        })

    # Chỉ trả triệu chứng và nhóm có loài nào đó dùng tới
    used_symptom_codes = set()
    for profile in _species_profiles.values():
        used_symptom_codes.update(profile["symptom_codes"])

    symptoms = []
    used_group_codes = set()
    for symptom in _symptoms_data["symptoms"]:
        if symptom["code"] in used_symptom_codes:
            symptoms.append(symptom)
            used_group_codes.add(symptom["group"])

    symptom_groups = []
    for group in _symptoms_data["symptomGroups"]:
        if group["code"] in used_group_codes:
            symptom_groups.append(group)

    diseases = []
    for disease in _symptoms_data["diseases"]:
        if disease["code"] in _disease_species:
            diseases.append({
                "code": disease["code"],
                "vi": disease["vi"],
                "species": _disease_species[disease["code"]],
                "severity": disease["severity"],
                "description": disease.get("description", ""),
                "advice": disease.get("advice", []),
            })

    return {
        "species": species_list,
        "symptomGroups": symptom_groups,
        "symptoms": symptoms,
        "diseases": diseases,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)
