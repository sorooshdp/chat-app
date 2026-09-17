import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import messageRoutes from '../../routes/message';
import supabase from '../../supabaseClient';
import { emitNewMessage, emitConversationListUpdate } from '../../socket';
import { mockSupabase } from '../helpers/supabaseMock';

/**
 * Integration test: the real router + auth middleware + controller + service
 * run together over HTTP (supertest drives an ephemeral server). Only the two
 * process boundaries are faked — the database and the socket layer.
 */
jest.mock('../../supabaseClient');
jest.mock('../../socket');

const app = express();
app.use(express.json());
app.use('/api/messages', messageRoutes);

const JWT_SECRET = process.env.JWT_SECRET!;
const USER = { id: 10, email: 'ada@example.com' };
const authHeader = `Bearer ${jwt.sign(USER, JWT_SECRET, { expiresIn: '1h' })}`;

const PARTICIPANT = { data: { id: 99 }, error: null };
const NOT_PARTICIPANT = { data: null, error: null };

function messageRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    content: 'hello',
    created_at: '2026-01-01T00:00:00.000Z',
    sender_id: USER.id,
    conversation_id: 5,
    is_read: false,
    sender: { id: USER.id, name: 'Ada', avatar_url: null },
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
      // The request must never reach the database.
      expect(supabase.from as jest.Mock).not.toHaveBeenCalled();
    });

    it('rejects a token signed with the wrong secret', async () => {
      const response = await request(app)
        .get('/api/messages/5')
        .set('Authorization', `Bearer ${jwt.sign(USER, 'wrong-secret')}`);

      expect(response.status).toBe(403);
    });

    it('returns messages and hasMore=false for a short page', async () => {
      mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: { data: [messageRow({ id: 2 }), messageRow({ id: 1 })], error: null },
      });

      const response = await request(app).get('/api/messages/5').set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(2);
      // Oldest-first, as the service reverses the newest-first query.
      expect(response.body.messages.map((m: any) => m.id)).toEqual([1, 2]);
      expect(response.body.hasMore).toBe(false);
    });

    it('reports hasMore=true when the page is full', async () => {
      const full = Array.from({ length: 2 }, (_, i) => messageRow({ id: i + 1 }));
      mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: { data: full, error: null },
      });

      const response = await request(app)
        .get('/api/messages/5?limit=2')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.hasMore).toBe(true);
    });

    it('clamps an oversized limit to 100', async () => {
      const db = mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: { data: [], error: null },
      });

      await request(app).get('/api/messages/5?limit=9999').set('Authorization', authHeader);

      expect(db.forTable('messages')!.limit).toHaveBeenCalledWith(100);
    });

    it('falls back to the default limit when limit is not a number', async () => {
      const db = mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: { data: [], error: null },
      });

      await request(app).get('/api/messages/5?limit=abc').set('Authorization', authHeader);

      expect(db.forTable('messages')!.limit).toHaveBeenCalledWith(50);
    });

    it('rejects a non-numeric conversation id', async () => {
      const response = await request(app)
        .get('/api/messages/not-a-number')
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid conversation ID' });
    });

    it('returns 403 when the user is not a participant', async () => {
      mockSupabase(supabase, { conversation_participants: NOT_PARTICIPANT });

      const response = await request(app).get('/api/messages/5').set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Not a participant of this conversation' });
    });

    it('returns 500 without leaking the driver error', async () => {
      mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: { data: null, error: { message: 'connection reset by peer' } },
      });

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
      mockSupabase(supabase, {
        conversation_participants: [
          PARTICIPANT, // membership check
          { data: [{ user_id: 10 }, { user_id: 11 }], error: null }, // fan-out lookup
        ],
        messages: { data: messageRow({ id: 12, content: 'hi' }), error: null },
      });

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
      const db = mockSupabase(supabase, {
        conversation_participants: [PARTICIPANT, { data: [], error: null }],
        messages: { data: messageRow({ content: 'hi' }), error: null },
      });

      await request(app)
        .post('/api/messages/5')
        .set('Authorization', authHeader)
        .send({ content: '   hi   ' });

      expect(db.forTable('messages')!.insert).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'hi' }),
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
      mockSupabase(supabase, {
        conversation_participants: [PARTICIPANT, { data: [], error: null }],
        messages: { data: messageRow({ content }), error: null },
      });

      const response = await request(app)
        .post('/api/messages/5')
        .set('Authorization', authHeader)
        .send({ content });

      expect(response.status).toBe(201);
    });

    it('returns 403 and does not broadcast when the user is not a participant', async () => {
      mockSupabase(supabase, { conversation_participants: NOT_PARTICIPANT });

      const response = await request(app)
        .post('/api/messages/5')
        .set('Authorization', authHeader)
        .send({ content: 'hi' });

      expect(response.status).toBe(403);
      expect(emitNewMessage).not.toHaveBeenCalled();
    });

    it('does not broadcast when the insert fails', async () => {
      mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: { data: null, error: { message: 'constraint violation' } },
      });

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
