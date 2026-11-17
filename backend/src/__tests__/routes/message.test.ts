import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import messageRoutes from '../../routes/message';
import db from '../../db';
import { emitNewMessage, emitConversationListUpdate } from '../../socket';

jest.mock('../../db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));
jest.mock('../../socket');

const mockedQuery = db.query as jest.Mock;

const app = express();
app.use(express.json());
app.use('/api/messages', messageRoutes);

const JWT_SECRET = process.env.JWT_SECRET!;
const USER = { id: 10, email: 'ada@example.com' };
const authHeader = `Bearer ${jwt.sign(USER, JWT_SECRET, { expiresIn: '1h' })}`;

function rawMessageRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    content: 'hello',
    created_at: '2026-01-01T00:00:00.000Z',
    sender_id: USER.id,
    conversation_id: 5,
    is_read: false,
    is_edited: false,
    is_deleted: false,
    reply_to_id: null,
    sender_name: 'Ada',
    sender_avatar_url: null,
    reply_content: null,
    reply_sender_name: null,
    ...overrides,
  };
}

describe('Message routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/messages/:conversationId', () => {
    it('requires a token', async () => {
      const response = await request(app).get('/api/messages/5');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
      expect(mockedQuery).not.toHaveBeenCalled();
    });

    it('rejects a token signed with the wrong secret', async () => {
      const response = await request(app)
        .get('/api/messages/5')
        .set('Authorization', `Bearer ${jwt.sign(USER, 'wrong-secret')}`);

      expect(response.status).toBe(403);
    });

    it('returns messages and hasMore=false for a short page', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockResolvedValueOnce({
          rows: [rawMessageRow({ id: 2 }), rawMessageRow({ id: 1 })],
        });

      const response = await request(app).get('/api/messages/5').set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(2);
      expect(response.body.messages.map((m: any) => m.id)).toEqual([1, 2]);
      expect(response.body.hasMore).toBe(false);
    });

    it('reports hasMore=true when the page is full', async () => {
      const full = Array.from({ length: 2 }, (_, i) => rawMessageRow({ id: i + 1 }));
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockResolvedValueOnce({ rows: full });

      const response = await request(app)
        .get('/api/messages/5?limit=2')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.hasMore).toBe(true);
    });

    it('clamps an oversized limit to 100', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockResolvedValueOnce({ rows: [] });

      await request(app).get('/api/messages/5?limit=9999').set('Authorization', authHeader);

      expect(mockedQuery).toHaveBeenNthCalledWith(2, expect.any(String), [5, 100]);
    });

    it('falls back to the default limit when limit is not a number', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockResolvedValueOnce({ rows: [] });

      await request(app).get('/api/messages/5?limit=abc').set('Authorization', authHeader);

      expect(mockedQuery).toHaveBeenNthCalledWith(2, expect.any(String), [5, 50]);
    });

    it('rejects a non-numeric conversation id', async () => {
      const response = await request(app)
        .get('/api/messages/not-a-number')
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid conversation ID' });
    });

    it('returns 403 when the user is not a participant', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/messages/5').set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Not a participant of this conversation' });
    });

    it('returns 500 without leaking the driver error', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockRejectedValueOnce(new Error('connection reset by peer'));

      const response = await request(app).get('/api/messages/5').set('Authorization', authHeader);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('POST /api/messages/:conversationId', () => {
    it('requires a token', async () => {
      const response = await request(app).post('/api/messages/5').send({ content: 'hi' });

      expect(response.status).toBe(401);
    });

    it('creates the message and broadcasts it', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockResolvedValueOnce({ rows: [rawMessageRow({ id: 12, content: 'hi' })] })
        .mockResolvedValueOnce({ rows: [{ user_id: 10 }, { user_id: 11 }] });

      const response = await request(app)
        .post('/api/messages/5')
        .set('Authorization', authHeader)
        .send({ content: 'hi' });

      expect(response.status).toBe(201);
      expect(response.body.message).toMatchObject({ id: 12, content: 'hi', sender_id: USER.id });

      expect(emitNewMessage).toHaveBeenCalledWith(5, expect.objectContaining({ id: 12 }));
      expect(emitConversationListUpdate).toHaveBeenCalledWith(
        [10, 11],
        5,
        expect.objectContaining({ content: 'hi', sender_id: USER.id }),
      );
    });

    it('trims whitespace before persisting', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockResolvedValueOnce({ rows: [rawMessageRow({ content: 'hi' })] })
        .mockResolvedValueOnce({ rows: [] });

      await request(app)
        .post('/api/messages/5')
        .set('Authorization', authHeader)
        .send({ content: '   hi   ' });

      expect(mockedQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO messages'),
        [5, USER.id, 'hi', null],
      );
    });

    it.each([
      ['missing content', {}],
      ['empty string', { content: '' }],
      ['whitespace only', { content: '   ' }],
      ['non-string content', { content: 42 }],
    ])('rejects %s with 400', async (_label, body) => {
      const response = await request(app)
        .post('/api/messages/5')
        .set('Authorization', authHeader)
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Message content is required' });
      expect(emitNewMessage).not.toHaveBeenCalled();
    });

    it('rejects content longer than 5000 characters', async () => {
      const response = await request(app)
        .post('/api/messages/5')
        .set('Authorization', authHeader)
        .send({ content: 'a'.repeat(5001) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Message too long (max 5000 characters)' });
    });

    it('accepts content of exactly 5000 characters', async () => {
      const content = 'a'.repeat(5000);
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockResolvedValueOnce({ rows: [rawMessageRow({ content })] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/messages/5')
        .set('Authorization', authHeader)
        .send({ content });

      expect(response.status).toBe(201);
    });

    it('returns 403 and does not broadcast when the user is not a participant', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/messages/5')
        .set('Authorization', authHeader)
        .send({ content: 'hi' });

      expect(response.status).toBe(403);
      expect(emitNewMessage).not.toHaveBeenCalled();
    });

    it('does not broadcast when the insert fails', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockRejectedValueOnce(new Error('constraint violation'));

      const response = await request(app)
        .post('/api/messages/5')
        .set('Authorization', authHeader)
        .send({ content: 'hi' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
      expect(emitNewMessage).not.toHaveBeenCalled();
    });
  });
});