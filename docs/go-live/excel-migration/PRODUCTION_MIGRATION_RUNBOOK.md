# PRODUCTION MIGRATION RUNBOOK

## PREREQUISITES
1. Business explicitly signs off on PREFLIGHT.
2. Tenant strictly set to 'Boostup Kayu'.
3. Production DB string verified (erp_db).

## EXECUTION ORDER
1. Validate Master Data (Species, Variants).
2. Insert RawLog (Supplier contextualized).
3. Insert TrimmedLog (Dependent on RawLog).
4. Insert InputLog (Dependent on RawLog/TrimmedLog).
5. Insert SawnTimberOutput (Dependent on Variants).
6. Insert Shipment (Dependent on Stock).

## POST-MIGRATION
1. Run numeric reconciliation.
2. Verify TimberStock == Aggregate of Movements.
3. Validate no negative stock alerts.
