const fs = require('fs');
const path = 'backend/prisma/schema.prisma';
let code = fs.readFileSync(path, 'utf8');

// Revert AssetAssignment
code = code.replace(
  /model AssetAssignment \{[\s\S]*?notes            String\?\n  shift_id         String\? @db\.ObjectId\n  shift            Shift\?  @relation\(fields: \[shift_id\], references: \[id\], onDelete: NoAction, onUpdate: NoAction\)\n  late_minutes     Int     @default\(0\)\n  overtime_minutes Int     @default\(0\)\n\}/,
  `model AssetAssignment {
  id       String      @id @default(auto()) @map("_id") @db.ObjectId
  asset_id String      @db.ObjectId
  asset    AssetMaster @relation(fields: [asset_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  user_id  String      @db.ObjectId
  user     User        @relation("AssignedAssets", fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)

  assigned_at DateTime  @default(now())
  returned_at DateTime?
  status      String // ACTIVE, RETURNED
  notes       String?
}`
);

// Add to Attendance
code = code.replace(
  /model Attendance \{[\s\S]*?notes       String\?\n\n  created_at DateTime @default\(now\(\)\)\n  updated_at DateTime @updatedAt\n\n  leave_requests LeaveRequest\[\]\n\}/,
  `model Attendance {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  company_id  String?   @db.ObjectId
  employee_id String    @db.ObjectId
  employee    Employee  @relation(fields: [employee_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  date        DateTime
  status      String // PRESENT, ABSENT, LEAVE, SICK, LATE
  check_in    DateTime?
  check_out   DateTime?
  notes       String?
  
  shift_id         String? @db.ObjectId
  shift            Shift?  @relation(fields: [shift_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  late_minutes     Int     @default(0)
  overtime_minutes Int     @default(0)

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  leave_requests LeaveRequest[]
}`
);

fs.writeFileSync(path, code);
console.log('fixed schema.prisma');
