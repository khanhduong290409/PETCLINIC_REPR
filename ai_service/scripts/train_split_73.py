"""Chay them mot che do split 70/30, de doi chieu voi 80/20 da co (R1 goc).

Chi dung du lieu that (141 dong / 6 benh), KHONG dung du lieu sinh tu y van.
Dung dung load_real_data.py GOC (can shared/symptoms.json) -> 51 cot, khop
100% voi khong gian feature cua R1_bao_cao_giang_vien.md / r1_metrics.md.

Chay: python train_split_73.py
Xuat ra: ../reports/split_comparison_70_30_vs_80_20.md
"""

import sys
from datetime import date
from pathlib import Path

from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split

from load_real_data import load_real_data

sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = Path(__file__).resolve().parent
REPORTS_DIR = SCRIPT_DIR.parent / "reports"
OUT_PATH = REPORTS_DIR / "split_comparison_70_30_vs_80_20.md"

RANDOM_STATE = 42
CV_FOLDS = 5


def build_models():
    return {
        "Dummy (san)": DummyClassifier(strategy="most_frequent"),
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
        "Random Forest": RandomForestClassifier(n_estimators=300, random_state=RANDOM_STATE),
    }


def run_split(X, y, test_size):
    """Chay 1 split holdout + 5-fold CV cho ca 3 model. Tra ve dict ket qua."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, stratify=y, random_state=RANDOM_STATE
    )

    results = {}
    for name, model in build_models().items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)

        cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
        cv_acc = cross_val_score(model, X, y, cv=cv, scoring="accuracy")
        cv_f1 = cross_val_score(model, X, y, cv=cv, scoring="f1_macro")

        results[name] = {
            "accuracy": accuracy,
            "macro_f1": macro_f1,
            "cv_accuracy": cv_acc,
            "cv_macro_f1": cv_f1,
        }

    return {
        "train_size": len(X_train),
        "test_size": len(X_test),
        "results": results,
    }


def build_table(run_result, label):
    n = run_result["test_size"]
    lines = [
        f"### {label} (train={run_result['train_size']}, test={n})",
        "",
        f"| Model | Accuracy (n={n}) | Macro-F1 (n={n}) | Accuracy {CV_FOLDS}-fold CV | Macro-F1 {CV_FOLDS}-fold CV |",
        "|---|---|---|---|---|",
    ]
    for name, r in run_result["results"].items():
        lines.append(
            f"| {name} | {r['accuracy']:.3f} | {r['macro_f1']:.3f} | "
            f"{r['cv_accuracy'].mean():.3f} ± {r['cv_accuracy'].std():.3f} | "
            f"{r['cv_macro_f1'].mean():.3f} ± {r['cv_macro_f1'].std():.3f} |"
        )
    lines.append("")
    return "\n".join(lines)


def main():
    X, y = load_real_data()
    labels = sorted(y.unique())
    print(f"Du lieu: {X.shape[0]} dong x {X.shape[1]} cot, {len(labels)} benh\n")

    run_70_30 = run_split(X, y, test_size=0.3)
    run_80_20 = run_split(X, y, test_size=0.2)

    for name in build_models():
        r70 = run_70_30["results"][name]
        r80 = run_80_20["results"][name]
        print(f"{name}")
        print(f"  70/30 holdout: acc {r70['accuracy']:.3f} | macro-F1 {r70['macro_f1']:.3f}")
        print(f"  80/20 holdout: acc {r80['accuracy']:.3f} | macro-F1 {r80['macro_f1']:.3f}")
        print(f"  CV (khong doi theo split, ca tren 141 dong): "
              f"acc {r70['cv_accuracy'].mean():.3f} | macro-F1 {r70['cv_macro_f1'].mean():.3f}")
        print()

    content = f"""# So sanh split 70/30 vs 80/20 — du lieu that (141 dong / 6 benh)

> File nay sinh tu dong `train_split_73.py`. Khong dung du lieu sinh tu y van —
> chi dung 141 dong lam sang that cua `dogfinal3.csv`.

**Ngay chay:** {date.today().isoformat()}
**random_state:** {RANDOM_STATE} (co dinh, chay lai ra dung so cu)
**Khong gian feature:** dung dung 51 cot cua `shared/symptoms.json` (v4), giong het
R1 goc. 20/51 cot luon bang 0 trong du lieu that (khong co nguon trong dogfinal3),
giu nguyen vi day la dung so voi R1_bao_cao_giang_vien.md / r1_metrics.md.

{build_table(run_70_30, "Split 70/30")}
{build_table(run_80_20, "Split 80/20")}

---

## Doc ket qua the nao

- Ca hai split deu chay tren **cung mot bo 141 dong**, chi khac ty le chia. Cot CV
  ({CV_FOLDS}-fold) khong doi giua hai bang vi CV luon dung ca 141 dong bat ke split
  ban dau la gi — dat canh nhau de thay ro **holdout dao dong theo co tap test nho**,
  con CV thi on dinh hon.
- Tap test 70/30 co ~42 dong (~7 dong/lop), tap test 80/20 co ~29 dong (~5 dong/lop).
  Tap test lon hon (70/30) thi moi lan doan sai anh huong it hon toi accuracy —
  con so do do **it nhieu hon**, nhung doi lai tap train chi con ~99 dong thay vi 112,
  nen model co it du lieu hoc hon.
- Day la **danh doi kinh dien** giua do tin cay cua danh gia va luong du lieu de hoc.
  Voi 141 dong, khong co lua chon nao "dung tuyet doi" — bao cao ca hai la cach lam
  minh bach nhat, dung nhu cach R1 goc da bao ca 80/20 lan CV thay vi chi chon mot so.
"""

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Da ghi {OUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())