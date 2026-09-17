import request from 'supertest';
import express, { Express } from 'express';
import supabase from '../../supabaseClient';
import { mockSupabase } from '../helpers/supabaseMock';

jest.mock('../../supabaseClient');

/**
 * The limiters in routes/auth.ts read their `max` once, at module load time.
 * To test the limit we set a tiny ceiling in the environment and then load a
 * *fresh* copy of the router with `jest.isolateModules`, so the global test
 * setup's very high ceiling doesn't apply here.
 */
function loadAuthApp(env: Record<string, string>): Express {
  let app!: Express;

  jest.isolateModules(() => {
    const previous: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(env)) {
      previous[key] = process.env[key];
      process.env[key] = value;
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const authRouter = require('../../routes/auth').default;

    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
  });

  return app;
}

describe('Auth rate limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // No user matches, so allowed login attempts return 401 rather than 200.
    mockSupabase(supabase, { users: { data: [], error: null } });
  });

  it('returns 429 once the login attempt ceiling is exceeded', async () => {
    const app = loadAuthApp({ AUTH_RATE_LIMIT_MAX: '2' });
    const attempt = () =>
      request(app).post('/api/auth/login').send({ email: 'a@example.com', pass: 'Password123!' });

    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toContain('Too many attempts');
  });

  it('counts login and verify against the same shared limiter budget', async () => {
    const app = loadAuthApp({ AUTH_RATE_LIMIT_MAX: '1' });

    // `authLimiter` is a single instance mounted on both routes, so one request
    // to /login consumes the only slot available to /verify too.
    expect(
      (await request(app).post('/api/auth/login').send({ email: 'a@example.com', pass: 'x' })).status,
    ).toBe(401);

    expect((await request(app).post('/api/auth/verify')).status).toBe(429);
  });

  it('limits signups separately from logins', async () => {
    const app = loadAuthApp({ AUTH_RATE_LIMIT_MAX: '1', SIGNUP_RATE_LIMIT_MAX: '1' });

    // Burn the signup budget with an invalid-password request (still counted).
    expect(
      (
        await request(app)
          .post('/api/auth/signup')
          .send({ email: 'a@example.com', name: 'A', pass: 'weak' })
      ).status,
    ).toBe(400);

    const blockedSignup = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'b@example.com', name: 'B', pass: 'Password123!' });
    expect(blockedSignup.status).toBe(429);
    expect(blockedSignup.body.error).toContain('Too many accounts');

    // The login budget is untouched by the signup traffic.
    expect(
      (await request(app).post('/api/auth/login').send({ email: 'a@example.com', pass: 'x' })).status,
    ).toBe(401);
  });

  it('falls back to the default ceiling when the env value is not a positive integer', async () => {
    const app = loadAuthApp({ AUTH_RATE_LIMIT_MAX: 'not-a-number' });
    const attempt = () =>
      request(app).post('/api/auth/login').send({ email: 'a@example.com', pass: 'x' });

    // Default is 5, so five attempts pass and the sixth is blocked.
    for (let i = 0; i < 5; i += 1) {
      expect((await attempt()).status).toBe(401);
    }
    expect((await attempt()).status).toBe(429);
  });
});
