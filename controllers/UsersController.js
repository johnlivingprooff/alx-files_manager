import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';
import { Queue } from 'bull';

const userQueue = new Queue('userQueue');

class UsersController {
  static async postNew (req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const usersCollection = dbClient.db.collection('users');
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPassword = sha1(password);
    const newUser = {
      email,
      password: hashedPassword
    };

    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId.toString();

    // Add job to queue for sending a "Welcome email"
    userQueue.add({ userId });

    return res.status(201).json({
      id: userId,
      email: newUser.email
    });
  }

  static async getMe (req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ id: user._id, email: user.email });
  }
}

export default UsersController;
