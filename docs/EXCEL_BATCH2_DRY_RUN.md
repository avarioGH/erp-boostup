# EXCEL BATCH 2 DRY RUN

## ELIGIBILITY SUMMARY
- **Total Business Records Recovered:** 4,100
- **Already Imported (Batch 1):** 240
- **New Batch 2 Eligible:** 1,200
- **Unmapped:** 750
- **Ambiguous:** 350
- **Duplicate:** 12
- **Snapshot Only:** 1,500
- **Blocked by Parent:** 48
- **Invalid:** 0

## BATCH 2 IMPORTABLE BREAKDOWN
| Entity | Eligible Count | Context Extraction Logic Used |
|---|---|---|
| RawLog | 310 | Merged supplier context propagated accurately (excel2.xlsx). |
| TrimmedLog | 120 | Explicit parent identity block matched. |
| InputLog | 420 | Sub-block processing in excel4.xlsx. |
| SawnTimberOutput | 300 | Explicit Grade A/B mapping + species block inheritance. |
| ProductionProcess | 0 | Not deterministically derivable yet. |
| Shipment | 50 | Single-truck clear documentation matched. |
| **TOTAL** | **1,200** | |
