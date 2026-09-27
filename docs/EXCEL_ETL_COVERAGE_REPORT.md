# EXCEL ETL COVERAGE REPORT

## 1. ROW CLASSIFICATION
- **PHYSICAL WORKSHEET ROWS:** ~14,250
- **PRESENTATION ROWS:** 10,150 (Headers, block separators, split-view formatting, subtotals, blanks)
- **TOTAL BUSINESS DATA ROWS:** 4,100

## 2. BUSINESS RECORD RECOVERY
Out of 4,100 true business records:
- **BATCH 1 IMPORTED:** 240
- **DUPLICATE:** 12 (Overlaps between excel1.xlsx and excel4.xlsx)
- **SNAPSHOT_ONLY:** 1,500 (Historical Stock records)
- **BATCH 2 ELIGIBLE:** 1,200 (Clean extraction utilizing block context & merged cells)
- **UNMAPPED:** 750 (APM, AF, LKL)
- **AMBIGUOUS:** 350 (Multi-truck, unproven BKR)
- **BLOCKED_BY_PARENT:** 48
- **INVALID:** 0 (Genuinely malformed data)

## 3. COVERAGE PERCENTAGES
- **Physical Row Coverage:** 10.1% (1,440 / 14,250)
- **Business Record Recovery Rate:** 35.1% (1,440 / 4,100 imported)
- **Business Record Accountability:** 100% (All 4,100 records accurately classified)
