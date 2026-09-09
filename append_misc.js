const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
if (!code.includes('model Attachment {')) {
  code += \

model Attachment {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id   String   @db.ObjectId
  company      Company  @relation(fields: [company_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  entity_type  String // 'CUSTOMER', 'SUPPLIER', 'INVOICE', etc.
  entity_id    String
  
  file_name    String
  file_url     String
  file_size    Int
  content_type String
  
  uploaded_by  String   @db.ObjectId
  uploader     User     @relation("UserAttachments", fields: [uploaded_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
  
  @@index([company_id, entity_type, entity_id])
}

model DocumentSequence {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id   String   @db.ObjectId
  company      Company  @relation(fields: [company_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  document_type String // 'INVOICE', 'PO', 'SO'
  prefix       String
  next_number  Int      @default(1)
  
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
  
  @@unique([company_id, document_type])
}

model Notification {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id   String   @db.ObjectId
  company      Company  @relation(fields: [company_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  user_id      String   @db.ObjectId
  user         User     @relation("UserNotifications", fields: [user_id], references: [id], onDelete: Cascade)
  
  title        String
  message      String
  type         String // 'INFO', 'WARNING', 'ERROR', 'SUCCESS'
  link         String?
  
  is_read      Boolean  @default(false)
  
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
  
  @@index([company_id, user_id, is_read])
}
\;

  // Fix User relation for UserAttachments and UserNotifications
  code = code.replace(
    'requested_approvals ApprovalRequest[] @relation("RequestedApprovals")',
    'requested_approvals ApprovalRequest[] @relation("RequestedApprovals")\\n  attachments Attachment[] @relation("UserAttachments")\\n  notifications Notification[] @relation("UserNotifications")'
  );
  fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
}
