# So sanh split 70/30 vs 80/20 — du lieu that (141 dong / 6 benh)

> File nay sinh tu dong `train_split_73.py`. Khong dung du lieu sinh tu y van —
> chi dung 141 dong lam sang that cua `dogfinal3.csv`.

**Ngay chay:** 2026-09-20
**random_state:** 42 (co dinh, chay lai ra dung so cu)
**Khong gian feature:** dung dung 51 cot cua `shared/symptoms.json` (v4), giong het
R1 goc. 20/51 cot luon bang 0 trong du lieu that (khong co nguon trong dogfinal3),
giu nguyen vi day la dung so voi R1_bao_cao_giang_vien.md / r1_metrics.md.

### Split 70/30 (train=98, test=43)

| Model | Accuracy (n=43) | Macro-F1 (n=43) | Accuracy 5-fold CV | Macro-F1 5-fold CV |
|---|---|---|---|---|
| Dummy (san) | 0.186 | 0.052 | 0.177 ± 0.002 | 0.050 ± 0.001 |
| Logistic Regression | 0.953 | 0.952 | 0.893 ± 0.051 | 0.890 ± 0.052 |
| Random Forest | 0.953 | 0.955 | 0.886 ± 0.042 | 0.882 ± 0.045 |

### Split 80/20 (train=112, test=29)

| Model | Accuracy (n=29) | Macro-F1 (n=29) | Accuracy 5-fold CV | Macro-F1 5-fold CV |
|---|---|---|---|---|
| Dummy (san) | 0.172 | 0.049 | 0.177 ± 0.002 | 0.050 ± 0.001 |
| Logistic Regression | 0.931 | 0.935 | 0.893 ± 0.051 | 0.890 ± 0.052 |
| Random Forest | 0.862 | 0.869 | 0.886 ± 0.042 | 0.882 ± 0.045 |


---

## Doc ket qua the nao

- Ca hai split deu chay tren **cung mot bo 141 dong**, chi khac ty le chia. Cot CV
  (5-fold) khong doi giua hai bang vi CV luon dung ca 141 dong bat ke split
  ban dau la gi — dat canh nhau de thay ro **holdout dao dong theo co tap test nho**,
  con CV thi on dinh hon.
- Tap test 70/30 co ~42 dong (~7 dong/lop), tap test 80/20 co ~29 dong (~5 dong/lop).
  Tap test lon hon (70/30) thi moi lan doan sai anh huong it hon toi accuracy —
  con so do do **it nhieu hon**, nhung doi lai tap train chi con ~99 dong thay vi 112,
  nen model co it du lieu hoc hon.
- Day la **danh doi kinh dien** giua do tin cay cua danh gia va luong du lieu de hoc.
  Voi 141 dong, khong co lua chon nao "dung tuyet doi" — bao cao ca hai la cach lam
  minh bach nhat, dung nhu cach R1 goc da bao ca 80/20 lan CV thay vi chi chon mot so.