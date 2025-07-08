import express from 'express';
import request from 'supertest';
import routes from './routes';
import { describe, expect, it } from 'vitest';

describe('Auth routes', () => {
  const app = express();
  app.use(express.json());
  app.use(routes);

  it('POST /login responds with 401 when no credentials provided', async () => {
    const res = await request(app).post('/login').send({});
    expect(res.status).toBe(401);
  });

  it('POST /register responds with 400 when no credentials provided', async () => {
    const res = await request(app).post('/register').send({});
    expect(res.status).toBe(400);
  });

  it('POST /refresh responds with 401 when no token provided', async () => {
    const res = await request(app).post('/refresh').send({});
    expect(res.status).toBe(401);
  });

  it('POST /logout responds with 400 when no token provided', async () => {
    const res = await request(app).post('/logout').send({});
    expect(res.status).toBe(400);
  });
});
