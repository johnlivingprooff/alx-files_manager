import dbClient from '../utils/db';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.DB_HOST = mongoServer.getUri().split('/')[2].split(':')[0];
  process.env.DB_PORT = mongoServer.getUri().split('/')[2].split(':')[1];
  process.env.DB_DATABASE = 'files_manager';
  await dbClient.connect();
});

afterAll(async () => {
  await dbClient.client.close();
  await mongoServer.stop();
});

describe('dbClient', () => {
  it('should connect to MongoDB and be alive', () => {
    expect(dbClient.isAlive()).toBe(true);
  });

  it('should return the number of users', async () => {
    const usersCount = await dbClient.nbUsers();
    expect(usersCount).toBe(0);
  });

  it('should return the number of files', async () => {
    const filesCount = await dbClient.nbFiles();
    expect(filesCount).toBe(0);
  });
});
