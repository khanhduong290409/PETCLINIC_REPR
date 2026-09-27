"""So sanh: train tren 112 dong that (baseline) vs train tren 112 dong that + du
lieu tang cuong (augmented), cung test tren 29 dong that con lai (split 80/20).

QUAN TRONG - du lieu tang cuong o day KHONG lay tu y van. Cach lam:
  1. Chon ngau nhien 1 dong TRONG TAP TRAIN (112 dong that).
  2. Sao chep dong do, giu nguyen nhan benh.
  3. Voi moi trong 51 cot trieu chung nhi phan (dung khong gian feature cua symptoms.json, giong R1 goc), lat bit (0<->1) voi xac suat nho
     (NOISE_FLIP_PROB) - mo phong sai so ghi chep / bien thien tu nhien giua cac ca
     benh giong nhau, KHONG bia ra moi lien he trieu chung-benh moi.
  4. Lap lai de tao ra AUGMENT_COPIES_PER_ROW ban sao nhieu cho moi dong that.

Tap test 29 dong khong bi dung toi o buoc nao - augment chi lay nguyen lieu tu
112 dong train, nen so sanh baseline vs augmented la cong bang (khong ro ri).

Chay: python train_augmented.py
Xuat ra: ../reports/augmentation_comparison.md
"""

import sys
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split

from load_real_data import load_real_data

sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = Path(__file__).resolve().parent
REPORTS_DIR = SCRIPT_DIR.parent / "reports"
OUT_PATH = REPORTS_DIR / "augmentation_comparison.md"

RANDOM_STATE = 42
TEST_SIZE = 0.2
NOISE_FLIP_PROB = 0.05      # xac suat lat moi bit trieu chung
AUGMENT_COPIES_PER_ROW = 3  # moi dong that sinh them 3 ban sao co nhieu


def build_models():
    return {
        "Dummy (san)": DummyClassifier(strategy="most_frequent"),
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
        "Random Forest": RandomForestClassifier(n_estimators=300, random_state=RANDOM_STATE),
    }


def augment_bit_flip(X_train, y_train, copies_per_row, flip_prob, rng):
    """Sinh ban sao co nhieu tu CHINH tap train, khong dung nguon ngoai nao.

    Voi moi dong that, sinh `copies_per_row` ban sao: moi cot nhi phan co xac suat
    `flip_prob` bi dao gia tri. Nhan benh giu nguyen - gia dinh o day la mot vai
    trieu chung sai lech nho do ghi chep khong lam doi chan doan, day la gia dinh
    hop ly voi nhieu thap (flip_prob nho) nhung KHONG duoc kiem chung bang du lieu
    thuc te nao khac - phai neu ro day la gia dinh ky thuat, khong phai su that
    lam sang.
    """
    X_values = X_train.to_numpy()
    n_rows, n_cols = X_values.shape

    synthetic_rows = []
    synthetic_labels = []

    y_values = y_train.to_numpy()

    for row_index in range(n_rows):
        base_row = X_values[row_index]
        label = y_values[row_index]
        for _ in range(copies_per_row):
            flip_mask = rng.random(n_cols) < flip_prob
            new_row = base_row.copy()
            new_row[flip_mask] = 1 - new_row[flip_mask]
            synthetic_rows.append(new_row)
            synthetic_labels.append(label)

    X_synthetic = pd.DataFrame(synthetic_rows, columns=X_train.columns)
    y_synthetic = pd.Series(synthetic_labels, name=y_train.name)
    return X_synthetic, y_synthetic


def check_synthetic_leak_into_test(X_synthetic, y_synthetic, X_test, y_test):
    """Kiem tra xem co ban sao tang cuong nao vo tinh trung khop voi mot dong test
    khong (rat khong the vi test khong tham gia sinh du lieu, nhung van do de chac)."""
    test_keys = set()
    for index in X_test.index:
        key = (tuple(X_test.loc[index]), y_test[index])
        test_keys.add(key)

    leaked = 0
    for i in range(len(X_synthetic)):
        key = (tuple(X_synthetic.iloc[i]), y_synthetic.iloc[i])
        if key in test_keys:
            leaked += 1
    return leaked


