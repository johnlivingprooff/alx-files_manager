import redisClient from '../utils/redis';

describe('redisClient', () => {
  it('should connect to Redis and be alive', () => {
    expect(redisClient.isAlive()).toBe(true);
  });

  it('should set and get a value', async () => {
    await redisClient.set('test_key', 'test_value', 10);
    const value = await redisClient.get('test_key');
    expect(value).toBe('test_value');
  });

  it('should delete a value', async () => {
    await redisClient.set('test_key', 'test_value', 10);
    await redisClient.del('test_key');
    const value = await redisClient.get('test_key');
    expect(value).toBe(null);
  });
});
