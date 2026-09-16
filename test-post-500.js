const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im93bmVyIiwic3ViIjoiNmE5ODcxMTQ3NzBlMGE1NDg4Mzc3MGIzIiwicm9sZSI6Ik93bmVyIiwiY29tcGFueV9pZCI6IjZhOTg3MTE0NzcwZTBhNTQ4ODM3NzBiMSIsImlhdCI6MTc4OTI1NjQ4MiwiZXhwIjoxNzg5MzQyODgyfQ.6sr5upnwPWj3Ok8EV4Ixoolqzh-LBkR4XFIgBgK8NF4';
async function testPost500() {
  const payload = {
    logNumber: "9999-TEST-" + Date.now(),
    species: "Ulin Lokal",
    batch: "batch 1",
    locationId: "6a9c217755becdfee38cfe5f",
    originalLength: 11,
    diameter1: 39,
    diameter2: 43,
    diameter3: 25,
    diameter4: 32,
    gerowong: null,
    trimmingLength: 1.50
  };

  const r = await fetch('https://api.erp.boostup.id/inventory/logs', {
    method: 'POST',
    headers: {
      'Authorization': \Bearer \\,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  console.log('Status:', r.status);
  const data = await r.text();
  console.log('Response:', data);
}
testPost500();
