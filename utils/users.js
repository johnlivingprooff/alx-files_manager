import dbClient from './db';

class Users {
    static async createUser(email, password) {
        const usersCollection = dbClient.getCollection('users');
        const user = { email, password };
        const result = await usersCollection.insertOne(user);
        return result.insrtedId;
    }

    static async getUser(q) {
        const usersCollection = dbClient.getCollection('users');
        const user = await usersCollection.find(q).toArray();
        return user;
    }

    static async findOne(q) {
        const usersCollection = dbClient.getCollection('users');
        const user = await usersCollection.findOne(q);
        return user;
    }
}

export default Users;
