import { MongoClient } from 'mongodb';

class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';

        const url = `mongodb://${host}:${port}`;
        this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

        this.client.connect((err) => {
            if (err) {
                console.error('Failed to connect to MongoDB:', err);
                this.isConnected = false;
            } else {
                this.db = this.client.db(database);
                console.log('Connected to MongoDB');
                this.isConnected = true;
            }
        });
    }

    isAlive() {
        return this.isConnected;
    }

    async nbUsers() {
        try {
            const usersCollection = this.db.collection('users');
            return await usersCollection.countDocuments();
        } catch (err) {
            console.error('Error counting users:', err);
            return 0;
        }
    }

    async nbFiles() {
        try {
            const filesCollection = this.db.collection('files');
            return await filesCollection.countDocuments();
        } catch (err) {
            console.error('Error counting files:', err);
            return 0;
        }
    }
}

const dbClient = new DBClient();
export default dbClient;