def evaluate(model, X_train, y_train, X_test, y_test):
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
    return accuracy, macro_f1, y_pred


def build_comparison_table(baseline_results, augmented_results):
    lines = [
        "| Model | Accuracy - baseline | Macro-F1 - baseline | "
        "Accuracy - augmented | Macro-F1 - augmented | Chenh accuracy |",
        "|---|---|---|---|---|---|",
    ]
    for name in baseline_results:
        b = baseline_results[name]
        a = augmented_results[name]
        delta = a["accuracy"] - b["accuracy"]
        sign = "+" if delta >= 0 else ""
        lines.append(
            f"| {name} | {b['accuracy']:.3f} | {b['macro_f1']:.3f} | "
            f"{a['accuracy']:.3f} | {a['macro_f1']:.3f} | {sign}{delta:.3f} |"
        )
    return "\n".join(lines)


def build_per_class_table(y_test, y_pred, labels, title):
    report = classification_report(
        y_test, y_pred, labels=labels, output_dict=True, zero_division=0
    )
    lines = [f"**{title}**", "", "| Benh | Precision | Recall | F1 |", "|---|---|---|---|"]
    for label in labels:
        s = report[label]
        lines.append(f"| `{label}` | {s['precision']:.2f} | {s['recall']:.2f} | {s['f1-score']:.2f} |")
    lines.append("")
    return "\n".join(lines)


