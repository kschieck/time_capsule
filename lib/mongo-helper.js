var config = require("config");
const { MongoClient, ObjectId } = require('mongodb');

async function connect() {
  const url = config.get("mongo");
  const client = new MongoClient(url);
  const dbName = 'note-to-self';
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection('notes');
  return {
    client,
    collection
  };
}

async function connect_middleware(req, res, next) {
  req.db = await connect();
  next();
}

module.exports = {
  connect: connect,
  connect_middleware: connect_middleware
}