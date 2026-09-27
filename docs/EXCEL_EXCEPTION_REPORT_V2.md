# EXCEL EXCEPTION REPORT V2

## RECLASSIFICATION RULES
- APM, LKL, AF → UNMAPPED (Business data valid, ERP mapping unknown).
- BKR without context → AMBIGUOUS.
- Multi-truck DO → AMBIGUOUS.
- Stock Sheets → SNAPSHOT_ONLY (Not an error, preserved separately).
- Headers/Blanks → PRESENTATION_ROW (Removed from business denominator).

## CURRENT EXCEPTIONS

| Record Type | Business Identifier | Status | Reason |
|---|---|---|---|
| SawnTimberOutput | L-1045 (Meranti) | UNMAPPED | Raw classification 'APM' pending business decision. |
| SawnTimberOutput | L-1088 (Meranti) | UNMAPPED | Raw classification 'LKL' (Lokal) pending mapping. |
| SawnTimberOutput | L-1210 (Meranti) | UNMAPPED | Raw classification 'AF' (Afkir) pending mapping. |
| SawnTimberOutput | Unidentified BKR | AMBIGUOUS | Contains BKR but structural context does not confirm species. |
| Shipment | PENGIRIMAN PAK HERI | AMBIGUOUS | Multi-truck DO (L 8355 NA & KH 8916 GO) grouping. |
| TrimmedLog | Trim-X12 | BLOCKED_BY_PARENT | RawLog parent was Unmapped/Ambiguous. |
