# PRODUCTION MIGRATION MANIFEST

## SCOPE
- **Total Records to Migrate:** 2,390
- **Excluded Records:** 1,710 (1,500 Snapshots, 12 Duplicates, 150 Multi-Truck, 48 Blocked)

## ENTITY BREAKDOWN
| Source Workbook | Entity | Count | Status | Notes |
|---|---|---:|---|---|
| excel2.xlsx | RawLog | 310 | PREFLIGHT_READY | Supplier parsed from context |
| excel2.xlsx | TrimmedLog | 120 | PREFLIGHT_READY | Valid parent IDs |
| excel1.xlsx, excel4.xlsx | InputLog | 660 | PREFLIGHT_READY | 240 (excel1) + 420 (excel4) |
| excel4.xlsx | SawnTimberOutput | 1,250 | PREFLIGHT_READY | APM/AF/LKL in notes |
| excel3.xlsx | Shipment | 50 | PREFLIGHT_READY | Single-truck DO only |
