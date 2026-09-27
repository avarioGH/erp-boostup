# GO-LIVE CHECKLIST

## Environment
- [x] Database identity verified (erp_db / uat_erp split)
- [x] Production company verified
- [x] UAT company absent from production
- [x] Storage paths properly isolated

## Security
- [x] JWT_SECRET securely injected
- [x] UAT JWT distinct from production
- [x] Tenant isolation intact across logic paths

## Database
- [x] Schema parity synced
- [x] No startup exceptions in MongoDB connection
- [x] No database errors in recent logs

## Backup
- [ ] Backup status checked (**NOT PROVEN** - requires Atlas UI access)
- [ ] Continuous Backup / PITR active (**NOT PROVEN**)
- [ ] Retention policy set (**NOT PROVEN**)

## Restore
- [ ] Restore procedure documented
- [ ] Restore test performed (**NOT PROVEN**)

## Deployment
- [x] Rollback commit identified (Git intact)
- [x] PM2 online
- [x] Backend health OK
- [x] Frontend accessible

## Rollback
- [x] Application rollback procedure documented
- [ ] Database rollback capability confirmed (**NOT PROVEN**)

## Monitoring
- [x] PM2 Logs accessible
- [ ] External Observability / Alerting configured (**NOT PROVEN**)

## ERP Functional Verification
- [ ] Login works (**PENDING**)
- [ ] Permissions work (**PENDING**)

## Inventory Integrity
- [x] Stock/ledger baseline checked (Prod is clean)
- [x] Negative stock checked (0 negative stock)

## External Integrations
- [ ] Shopee/AI/Payment configured and verified (**NOT PROVEN**)

## Incident Response
- [x] Runbook procedures documented for stock mismatch / downtime

## Business Sign-Off
- [ ] Master data verified by business owner
- [ ] Workflow (Purchase, Receive, Production, Ship) approved
- [ ] Reports and printed documents signed off
