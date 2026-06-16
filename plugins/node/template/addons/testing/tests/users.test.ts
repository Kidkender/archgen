import { buildApp } from '../src/app';

describe('Users endpoints', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let authToken: string;

  beforeAll(async () => {
    app = await buildApp();

    // Register + login to get token
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'users-test@example.com',
        password: 'Test1234!',
        username: 'userstestaccount',
      },
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'users-test@example.com',
        password: 'Test1234!',
      },
    });
    authToken = loginRes.json()?.data?.accessToken ?? '';
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/users without token → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/users' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/v1/users with token → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('success', true);
  });

  it('GET /api/v1/users/:id not found → 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/99999',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(404);
  });
});
