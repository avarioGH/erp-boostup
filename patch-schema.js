const fs = require('fs');
const path = 'backend/prisma/schema.prisma';
let code = fs.readFileSync(path, 'utf8');

// Add default_shift_id to Employee
code = code.replace(
  /bank_name      String\?/,
  'bank_name      String?\n  default_shift_id String? @db.ObjectId'
);

// Add shift relation to Employee
code = code.replace(
  /LeaveRequest   LeaveRequest\[\]/,
  'LeaveRequest   LeaveRequest[]\n  shift          Shift? @relation(fields: [default_shift_id], references: [id], onDelete: NoAction, onUpdate: NoAction)'
);

// Add Shift model at the end
code += `

model Shift {
  id                   String    @id @default(auto()) @map("_id") @db.ObjectId
  company_id           String?   @db.ObjectId
  company              Company?  @relation(fields: [company_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  code                 String
  name                 String
  start_time           String    // e.g. "08:00"
  end_time             String    // e.g. "17:00"
  grace_period_minutes Int       @default(15) // Minutes before marked LATE
  status               String    @default("ACTIVE")
  created_at           DateTime  @default(now())
  updated_at           DateTime  @updatedAt

  employees            Employee[]
  attendances          Attendance[]

  @@unique([company_id, code])
}
`;

// Add new fields to Attendance
code = code.replace(
  /notes       String\?/,
  'notes            String?\n  shift_id         String? @db.ObjectId\n  shift            Shift?  @relation(fields: [shift_id], references: [id], onDelete: NoAction, onUpdate: NoAction)\n  late_minutes     Int     @default(0)\n  overtime_minutes Int     @default(0)'
);

fs.writeFileSync(path, code);
console.log('patched schema');
