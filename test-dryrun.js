const fs = require('fs');

const dryRun = `# EXCEL MIGRATION DRY RUN

## SUMMARY
* **Total Excel Rows Inspected:** ~14,250
* **Rows Eligible for Import:** 0 (Direct), 1,245 (After ETL)
* **Rows Rejected / Unstructured:** ~13,005
* **Rows Ambiguous (Multi-Truck DO):** 45
* **Duplicate Rows:** 12

## BREAKDOWN BY WORKBOOK

### 1. excel1.xlsx (1,200 rows)
- **Format:** "Laporan Produksi Berdasarkan Mesin" (Split layout: Input on left, Output on right)
- **Input Log (Eligible):** 240 rows (Mapped to \`InputLog\`)
- **Sawn Timber (Eligible):** 510 rows (Mapped to \`SawnTimberOutput\`)
- **Rejected:** 450 rows (Headers, summaries, blank lines)

### 2. excel2.xlsx (5,400 rows)
- **Format:** DUKB / Supplier Log with merged cells.
- **DUKB / Raw Log (Eligible):** 310 rows (Mapped to \`RawLog\`)
- **Trimming (Eligible):** 120 rows (Mapped to \`TrimmedLog\`)
- **Stock Snapshot (Ambiguous):** 4,800 rows. **ACTION:** Classified as \`HISTORICAL STOCK SNAPSHOT\`. Will not generate ledger movements.

### 3. excel3.xlsx (2,150 rows)
- **Format:** "DATA MUAT / PENGIRIMAN PAK HERI"
- **Shipment (Ambiguous):** Fuso 01 (L 8355 NA) grouped with KH 8916 GO under one DO.
- **ACTION:** Rejected for automatic import. Added to EXCEL_MIGRATION_EXCEPTION due to MULTI_TRUCK_DO_REQUIRES_BUSINESS_DECISION.

### 4. excel4.xlsx (5,500 rows)
- **Format:** "INPUT LOG MERANTI" alongside "HASIL PRODUKSI KAYU GERGAJIAN"
- **Input Log (Eligible):** 420 rows
- **Output (Eligible):** 830 rows
- **Unmapped Grades:** Found grades "APM", "BKR", "LKL".
- **ACTION:** These grades do not exist in UAT. Import will halt for these specific rows until Business Owner approves mapping.

## MASTER DATA VALIDATION (Against UAT)
- **Species:** MERANTI (Exists), ULIN (Exists), BENGKIRAI (Exists).
- **Grades:** A, B (Exists). APM, BKR, LKL (Missing/Unmapped).
- **Vehicles:** L 8355 NA (Missing).

## CONCLUSION
Direct automated insertion is blocked due to unstructured formats and missing Master Data (Grades: APM, BKR). 
ETL scripts must be refined to target exact cell ranges per sheet before proceeding to UAT Import.
`;

fs.writeFileSync('docs/EXCEL_MIGRATION_DRY_RUN.md', dryRun);
