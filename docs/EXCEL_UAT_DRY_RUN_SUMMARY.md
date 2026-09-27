# EXCEL UAT DRY-RUN SUMMARY

## ROW BREAKDOWN
- **Total Excel rows:** 14,250
- **Eligible rows (Perfectly tabular, no assumptions):** 240 (excel1.xlsx Input Logs)
- **Rows to import:** 240
- **Rows skipped:** 14,010
- **Rows ambiguous:** 4,845 (Stock Snapshots, Multi-Truck, Unproven BKR)
- **Rows duplicate:** 12
- **Rows invalid:** 9,153 (Headers, blank lines, summary totals, unmapped APM/LKL/AF)
- **Rows unsupported:** 0

## BREAKDOWN PER WORKBOOK
- **excel1.xlsx:** 240 Eligible, 12 Duplicate, 948 Invalid.
- **excel2.xlsx:** 0 Eligible (All raw logs require visual header assumption for supplier), 4,800 Ambiguous, 600 Invalid.
- **excel3.xlsx:** 0 Eligible (Multi-truck grouping), 45 Ambiguous, 2105 Invalid.
- **excel4.xlsx:** 0 Eligible (Grade ambiguity mixed in standard columns), 1500 Ambiguous/Unmapped, 4000 Invalid.

## CONCLUSION
Only 240 tabular rows from `excel1.xlsx` meet the strict "Zero Assumptions" criteria.
