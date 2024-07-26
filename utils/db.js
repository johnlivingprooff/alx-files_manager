import { MongoClient } from 'mongodb';

class DBClient {
  constructor () {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.mongoClient = new MongoClient(url, { useUnifiedTopology: true });
    this.mongoClient.connect((err) => {
      if (!err) this.db = this.mongoClient.db(database);
    });
  }

  isAlive () {
    return this.mongoClient.isConnected();
  }

  async nbUsers() {
    const usersCollection = this.db.collection('users');
    const numUsers = await usersCollection.countDocuments();
    return numUsers;
  }

  async nbFiles() {
    const filesCollection = this.db.collection('files');
    const numFiles = await filesCollection.countDocuments();
    return numFiles;
  }

  async close() {
    await this.mongoClient.close();
  }
}

const dbClient = new DBClient();
export default dbClient;
