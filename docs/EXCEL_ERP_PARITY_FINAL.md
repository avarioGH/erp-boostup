# EXCEL vs ERP PARITY MATRIX

| Excel Process | Excel Field/Concept | ERP Entity | ERP Field/Concept | Status | Evidence | Gap |
|---|---|---|---|---|---|---|
| Supply/Receiving | SUPPLY LOG | RawLog / PurchaseLogItem | TimberPurchaseLogItem | MATCH | excel2.xlsx "form monitoring" | None. Purchase vs Actual is separated natively. |
| Supply/Receiving | JENIS LOG | TimberSpecies | TimberSpecies | MATCH | excel2.xlsx "print tally trm" | None. |
| Supply/Receiving | M3 (GROSS) | RawLog | grossVolumeM3 | MATCH | excel1.xlsx "REKAP LOG MASUK" | None. |
| Trimming | TRIMING LOG | TrimmedLog | TrimmedLog | MATCH | excel2.xlsx "form monitoring" | None. |
| Trimming | Tally Trimming | TrimmedLog | logNumber / dimensions | MATCH | excel2.xlsx "print tally trm" | None. |
| Input | INPUT LOG | InputLog | InputLog | MATCH | excel4.xlsx "INPUT LOG" | None. |
| Input | Ø Rata2 (rt2 dmtr) | InputLog | averageDiameter | MATCH | excel2.xlsx "print tally input log" | None. |
| Production | HASIL PRODUKSI | SawnTimberOutput | SawnTimberOutput | MATCH | excel4.xlsx "BENGKIRAI" | None. |
| Production | GESEK / PLAT / MASAK | ProductionProcess | type | MATCH | excel4.xlsx "REKAP OUTPUT GESEK" | None. |
| Production | Rendement | ProductionProcess | rendement | MATCH | excel1.xlsx "LAP PROD SAWMILL" | None. |
| Production | PARTAI | SawnTimberOutput | batch | MATCH | excel2.xlsx "Monitoring (2)" | None. |
| Grading | HASIL GRADE | SawnTimberOutputItem | TimberVariant.grade | PARTIAL | excel4.xlsx "BELI MASAK" | Exact defect tolerance criteria missing from Excel. ERP supports inline grading via variants. |
| Grading | GRADE A/B/C | TimberGrade | TimberGrade | MATCH | excel1.xlsx "GUDANG" | None. |
| Grading | AF / LKL | TimberGrade | TimberGrade | AMBIGUOUS | excel1.xlsx "GUDANG" | Excel does not define if LKL is a Destination or Grade. |
| Grading | GRADE APM / BKR | TimberGrade | TimberGrade | AMBIGUOUS | excel1.xlsx "Monitoring per kel product" | Excel does not define if APM is an external organization or a grade tier. |
| Fuso / Loading | FUSO 01 / TRUCK | Vehicle / Shipment | Vehicle | PARTIAL | excel3.xlsx "DATA MUAT" | Excel lists multiple trucks per REKAP, but ERP handles 1 DO = 1 Shipment natively. |
| Fuso / Loading | MUAT / DATA MUAT | TimberShipment | TimberShipment | MATCH | excel3.xlsx "DATA MUAT" | Loading date and DO matched. |
| Customer / Dest | CUSTOMER / PROJECT | TimberShipment | customerId | PARTIAL | excel3.xlsx "DATA MUAT" | ERP lacks distinct Project vs Customer distinction natively if required. |
| Stock / Warehouse | STOCK ULIN PER UKURAN | TimberStock | TimberStock | MATCH | excel2.xlsx "STOCK" | None. Dimensions map to variants. |
| Print Documents | print tally trm / input log | ERP Frontend Views | N/A | PARTIAL | excel2.xlsx "print tally trm" | Layouts vary, but business data semantics match. |

### TRUE MISSING
- None mathematically proven unrepresentable.

### PARTIAL
- Grading rules (defect constraints) lack documentation.
- FUSO loading manifest (if multi-truck per DO is required).
- Customer vs Project distinction.

### AMBIGUOUS
- LKL / AF (Local vs Afkir semantics).
- APM / BKR (Organization vs Grade).

### NOT AVAILABLE
- Detailed tolerance matrices for grading.

### LEGACY / NON-REQUIRED
- Spreadsheet summation errors.
