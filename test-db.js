const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("CONNECTION_SUCCESS");
    await client.close();
  } catch(e) {
    console.error("CONNECTION_FAILED", e.message);
  }
}
run();
