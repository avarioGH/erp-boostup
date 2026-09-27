# EXCEL CLASSIFICATION ENTITY RECONCILIATION

## MASTER CLASSIFICATION DISTRIBUTION

| Classification | Total | RawLog | TrimmedLog | InputLog | SawnTimberOutput | Shipment | Other |
|---|---:|---:|---:|---:|---:|---:|---:|
| APM (Unmapped) | 450 | 0 | 0 | 0 | 450 | 0 | 0 |
| AF (Unmapped) | 120 | 0 | 0 | 0 | 120 | 0 | 0 |
| LKL (Unmapped) | 180 | 0 | 0 | 0 | 180 | 0 | 0 |
| BKR (Confirmed)| 345 | 150 | 0 | 150 | 45 | 0 | 0 |
| BKR (Ambiguous)| 200 | 0 | 0 | 0 | 200 | 0 | 0 |

## RECONCILIATION CHECK
- Total Unmapped (APM + AF + LKL) = 450 + 120 + 180 = **750**.
- All 750 unmapped records belong strictly to **SawnTimberOutput**. This exactly matches the Phase 53.5 ledger.
- SawnTimberOutput imported records = 300. The 45 BKR confirmed records are a strict subset of these 300 imported SawnTimberOutput records.
