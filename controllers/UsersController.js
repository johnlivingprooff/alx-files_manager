import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

class UsersController {
    static async postNew(req, res) {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Missing email' });
        }

        if (!password) {
            return res.status(400).json({ error: 'Missing password' });
        }

        const usersCollection = dbClient.db.collection('users');
        const userExists = await usersCollection.findOne({ email });

        if (userExists) {
            return res.status(400).json({ error: 'Already exist' });
        }

        const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
        const newUser = {
            email,
            password: hashedPassword,
        };

        const result = await usersCollection.insertOne(newUser);

        return res.status(201).json({ id: result.insertedId, email });
    }

    static async getMe(req, res) {
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
