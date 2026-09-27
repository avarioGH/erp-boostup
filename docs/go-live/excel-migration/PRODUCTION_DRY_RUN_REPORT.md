# PRODUCTION DRY RUN REPORT

## DRY RUN EXECUTION
- **Run #1:** 2,390 planned inserts.
- **Run #2 (Idempotency):** 0 planned inserts (All 2,390 skipped due to EXCEL_IMPORT reference).

## CONFLICT ANALYSIS
| Entity | Planned Insert | Existing | Conflict | Final |
|---|---:|---:|---:|---:|
| RawLog | 310 | 0 | 0 | 310 |
| TrimmedLog | 120 | 0 | 0 | 120 |
| InputLog | 660 | 0 | 0 | 660 |
| SawnTimberOutput | 1,250 | 0 | 0 | 1,250 |
| Shipment | 50 | 0 | 0 | 50 |

## SOURCE DISTRIBUTION
| Source | Count |
|---|---:|
| Approved Import | 2,390 |
| Duplicate | 12 |
| Snapshot | 1,500 |
| Exception | 198 |
| **TOTAL** | **4,100** |
