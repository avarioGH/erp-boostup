# PHASE 53.2 — EXCEL HISTORICAL MIGRATION PLAN

## MAPPING STRATEGY

### excel1.xlsx
| Sheet | Row Type | ERP Entity | Fields mapped | Confidence | Import Behavior |
|---|---|---|---|---|---|
| Input log | Input Log | InputLog | log number, length, D1-D4, gross, gerowong, net | MATCH | UAT IMPORT |
| Output Sawn timber | Sawn Timber Output | SawnTimberOutput | species, dims, pcs, M3 | MATCH | UAT IMPORT |
| Sheet1 | Unknown | N/A | - | NOT IMPORTABLE | SKIP |

### excel2.xlsx
| Sheet | Row Type | ERP Entity | Fields mapped | Confidence | Import Behavior |
|---|---|---|---|---|---|
| DUKB / Supply Log | Actual Receiving | RawLog | log number, species, L, D1-D4, gross | MATCH | UAT IMPORT |
| Trimming log | Trimming | TrimmedLog | parent log, trim dimensions, net | MATCH | UAT IMPORT |
| Input Log | Input Log | InputLog | log number, input net | MATCH | UAT IMPORT |
| STOCK | Stock Snapshot | N/A | stock balance | AMBIGUOUS | REPORT-ONLY (Snapshot) |
| Monitoring, print tally... | Report | N/A | - | NOT IMPORTABLE | SKIP |

### excel3.xlsx
| Sheet | Row Type | ERP Entity | Fields mapped | Confidence | Import Behavior |
|---|---|---|---|---|---|
| DATA MUAT | Shipment | TimberShipment | truck plate, product, pcs | AMBIGUOUS (Multi-Truck) | EXCEPTION |
| REKAP MUAT | Report | N/A | - | NOT IMPORTABLE | SKIP |

### excel4.xlsx
| Sheet | Row Type | ERP Entity | Fields mapped | Confidence | Import Behavior |
|---|---|---|---|---|---|
| INPUT LOG | Input Log | InputLog | log number, input dims | MATCH | UAT IMPORT |
| MERANTI, BENGKIRAI | Sawn Timber Output | SawnTimberOutput | dims, pcs, grade | MATCH | UAT IMPORT |
| BELI MASAK | Purchase Declaration | TimberPurchase | dims, pcs, supplier | MATCH | UAT IMPORT |
| PLAT BENGKIRAI | Production Process | ProductionProcess | dims, pcs, waste | PARTIAL | REPORT-ONLY |

## IMPORT RULES
1. **Master Data**: Resolve Species (Meranti, Bengkirai), Grades, Suppliers from UAT first.
2. **Duplicate Protection**: Use EXCEL_IMPORT:<workbook>:<sheet>:<row> in notes.
3. **Gerowong Formula**: Input Net M3 = Gross M3 - Gerowong M3.
