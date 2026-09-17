import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

// Rate limiters are keyed by IP, and every supertest request comes from
// 127.0.0.1. With production limits (5 / 15min) the suite would trip the
// limiter and get 429s instead of the responses under test, so raise the
// ceiling here. The limiter itself is covered by a dedicated test that
// lowers these values on purpose.
process.env.AUTH_RATE_LIMIT_MAX = '10000';
process.env.SIGNUP_RATE_LIMIT_MAX = '10000';

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};