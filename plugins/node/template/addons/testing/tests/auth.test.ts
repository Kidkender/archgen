import { buildApp } from "../../../base/src/app";

describe('Auth endpoints', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test@example.com',
        password: 'Test1234!',
        name: 'Test User',
      },
    });
    expect(res.statusCode).toBe(201);
  });

  it('POST /auth/login → 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'Test1234!',
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('data.token');
  });
});