def main():
    X, y = load_real_data()
    labels = sorted(y.unique())

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, stratify=y, random_state=RANDOM_STATE
    )
    print(f"Train {len(X_train)} dong that / Test {len(X_test)} dong that (khong doi trong ca 2 che do)\n")

    rng = np.random.default_rng(RANDOM_STATE)
    X_synthetic, y_synthetic = augment_bit_flip(
        X_train, y_train, AUGMENT_COPIES_PER_ROW, NOISE_FLIP_PROB, rng
    )
    leaked_before = check_synthetic_leak_into_test(X_synthetic, y_synthetic, X_test, y_test)
    print(f"Sinh {len(X_synthetic)} dong tang cuong tu {len(X_train)} dong that "
          f"(x{AUGMENT_COPIES_PER_ROW}, flip_prob={NOISE_FLIP_PROB})")
    print(f"Dong tang cuong trung voi tap test (truoc khi loc): {leaked_before}")

    # Voi 51 cot nhi phan va nhieu ca benh trieu chung giong nhau, lat-bit ngau nhien
    # thinh thoang tinh co tao ra dong trung voi mot dong o tap test. Phai loc bo
    # NHUNG dong nay truoc khi train, neu khong so sanh augmented vs baseline se
    # khong con cong bang (model "nhin thay truoc" mot phan tap test).
    test_keys = set()
    for index in X_test.index:
        test_keys.add((tuple(X_test.loc[index]), y_test[index]))

    keep_mask = []
    for i in range(len(X_synthetic)):
        key = (tuple(X_synthetic.iloc[i]), y_synthetic.iloc[i])
        keep_mask.append(key not in test_keys)
    X_synthetic = X_synthetic[keep_mask].reset_index(drop=True)
    y_synthetic = y_synthetic[keep_mask].reset_index(drop=True)

    leaked_after = check_synthetic_leak_into_test(X_synthetic, y_synthetic, X_test, y_test)
    print(f"Da loc bo {leaked_before} dong trung -> con {len(X_synthetic)} dong tang cuong")
    print(f"Kiem tra lai sau khi loc: {leaked_after} (phai la 0)\n")

    X_train_augmented = pd.concat([X_train, X_synthetic], ignore_index=True)
    y_train_augmented = pd.concat([y_train, y_synthetic], ignore_index=True)

    baseline_results = {}
    augmented_results = {}
    baseline_preds = {}
    augmented_preds = {}

    for name, _ in build_models().items():
        models = build_models()
        model_baseline = models[name]
        acc_b, f1_b, pred_b = evaluate(model_baseline, X_train, y_train, X_test, y_test)
        baseline_results[name] = {"accuracy": acc_b, "macro_f1": f1_b}
        baseline_preds[name] = pred_b

        models2 = build_models()
        model_aug = models2[name]
        acc_a, f1_a, pred_a = evaluate(model_aug, X_train_augmented, y_train_augmented, X_test, y_test)
        augmented_results[name] = {"accuracy": acc_a, "macro_f1": f1_a}
        augmented_preds[name] = pred_a

        print(f"{name}")
        print(f"  baseline  (train={len(X_train)})              : acc {acc_b:.3f} | macro-F1 {f1_b:.3f}")
        print(f"  augmented (train={len(X_train_augmented)})              : acc {acc_a:.3f} | macro-F1 {f1_a:.3f}")
        print()

    main_model_name = "Random Forest"
    content = f"""# So sanh: co tang cuong du lieu (augmentation) vs khong — tren split 80/20

> File nay sinh tu `train_augmented.py`. Tang cuong du lieu o day **khong dung y
> van hay bat ky nguon ngoai nao** — chi sinh ban sao co nhieu tu chinh 112 dong
> train that, xem chi tiet phuong phap ben duoi.

**Ngay chay:** {date.today().isoformat()}
**random_state:** {RANDOM_STATE}
**Split:** 80/20 stratified — {len(X_train)} dong train / {len(X_test)} dong test
(giong het split cua R1 goc, cung mot `random_state`)

## Phuong phap tang cuong

- Nguon: chi 112 dong **train** that (khong dung 29 dong test, khong dung du lieu ngoai).
- Voi moi dong that, sinh **{AUGMENT_COPIES_PER_ROW} ban sao**: moi cot trieu chung
  nhi phan (51 cot) co xac suat **{NOISE_FLIP_PROB:.0%}** bi dao gia tri (0<->1).
  Nhan benh giu nguyen.
- Tong du lieu tang cuong sau khi loc trung: {len(X_synthetic)} dong (da loc bo
  {leaked_before} dong tinh co trung khop voi tap test — voi 51 cot nhi phan va
  nhieu ca benh trieu chung giong nhau, lat-bit ngau nhien thinh thoang tao ra dong
  trung, phai loc de so sanh cong bang). Tap train sau tang cuong:
  {len(X_train)} that + {len(X_synthetic)} sinh = **{len(X_train_augmented)} dong**.
- Kiem tra lai sau khi loc: **{leaked_after} dong tang cuong trung voi tap test**
  (dung 0 la dung).

**Gia dinh ky thuat, khong phai su that lam sang:** flip xac suat nho khong lam
doi nhan benh la mot gia dinh hop ly nhung **chua duoc kiem chung** — day khac voi
du lieu sinh tu y van (co nguon trich dan), nen phai coi day la mot ky thuat tang
cuong don gian, khong phai them "kien thuc" moi vao model.

## Ket qua

{build_comparison_table(baseline_results, augmented_results)}

## Chi tiet per-class — {main_model_name}

{build_per_class_table(y_test, baseline_preds[main_model_name], labels, f"{main_model_name} — baseline (khong tang cuong)")}

{build_per_class_table(y_test, augmented_preds[main_model_name], labels, f"{main_model_name} — augmented (co tang cuong)")}

---

## Doc ket qua the nao

- Ca hai che do dung **chung mot tap test 29 dong that**, chi khac du lieu train —
  so sanh nay la cong bang.
- Voi tap da can bang san (21-25 ca/lop) va so dong that con qua nho (112), tang
  cuong kieu lat-bit **kho co the tao them thong tin moi thuc su** — no chu yeu
  giup model on dinh hon (giam phuong sai) chu khong day accuracy len ro ret.
  Neu ket qua augmented cao hon han baseline tren tap test 29 dong, kha nang cao
  la nhieu cua tap test nho, khong phai augmentation "hieu qua" — nen doi chieu
  voi CV o cac ban khac truoc khi ket luan.
- Day KHONG phai thay the cho R2/R3 (dung ma tran xac suat tu y van) da neu trong
  ke hoach ban dau — nhanh do da bi loai theo yeu cau moi (khong dung du lieu y van).
  Augmentation kieu nay chi lam giau them chinh 112 dong da co, khong dua thong tin
  moi tu ben ngoai vao.
"""

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Da ghi {OUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())