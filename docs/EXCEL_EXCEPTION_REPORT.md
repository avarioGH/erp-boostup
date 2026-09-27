# EXCEL EXCEPTION REPORT

## SKIPPED RECORDS

| Workbook | Sheet | Row | Identifier / Data | Reason | Classification |
|---|---|---|---|---|---|
| excel4.xlsx | MERANTI | 45 | L-1045 / APM | Contains APM grade which is not a mapped TimberGrade. | UNMAPPED |
| excel4.xlsx | BENGKIRAI | 18 | BKR | Grade column contains BKR without contextual proof of species in this row. | AMBIGUOUS |
| excel4.xlsx | MERANTI | 88 | L-1088 / LKL | Contains LKL classification in Grade column. | UNMAPPED |
| excel4.xlsx | MERANTI | 210 | L-1210 / AF | Contains AF classification. | UNMAPPED |
| excel3.xlsx | DATA MUAT | 12 | PENGIRIMAN PAK HERI | Multi-truck DO (L 8355 NA & KH 8916 GO) under single customer DO grouping. | AMBIGUOUS |
| excel2.xlsx | STOCK | 1-4800 | STOCK SNAPSHOT | Pure stock snapshot without historical ledger movement origins. | UNSUPPORTED |
| excel1.xlsx | Input log | 15 | L-1001 | Exists in excel4.xlsx as master. | DUPLICATE |
| excel1.xlsx | Input log | 1-14 | Headers/Titles | Visual header layout ("Laporan Produksi Berdasarkan Mesin"). | INVALID |
| (Various) | (Various) | ~9000+ | Blanks & Totals | Empty rows, visual spacing, or Excel formula summary lines. | INVALID |

*Note: This is a summarized sample of the ~14,010 skipped rows.*
