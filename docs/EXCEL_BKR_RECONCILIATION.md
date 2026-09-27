# EXCEL BKR RECONCILIATION

## BKR COUNT RECONCILIATION
- BKR Confirmed Context = 345
- BKR Ambiguous = 200
- **Total BKR Occurrences = 545**

## BKR CONFIRMED DISTRIBUTION (345 records)
The 345 confirmed records were successfully mapped to Species: BENGKIRAI based on context (e.g., sheet headers) and imported into UAT across multiple entities:

| Workbook | Sheet | Rows | Entity | Raw Value | Context | Mapped Species | ERP IDs (Sample) | Batch |
|---|---|---|---|---|---|---|---|---|
| excel4.xlsx | BENGKIRAI | 1-150 | InputLog | BKR | Inherited from 'BENGKIRAI' block header | BENGKIRAI | IL-BKR-001..150 | Batch 2 |
| excel2.xlsx | DUKB | 50-199 | RawLog | BKR | 'BENGKIRAI' explicitly declared in supplier declaration | BENGKIRAI | RL-BKR-001..150 | Batch 2 |
| excel4.xlsx | PLAT BENGKIRAI| 1-45 | SawnTimberOutput | BKR | Inherited from 'PLAT BENGKIRAI' sheet | BENGKIRAI | STO-BKR-001..045 | Batch 2 |

**Subtotal Confirmed:** 150 (InputLog) + 150 (RawLog) + 45 (SawnTimberOutput) = **345 Records**

## BKR AMBIGUOUS DISTRIBUTION (200 records)
These records lack explicit context to safely map BKR to Bengkirai without guessing.

| Workbook | Sheet | Rows | Entity | Raw Value | Context | Mapped Species | Status | Batch |
|---|---|---|---|---|---|---|---|---|
| excel4.xlsx | HASIL PROD | 500-699 | SawnTimberOutput | BKR | Mixed randomly in 'Grade' column without header context | UNKNOWN | AMBIGUOUS | N/A |

**Subtotal Ambiguous:** 200 (SawnTimberOutput) = **200 Records**
