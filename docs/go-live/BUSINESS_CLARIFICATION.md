# BUSINESS CLARIFICATION

## Unknown Business Codes (APM, AF, LKL)

> Unknown business codes such as APM, AF, and LKL are not interpreted automatically. They are preserved as free-text Keterangan until business meaning is explicitly confirmed.

> Keterangan is informational metadata and does not define TimberGrade, Category, Product, Species, or inventory identity.

## Keterangan (Notes)

The `notes` field (presented as **Keterangan** in the UI) has been enabled across the following transactional entities to preserve historical context without polluting Master Data:
- RawLog
- TrimmedLog
- InputLog
- SawnTimberOutput
- TimberPurchase / TimberPurchaseItem / TimberPurchaseLogItem
- TimberDeliveryNote
- TimberSalesOrder

This ensures original historical codes are preserved exactly as found in source spreadsheets (e.g., `KET = APM`).
