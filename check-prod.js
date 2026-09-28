const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('erp_db');
    console.log("Database identity:", db.databaseName);
    const collections = await db.listCollections().toArray();
    console.log("Collections found:", collections.map(c => c.name).join(", "));
    
    // Check baseline counts
    const entities = [
      "RawLog", "TrimmedLog", "InputLog", "SawnTimberOutput", "SawnTimberOutputItem", 
      "TimberShipment", "TimberShipmentItem", "TimberPurchase", "TimberPurchaseItem", 
      "TimberPurchaseLogItem", "TimberStock", "TimberStockMovement"
    ];
    for (const ent of entities) {
      try {
        const count = await db.collection(ent).countDocuments();
        console.log(`${ent}: ${count}`);
      } catch(e) {
        console.log(`${ent}: ERROR/MISSING`);
      }
    }
  } catch(e) {
    console.error("Connection failed", e);
  } finally {
    await client.close();
  }
}
run();
