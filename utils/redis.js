import redis from 'redis';

class RedisClient {
  constructor () {
    this.client = redis.createClient();
    this.isConnected = false;

    this.client.on('connect', () => {
      this.isConnected = true;
    }).on('error', (err) => {
      console.log(`Redis client not connected to the server: ${err}`);
      this.isConnected = false;
    });
  }

  isAlive () {
    return this.isConnected;
  }

  async get (key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  async set (key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, duration, value, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async del (key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

const redisClient = new RedisClient();
export default redisClient;
