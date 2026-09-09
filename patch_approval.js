const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Add requested_by to ApprovalRequest safely
if (!code.includes('requested_by String?')) {
  code = code.replace(
    /model ApprovalRequest \{[\s\S]*?created_at DateTime @default\(now\)\(\)/,
    (match) => match.replace("created_at DateTime @default(now())", "requested_by String? @db.ObjectId\\n  requester User? @relation(\"RequestedApprovals\", fields: [requested_by], references: [id], onDelete: NoAction, onUpdate: NoAction)\\n\\n  created_at DateTime @default(now())")
  );
}

// Add the reverse relation to User
if (!code.includes('requested_approvals ApprovalRequest[] @relation("RequestedApprovals")')) {
  code = code.replace(
    /pending_approvals ApprovalRequest\[\] @relation\("PendingApprovals"\)/,
    "pending_approvals ApprovalRequest[] @relation(\"PendingApprovals\")\\n  requested_approvals ApprovalRequest[] @relation(\"RequestedApprovals\")"
  );
}

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
