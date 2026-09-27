# EXCEL DUPLICATE INVESTIGATION

## 1. EVIDENCE TABLE

| Log Number | Date | excel1.xlsx (Row/Sheet) | excel4.xlsx (Row/Sheet) | Dims | Gross | Net | Status |
|---|---|---|---|---|---|---|---|
| L-1001 | 01/10/2025 | 15 (Input log) | 22 (INPUT LOG) | 40x40x400 | 0.64 | 0.60 | IDENTICAL |
| L-1002 | 01/10/2025 | 16 (Input log) | 23 (INPUT LOG) | 35x35x400 | 0.49 | 0.45 | IDENTICAL |
| ... | ... | ... | ... | ... | ... | ... | ... |

## 2. ANALYSIS
The 12 rows from `01/10/2025` appear in both `excel1.xlsx` (which groups data by "Mesin Sawmill 1") and `excel4.xlsx` (which serves as a master compilation for Meranti input logs). 

**Conclusion:** 
SAME BUSINESS EVENT REPORTED TWICE. 
These are not two different logs. `excel1.xlsx` is a machine-specific slice of the master data in `excel4.xlsx`.
