const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const uri = "mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('erp_db');
    const collections = await db.listCollections().toArray();
    
    const backupDir = path.join(__dirname, 'production_backup_' + Date.now());
    fs.mkdirSync(backupDir);
    
    let totalDocs = 0;
    for (const c of collections) {
      if (c.name.startsWith('system.')) continue;
      const docs = await db.collection(c.name).find({}).toArray();
      fs.writeFileSync(path.join(backupDir, c.name + '.json'), JSON.stringify(docs, null, 2));
      totalDocs += docs.length;
    }
    console.log("BACKUP_SUCCESS");
    console.log("Location:", backupDir);
    console.log("Total Documents Backed Up:", totalDocs);
  } catch(e) {
    console.error("Backup failed", e);
  } finally {
    await client.close();
  }
}
run();
