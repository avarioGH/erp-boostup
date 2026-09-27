# EXCEL AMBIGUOUS ENTITY RECONCILIATION

## MASTER AMBIGUOUS DISTRIBUTION (350 records)

### 1. BKR AMBIGUOUS (200 records)
- **Workbook:** `excel4.xlsx`
- **Sheet:** `HASIL PROD` (Mixed Sawn Timber Output)
- **Entity:** `SawnTimberOutput`
- **Reason:** 'BKR' appears in the Grade/Ket column with no explicit block or header confirming the species is Bengkirai.

### 2. MULTI-TRUCK DO (150 records)
- **Workbook:** `excel3.xlsx`
- **Sheet:** `DATA MUAT`
- **Entity:** `Shipment`
- **Reason:** Visual DO groupings ("PENGIRIMAN CUSTOMER X") span multiple trucks on the same date. The relational mapping to a single DO document number is ambiguous.

**Total Ambiguous:** 200 (SawnTimberOutput) + 150 (Shipment) = **350 Records**.
