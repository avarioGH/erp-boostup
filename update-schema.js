const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

if (!schema.includes('driver_name')) {
    schema = schema.replace(
        /status          String \/\/ WAITING, READY, DELIVERED, CANCELLED/,
        `status          String // WAITING, READY, DELIVERED, CANCELLED\n  driver_name     String?\n  vehicle_plate   String?\n  container_number String?`
    );
    fs.writeFileSync('backend/prisma/schema.prisma', schema);
    console.log("Schema updated.");
} else {
    console.log("Schema already updated.");
}
