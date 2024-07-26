import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import Users from '../utils/users';
import { Queue } from 'bull';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const user = await Users.getUser({ email });
    if (user.length > 0) return res.status(400).json({ error: 'Already exist' });

    const sha1Password = sha1(password);
    const result = await Users.createUser(email, sha1Password);
    return res.status(201).json({ id: result });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await Users.getUser({ _id: ObjectId(userId) });
    if (user.length === 0) return res.status(401).json({ error: 'Unauthorized' });

    return res.status(200).json({ email: user[0].email });
  }
}


export default UsersController;
