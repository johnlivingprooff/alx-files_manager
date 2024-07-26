import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import Users from '../utils/users';

class AuthController {
  static async getConnect(req, res) {
    const auth = req.header('Authorization');
    if (!auth || !auth.startsWith('Basic ')) return res.status(401).json({ error: 'Unauthorized' });

    const creds = Buffer.from(auth.split(' ')[1], 'base64').toString('utf-8');
    const [email, password] = creds.split(':');
    if (!email || !password) return res.status(401).json({ error: 'Unauthorized' });

    const user = await Users.getUser({ email });
    if (user.length === 0 || user[0].password !== sha1(password)) return res.status(401).json({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user[0]._id.toString(), 86400);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await redisClient.del(`auth_${token}`);
    return res.status(204).end();
  }
}

export default AuthController;
module.exports = AuthController;
