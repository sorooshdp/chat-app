import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import authRouter from '../../routes/auth';
import supabase from '../../supabaseClient';

// Mock Supabase client
jest.mock('../../supabaseClient');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

const JWT_SECRET = process.env.JWT_SECRET!;

describe('Authentication Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        pass: await bcrypt.hash('Password123!', 10),
      };

      // Mock Supabase queries
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            insert: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          pass: 'Password123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(response.body.user).not.toHaveProperty('pass');
    });

    it('should reject signup with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          pass: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Password must be at least 8 characters');
    });

    it('should reject signup without uppercase letter', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          pass: 'password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('uppercase letter');
    });

    it('should reject signup without number', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          pass: 'Password!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('number');
    });

    it('should reject signup without special character', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          pass: 'Password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('special character');
    });

    it('should reject duplicate email', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 1, email: 'test@example.com' }],
          error: null,
        }),
      }));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          pass: 'Password123!',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('User already exists');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          name: 'Test User',
          pass: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('email');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        pass: hashedPassword,
      };

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [mockUser], error: null }),
      }));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          pass: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toMatchObject({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should reject login with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        pass: hashedPassword,
      };

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [mockUser], error: null }),
      }));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          pass: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      }));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          pass: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should require both email and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should verify valid JWT token', async () => {
      const token = jwt.sign(
        { id: 1, email: 'test@example.com' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.payload).toMatchObject({
        id: 1,
        email: 'test@example.com',
      });
    });

    it('should reject expired token', async () => {
      const token = jwt.sign(
        { id: 1, email: 'test@example.com' },
        JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );

      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid or expired token');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .post('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });
  });
});