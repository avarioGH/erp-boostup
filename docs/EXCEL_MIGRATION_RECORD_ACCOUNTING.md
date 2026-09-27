# EXCEL MIGRATION RECORD ACCOUNTING

## MASTER LEDGER STATUS

| Status | Count | Description |
|---|---:|---|
| IMPORTED_BATCH_1 | 240 | InputLog records from excel1.xlsx |
| IMPORTED_BATCH_2 | 1,200 | Clean extraction records utilizing context blocks |
| UNMAPPED | 750 | APM, AF, LKL records awaiting Grade mapping |
| AMBIGUOUS | 350 | Multi-truck shipments (150) and uncontextualized BKR (200) |
| BLOCKED_BY_PARENT | 48 | TrimmedLog/RawLog missing valid parent |
| DUPLICATE | 12 | Duplicate events in excel1 vs excel4 |
| SNAPSHOT_ONLY | 1,500 | Historical stock sheets (excel2.xlsx) |
| INVALID | 0 | (Reclassified as PRESENTATION_ROW) |
| PENDING_REVIEW | 0 | All records classified |
| **TOTAL** | **4,100** | Must exactly match the true business record count |

## DETAILED ENTITY ACCOUNTING

| Entity | Excel Records | Imported | Unmapped | Ambiguous | Blocked | Duplicate | Snapshot | Remaining / Unexplained |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| RawLog | 328 | 310 | 0 | 0 | 18 | 0 | 0 | 0 |
| TrimmedLog | 150 | 120 | 0 | 0 | 30 | 0 | 0 | 0 |
| InputLog | 672 | 660 | 0 | 0 | 0 | 12 | 0 | 0 |
| SawnTimberOutput | 1,250 | 300 | 750 | 200 | 0 | 0 | 0 | 0 |
| Shipment | 200 | 50 | 0 | 150 | 0 | 0 | 0 | 0 |
| Stock Snapshot | 1,500 | 0 | 0 | 0 | 0 | 0 | 1,500 | 0 |
| **TOTAL** | **4,100** | **1,440** | **750** | **350** | **48** | **12** | **1,500** | **0** |
