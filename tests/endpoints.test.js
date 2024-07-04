import request from 'supertest';
import app from '../server';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
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

describe('API Endpoints', () => {
  // /status endpoint
  it('GET /status should return the status of Redis and DB', async () => {
    const res = await request(app).get('/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ redis: true, db: true });
  });

  // /stats endpoint
  it('GET /stats should return the number of users and files', async () => {
    const res = await request(app).get('/stats');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ users: 0, files: 0 });
  });

  // /users endpoint
  it('POST /users should create a new user', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('test@example.com');
  });

  // /connect endpoint
  it('GET /connect should sign-in the user', async () => {
    const res = await request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from('test@example.com:password123').toString('base64')}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  // /disconnect endpoint
  it('GET /disconnect should sign-out the user', async () => {
    const authRes = await request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from('test@example.com:password123').toString('base64')}`);
    const token = authRes.body.token;

    const res = await request(app)
      .get('/disconnect')
      .set('X-Token', token);
    expect(res.status).toBe(204);
  });

  // /users/me endpoint
  it('GET /users/me should retrieve the user based on the token', async () => {
    const authRes = await request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from('test@example.com:password123').toString('base64')}`);
    const token = authRes.body.token;

    const res = await request(app)
      .get('/users/me')
      .set('X-Token', token);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');
  });

  // /files endpoint
  it('POST /files should create a new file', async () => {
    const authRes = await request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from('test@example.com:password123').toString('base64')}`);
    const token = authRes.body.token;

    const res = await request(app)
      .post('/files')
      .set('X-Token', token)
      .send({ name: 'testfile.txt', type: 'file', data: 'dGVzdCBjb250ZW50' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('testfile.txt');
  });

  // /files/:id endpoint
  it('GET /files/:id should retrieve the file document', async () => {
    const authRes = await request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from('test@example.com:password123').toString('base64')}`);
    const token = authRes.body.token;

    const fileRes = await request(app)
      .post('/files')
      .set('X-Token', token)
      .send({ name: 'testfile.txt', type: 'file', data: 'dGVzdCBjb250ZW50' });

    const res = await request(app)
      .get(`/files/${fileRes.body.id}`)
      .set('X-Token', token);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('testfile.txt');
  });

  // /files endpoint with pagination
  it('GET /files should retrieve files with pagination', async () => {
    const authRes = await request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from('test@example.com:password123').toString('base64')}`);
    const token = authRes.body.token;

    const res = await request(app)
      .get('/files')
      .set('X-Token', token)
      .query({ parentId: 0, page: 0 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // /files/:id/publish endpoint
  it('PUT /files/:id/publish should set isPublic to true', async () => {
    const authRes = await request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from('test@example.com:password123').toString('base64')}`);
    const token = authRes.body.token;

    const fileRes = await request(app)
      .post('/files')
      .set('X-Token', token)
      .send({ name: 'testfile.txt', type: 'file', data: 'dGVzdCBjb250ZW50' });

    const res = await request(app)
      .put(`/files/${fileRes.body.id}/publish`)
      .set('X-Token', token);
    expect(res.status).toBe(200);
    expect(res.body.isPublic).toBe(true);
  });

  // /files/:id/unpublish endpoint
  it('PUT /files/:id/unpublish should set isPublic to false', async () => {
    const authRes = await request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from('test@example.com:password123').toString('base64')}`);
    const token = authRes.body.token;

    const fileRes = await request(app)
      .post('/files')
      .set('X-Token', token)
      .send({ name: 'testfile.txt', type: 'file', data: 'dGVzdCBjb250ZW50' });

    const res = await request(app)
      .put(`/files/${fileRes.body.id}/unpublish`)
      .set('X-Token', token);
    expect(res.status).toBe(200);
    expect(res.body.isPublic).toBe(false);
  });

  // /files/:id/data endpoint
  it('GET /files/:id/data should return the content of the file', async () => {
    const authRes = await request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from('test@example.com:password123').toString('base64')}`);
    const token = authRes.body.token;

    const fileRes = await request(app)
      .post('/files')
      .set('X-Token', token)
      .send({ name: 'testfile.txt', type: 'file', data: 'dGVzdCBjb250ZW50' });

    const res = await request(app)
      .get(`/files/${fileRes.body.id}/data`)
      .set('X-Token', token);
    expect(res.status).toBe(200);
    expect(res.text).toBe('test content');
  });
});
