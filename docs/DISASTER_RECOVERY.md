# Disaster Recovery

## 1. Scope
This document outlines the boundaries and procedures for recovering the ERP infrastructure (Database, Application Files, Codebase) in the event of catastrophic data loss, corruption, or infrastructure failure.

## 2. Production Architecture
- **Backend:** Node.js (NestJS) running via PM2.
- **Frontend:** Next.js.
- **Database:** MongoDB Atlas (Cluster: erp-boostup.qbaqxyw.mongodb.net, Database: erp_db).
- **Storage:** Local block storage mounted to the VPS.

## 3. Database Recovery
**MongoDB Atlas Automated Restore:**
- Recovery must be executed by a designated DBA via the MongoDB Atlas Cloud Console.
- **Action:** Select the erp-boostup cluster > Restore from Backup.
- Target a newly isolated cluster or clearly isolated database (do NOT overwrite erp_db blindly if forensics are needed).
- Update the application .env DATABASE_URL to point to the recovered target and restart PM2.

## 4. PITR Recovery
**Point-in-Time Recovery (PITR):**
- If continuous backup is enabled by the DBA in Atlas, PITR allows restoring to a precise minute before a catastrophic mutation (e.g., accidental ledger deletion).
- Executed via Atlas UI -> Restore -> Point in Time.

## 5. Storage Recovery
**File Uploads:**
- MongoDB does NOT backup application disk storage.
- A secondary mechanism (e.g., S3 Sync, Volume Snapshots, or rsync) must be utilized.
- Procedure: Mount the backup volume, copy files to the STORAGE_BASE_PATH, and ensure read/write permissions for the PM2 process user.

## 6. Application Recovery
1. Spin up a new VPS or isolate the compromised environment.
2. Clone the Git repository and checkout the verified production commit.
3. Install dependencies (
pm install).
4. Restore Storage files.
5. Restore Database.
6. Configure .env with correct endpoints and secrets.
7. Start processes (pm2 start ecosystem.config.js).

## 7. Environment Verification
- Verify database connection on startup.
- Validate storage path permissions.
- Ensure JWT and authentication layers function correctly.

## 8. Post-Restore Validation
- Verify Company and tenant routing.
- Check baseline TimberStock counts against expected recovery point.
- Validate that the ERP UI functions correctly without horizontal errors.

## 9. Rollback Boundary
If the recovery environment fails validation, DO NOT route production DNS/traffic to it. Keep the original degraded environment isolated for forensics while establishing a secondary recovery path.

## 10. RTO
NOT DEFINED — BUSINESS DECISION REQUIRED

## 11. RPO
NOT DEFINED — BUSINESS DECISION REQUIRED

## 12. Incident Ownership
- **Database Layer:** DBA / Atlas Administrator.
- **Application Layer:** Engineering Team.
- **Business Approval:** Business Owner.

## 13. Escalation
1. Notify Engineering Lead.
2. Notify DBA.
3. Notify Business Stakeholders of expected downtime.
