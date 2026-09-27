# ERP Operations Runbook

## 1. Architecture
- **Backend:** NestJS on Node.js.
- **Frontend:** NextJS (React).
- **Database:** MongoDB Atlas (DB names: erp_db and uat_erp).
- **ORM:** Prisma Client.
- **Process Manager:** PM2 (Cluster Mode).
- **Hosting:** VPS (Ubuntu/Windows).

## 2. Production Environment
- **Database:** erp_db
- **PM2 Process:** vario-erp-api (backend)
- **Node Environment:** NODE_ENV=production

## 3. UAT Environment
- **Database:** uat_erp
- **Node Environment:** UAT specific configurations.

## 4. Starting Services
Backend:
\cd backend && pm2 start ecosystem.config.js\
Frontend:
\cd frontend && npm run start\

## 5. Checking PM2
List all processes:
\pm2 ls\
Monitor resources (CPU/Mem):
\pm2 monit\

## 6. Checking Backend Health
Check the baseline API endpoint:
\curl -I http://localhost:3000/api\ (assuming default port if not overridden).
Expect HTTP 200/404 depending on index route, but valid response.

## 7. Checking Database Connectivity
Observe backend logs for Prisma Client connection errors upon startup.
\pm2 logs avario-erp-api --lines 50\

## 8. Checking Application Logs
\pm2 logs avario-erp-api\
For historical logs, check ~/.pm2/logs/.

## 9. Restarting Backend
\pm2 restart avario-erp-api\
To gracefully reload without downtime (cluster mode):
\pm2 reload avario-erp-api\

## 10. Restarting Frontend
Restart the frontend NextJS daemon/service depending on how it is bound (e.g., pm2 restart frontend-app or systemctl).

## 11. Deployment Procedure
1. Pull latest verified commit: \git pull origin main\
2. Install Backend Dependencies: \cd backend && npm install\
3. Generate Prisma: \
px prisma generate\
4. Build Backend: \
pm run build\
5. Install Frontend Dependencies: \cd ../frontend && npm install\
6. Build Frontend: \
pm run build\
7. Reload Backend: \pm2 reload avario-erp-api\
8. Reload Frontend: Restart frontend process.

## 12. Post-Deployment Verification
- Run Health Check (Section 6).
- Run Post-Deployment Checklist (docs/GO_LIVE_CHECKLIST.md).
- Ensure no Prisma validation errors in logs.

## 13. Rollback Procedure
**Application rollback does NOT automatically rollback database changes.**
1. Revert to previous working commit: \git checkout <PREVIOUS_COMMIT_SHA>\
2. Re-install and re-build backend and frontend.
3. Reload PM2 processes.
4. Verify health.

## 14. Database Recovery
**MongoDB Database Rollback/Restore:**
- Target database procedure must be executed via MongoDB Atlas console.
- **Application rollback cannot revert MongoDB writes natively.**
- Data correction must follow application workflow or manual DBA scripts.

## 15. Backup Verification
- Backup Configuration: **NOT PROVEN** (Requires MongoDB Atlas Administrative Access).
- Atlas administrators must manually verify continuous PITR, retention policies, and snapshot frequency in the Atlas UI.

## 16. Storage Verification
Ensure STORAGE_BASE_PATH points to the correct persistent volume mapped distinctly for production and UAT.

## 17. Incident Response
**Backend / DB Unavailable:**
1. Check PM2 logs (\pm2 logs avario-erp-api\).
2. Verify VPS outbound network connectivity to MongoDB Atlas.

**Stock / Ledger Incidents (Mismatch/Negative/Duplicates):**
1. **STOP** further mutations.
2. Identify affected company, warehouse, variant, and exact batch.
3. Inspect TimberStockMovement versus TimberStock.
4. Preserve evidence (take read-only snapshot).
5. Determine controlled correction path (No manual database edits).

## 18. External Integration Failure
(e.g., Shopee, AI, Storage)
- Temporarily disable the integration in settings if it causes cascading 500 errors.
- Refer to PM2 logs for exact timeout/auth failure signatures.

## 19. Security Incident
- If JWT secret compromised, rotate JWT_SECRET in .env and pm2 reload avario-erp-api (invalidates all sessions).
- If Database compromised, trigger Atlas IP Whitelist lockdown.

## 20. Escalation Procedure
Escalate infrastructure/Atlas issues to DBA.
Escalate logic/stock issues to Engineering.

## 21. Go-Live Checklist
Refer to \docs/GO_LIVE_CHECKLIST.md\.
