import dbClient from "./db";

class Files {
    static async createFile(data) {
        const filesCollection = dbClient.getCollection('files');
        const result = await filesCollection.insertOne(data);
        return result.insertedId;
    }

    static async getFile(q) {
        const filesCollection = dbClient.getCollection('files');
        const file = await filesCollection.find(q).toArray();
        return file;
    }

    static async getPage(q, offset, limit) {
        const filesCollection = dbClient.getCollection('files');
        const files = await filesCollection.find(q).skip(offset).limit(limit).toArray();
        return files;
    }

    static async updateFile(q, data) {
        const filesCollection = dbClient.getCollection('files');
        await filesCollection.updateOne(q, data);
    }

    static async findOne(q) {
        const filesCollection = dbClient.getCollection('files');
        const file = await filesCollection.findOne(q);
        return file;
    }
}

export default Files;
