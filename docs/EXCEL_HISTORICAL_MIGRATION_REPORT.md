# EXCEL HISTORICAL MIGRATION REPORT

## 1. Source Workbooks
- excel1.xlsx (Production Report)
- excel2.xlsx (DUKB / Receiving / Trimming)
- excel3.xlsx (Shipment / Loading)
- excel4.xlsx (Input / Output / Purchase)

## 2. Sheets Inspected
- 30+ sheets across 4 workbooks.

## 3. Total Rows
- ~14,250 rows inspected.

## 4. Rows Imported (UAT)
- **0** (Dry Run failed validation constraints).

## 5. Rows Skipped
- ~13,005 rows (Headers, summaries, blank separators).

## 6. Rows Ambiguous
- 4,800 Stock snapshot rows (Reconciliation impossible without ledger history).
- 45 Shipment rows (Multi-truck DO detected).

## 7. Rows Rejected
- ~1,250 rows rejected due to missing Master Data in UAT (Unmapped Grades).

## 8. Master Data Created
- 0 (Phase rules strictly forbid inventing master data).

## 9. Master Data Reused
- Species: MERANTI, ULIN, BENGKIRAI.

## 10-14. Transactional Imports
- Raw Logs: 0
- Trimmed Logs: 0
- Input Logs: 0
- Production Outputs: 0
- Shipments: 0

## 15. Historical Snapshots
- Captured "STOCK" from excel2.xlsx as a Read-Only Snapshot. No `TimberStockMovement` was generated.

## 16. Unmapped Grades
- Found: **APM, BKR, LKL, AF**. 
- Status: Blocked. Pending business decision.

## 17. Unmapped Species
- None detected.

## 18. Unmapped Sources
- Supplier names highly inconsistent (e.g., "AWIE", "NL (AWIE)", "PT. GEMA LESTARI").

## 19. Duplicate Handling
- 12 rows identified as potential duplicates across excel1 and excel4 (Overlapping dates for Sawmill 1).

## 20. Reconciliation
- UAT Reconciliation: N/A (Import blocked).

## 21. UAT Result
- **FAILED**. Data requires structural normalization and explicit Master Data decisions for Grades & Vehicles before physical DB insertion.

## 22. Production Mutation
- **0 records mutated.** Safety protocol maintained.
