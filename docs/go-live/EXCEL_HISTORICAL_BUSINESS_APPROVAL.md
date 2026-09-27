# EXCEL HISTORICAL BUSINESS APPROVAL PACKAGE

## 1. APM Meaning
**Evidence:** `excel4.xlsx`, Sheet `MERANTI`, Row 45. Product: Sawn Timber 2x20x400. KET column: "APM".
**Question:** Should "APM" (Afkir Plat Meranti) be represented in the ERP as:
A. TimberGrade (Standard quality grade)
B. Product/Category classification
C. Notes/historical classification only
D. Separate business classification (Reject Disposition)
E. Unknown

## 2. AF Meaning
**Evidence:** `excel4.xlsx`, Sheet `MERANTI`, Row 210. KET column: "AF".
**Question:** Should "AF" (Afkir) be represented as:
A. TimberGrade
B. Reject/Afkir disposition
C. Product/Category classification
D. Notes/historical classification only
E. Unknown

## 3. LKL Meaning
**Evidence:** `excel4.xlsx`, Sheet `MERANTI`, Row 88. KET column: "LKL".
**Question:** Should "LKL" (Lokal) be represented as:
A. TimberGrade
B. Local-market classification
C. Destination/sales classification
D. Product/Category classification
E. Notes/historical classification
F. Unknown

## 4. BKR Without Context
**Evidence:** 200 records in `excel4.xlsx`, Sheet `HASIL PROD` have "BKR" in the grade column, but no explicit header confirms the species is Bengkirai.
**Question:** Should these 200 records be permanently skipped (Historical Exception), or do you want to manually review them to confirm their species?

## 5. Multi-Truck DO
**Evidence:** `excel3.xlsx`, Sheet `DATA MUAT`, Row 12. "PENGIRIMAN PAK HERI" shows two trucks (L 8355 NA & KH 8916 GO) grouped under one date and customer.
**Question:** Does your business truly operate with 1 DO document covering multiple trucks, or is this just an Excel reporting shortcut? If 1 DO covers multiple trucks, we need to upgrade the ERP Shipment model.

## 6. Parent-Blocked Records
**Evidence:** 48 records lack source parent logs in Excel. 
**Decision:** We will classify these as PERMANENT_HISTORICAL_EXCEPTION and not import them.

## 7. Reporting Requirement
**Question:** Do these 1,148 unresolved historical records need to appear in current ERP production reporting, or is it acceptable to keep them archived as Historical Exceptions so you can Go-Live with clean data immediately?
