# So sanh: co tang cuong du lieu (augmentation) vs khong — tren split 80/20

> File nay sinh tu `train_augmented.py`. Tang cuong du lieu o day **khong dung y
> van hay bat ky nguon ngoai nao** — chi sinh ban sao co nhieu tu chinh 112 dong
> train that, xem chi tiet phuong phap ben duoi.

**Ngay chay:** 2026-09-20
**random_state:** 42
**Split:** 80/20 stratified — 112 dong train / 29 dong test
(giong het split cua R1 goc, cung mot `random_state`)

## Phuong phap tang cuong

- Nguon: chi 112 dong **train** that (khong dung 29 dong test, khong dung du lieu ngoai).
- Voi moi dong that, sinh **3 ban sao**: moi cot trieu chung
  nhi phan (51 cot) co xac suat **5%** bi dao gia tri (0<->1).
  Nhan benh giu nguyen.
- Tong du lieu tang cuong sau khi loc trung: 335 dong (da loc bo
  1 dong tinh co trung khop voi tap test — voi 51 cot nhi phan va
  nhieu ca benh trieu chung giong nhau, lat-bit ngau nhien thinh thoang tao ra dong
  trung, phai loc de so sanh cong bang). Tap train sau tang cuong:
  112 that + 335 sinh = **447 dong**.
- Kiem tra lai sau khi loc: **0 dong tang cuong trung voi tap test**
  (dung 0 la dung).

**Gia dinh ky thuat, khong phai su that lam sang:** flip xac suat nho khong lam
doi nhan benh la mot gia dinh hop ly nhung **chua duoc kiem chung** — day khac voi
du lieu sinh tu y van (co nguon trich dan), nen phai coi day la mot ky thuat tang
cuong don gian, khong phai them "kien thuc" moi vao model.

## Ket qua

| Model | Accuracy - baseline | Macro-F1 - baseline | Accuracy - augmented | Macro-F1 - augmented | Chenh accuracy |
|---|---|---|---|---|---|
| Dummy (san) | 0.172 | 0.049 | 0.172 | 0.049 | +0.000 |
| Logistic Regression | 0.931 | 0.935 | 0.931 | 0.933 | +0.000 |
| Random Forest | 0.862 | 0.869 | 0.828 | 0.825 | -0.034 |

## Chi tiet per-class — Random Forest

**Random Forest — baseline (khong tang cuong)**

| Benh | Precision | Recall | F1 |
|---|---|---|---|
| `ckd_dog` | 1.00 | 1.00 | 1.00 |
| `distemper` | 0.80 | 0.80 | 0.80 |
| `kennel_cough` | 0.83 | 1.00 | 0.91 |
| `leptospirosis` | 1.00 | 0.80 | 0.89 |
| `parvo` | 0.67 | 0.80 | 0.73 |
| `rabies` | 1.00 | 0.80 | 0.89 |


**Random Forest — augmented (co tang cuong)**

| Benh | Precision | Recall | F1 |
|---|---|---|---|
| `ckd_dog` | 0.67 | 1.00 | 0.80 |
| `distemper` | 0.80 | 0.80 | 0.80 |
| `kennel_cough` | 0.83 | 1.00 | 0.91 |
| `leptospirosis` | 1.00 | 0.60 | 0.75 |
| `parvo` | 0.80 | 0.80 | 0.80 |
| `rabies` | 1.00 | 0.80 | 0.89 |


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