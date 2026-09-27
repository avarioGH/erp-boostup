# EXCEL GRADE MAPPING EVIDENCE

## 1. EVIDENCE TABLE

| Grade | Workbook | Sheet | Row | Column | Species | Product | T | W | L | PCS | M3 | Context |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| APM | excel4.xlsx | MERANTI | 45 | KET | MERANTI | Sawn Timber | 2 | 20 | 400 | 50 | 0.8000 | Placed in 'KET' (Keterangan), next to standard A/B grades. Appears to mean 'Afkir Plat Meranti'. |
| APM | excel4.xlsx | MERANTI | 112 | KET | MERANTI | Sawn Timber | 3 | 25 | 400 | 20 | 0.6000 | Grouped with lower-yield outputs. |
| BKR | excel4.xlsx | BENGKIRAI | 18 | JENIS | BENGKIRAI | Sawn Timber | 5 | 10 | 400 | 100 | 2.0000 | Appears in 'JENIS' column instead of 'KET'. Often mixed with A/B. |
| BKR | excel4.xlsx | PLAT BENGKIRAI | 24 | JENIS | BENGKIRAI | Sawn Timber | 2 | 20 | 400 | 150 | 2.4000 | Used as a shorthand for Bengkirai rather than a quality grade. |
| LKL | excel4.xlsx | MERANTI | 88 | KET | MERANTI | Sawn Timber | 4 | 20 | 400 | 75 | 2.4000 | Listed under 'KET'. Usually denotes 'Lokal' (Domestic Market) vs Export. |
| LKL | excel4.xlsx | BENGKIRAI | 42 | KET | BENGKIRAI | Sawn Timber | 3 | 15 | 400 | 30 | 0.5400 | Same pattern. Represents market destination, not physical defect. |
| AF | excel4.xlsx | MERANTI | 210 | KET | MERANTI | Sawn Timber | 2 | 10 | 400 | 40 | 0.3200 | 'AF' (Afkir/Reject). Listed in 'KET'. |

## 2. SEMANTIC ANALYSIS

### APM
- **Behavior:** REJECT_DISPOSITION / PRODUCT_CATEGORY
- **Analysis:** Stands for "Afkir Plat Meranti". It is used when an output fails standard A/B grading and is downgraded to Plat (thin board) Afkir.

### BKR
- **Behavior:** SPECIES_CLASSIFICATION
- **Analysis:** "BKR" is almost universally used as an abbreviation for Bengkirai in the Excel sheets, not as a Grade. Importing this as a Grade would be a structural error.

### LKL
- **Behavior:** MARKET_CLASSIFICATION
- **Analysis:** "Lokal". This is a market destination tag (Export vs Lokal), not a physical quality grade. The actual physical grade might still be A or B.

### AF
- **Behavior:** QUALITY_GRADE / REJECT_DISPOSITION
- **Analysis:** "Afkir". Genuine quality downgrade.
