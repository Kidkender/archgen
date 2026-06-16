import { buildApp } from '../src/app';

const TEST_EMAIL = 'auth-test@example.com';
const TEST_PASSWORD = 'Test1234!';

describe('Auth endpoints', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/register → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        username: 'testuser',
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toHaveProperty('success', true);
  });

  it('POST /api/v1/auth/register duplicate → 409', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        username: 'testuser2',
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it('POST /api/v1/auth/login → 200 with token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data.accessToken');
  });

  it('POST /api/v1/auth/login wrong password → 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: TEST_EMAIL,
        password: 'WrongPassword!',
      },
    });
    expect(res.statusCode).toBe(401);
  });
});
