# EXCEL MIGRATION DECISION MATRIX

| Dataset / Blocker | Classification | Action |
|---|---|---|
| Grades: A, B | IMPORTABLE_NOW | Map to existing TimberGrade. |
| Grade: BKR | IMPORTABLE_AFTER_MAPPING | Map to Species = Bengkirai, NOT Grade. |
| Grade: LKL | REPORT_ONLY / AMBIGUOUS | Do not import as TimberGrade. Add as 'Market' or Note. |
| Grade: AF, APM | IMPORTABLE_AFTER_MAPPING | Map to a new 'Afkir' TimberGrade if Business Owner approves. |
| Multi-Truck Shipments | AMBIGUOUS | Group as EXCEL_MIGRATION_EXCEPTION. Do not force into single-truck DO. |
| 12 Duplicate Rows (Excel 1 vs 4) | DUPLICATE_SOURCE | Skip Excel 1 rows; import from Excel 4 master sheet. |
| STOCK Snapshot | REPORT_ONLY | Preserve separately. Do not generate fake ledger. |
