const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im93bmVyIiwic3ViIjoiNmE5ODcxMTQ3NzBlMGE1NDg4Mzc3MGIzIiwicm9sZSI6Ik93bmVyIiwiY29tcGFueV9pZCI6IjZhOTg3MTE0NzcwZTBhNTQ4ODM3NzBiMSIsImlhdCI6MTc4OTI1NjQ4MiwiZXhwIjoxNzg5MzQyODgyfQ.6sr5upnwPWj3Ok8EV4Ixoolqzh-LBkR4XFIgBgK8NF4';
async function testGet() {
  const r = await fetch('https://api.erp.boostup.id/inventory/logs', {
    headers: { 'Authorization': \Bearer \\ }
  });
  console.log(await r.json());
}
testGet();
