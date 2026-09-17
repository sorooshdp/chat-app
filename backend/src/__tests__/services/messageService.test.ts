import { MessageService } from '../../services/messageService';
import supabase from '../../supabaseClient';
import { mockSupabase } from '../helpers/supabaseMock';

// Replace the whole module with auto-generated jest mocks. Nothing real
// reaches the network, and `supabase.from` becomes a jest.Mock we can program.
jest.mock('../../supabaseClient');

const PARTICIPANT = { data: { id: 99 }, error: null };
const NOT_PARTICIPANT = { data: null, error: null };

function messageRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    content: 'hello',
    created_at: '2026-01-01T00:00:00.000Z',
    sender_id: 10,
    conversation_id: 5,
    is_read: false,
    sender: { id: 10, name: 'Ada', avatar_url: null },
    ...overrides,
  };
}

describe('MessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConversationMessages', () => {
    it('rejects a user who is not a participant', async () => {
      mockSupabase(supabase, { conversation_participants: NOT_PARTICIPANT });

      await expect(MessageService.getConversationMessages(5, 10)).rejects.toThrow(
        'Unauthorized: Not a participant of this conversation',
      );

      // Authorization must happen before any message read.
      expect((supabase.from as jest.Mock)).not.toHaveBeenCalledWith('messages');
    });

    it('returns messages oldest-first for a participant', async () => {
      // Supabase is queried newest-first; the service reverses the rows.
      mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: {
          data: [
            messageRow({ id: 3, content: 'newest' }),
            messageRow({ id: 2, content: 'middle' }),
            messageRow({ id: 1, content: 'oldest' }),
          ],
          error: null,
        },
      });

      const messages = await MessageService.getConversationMessages(5, 10);

      expect(messages.map((m) => m.content)).toEqual(['oldest', 'middle', 'newest']);
    });

    it('scopes the query to the conversation and applies the default limit', async () => {
      const db = mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: { data: [], error: null },
      });

      await MessageService.getConversationMessages(5, 10);

      const query = db.forTable('messages')!;
      expect(query.eq).toHaveBeenCalledWith('conversation_id', 5);
      expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(query.limit).toHaveBeenCalledWith(50);
      // No cursor requested, so no `lt` filter.
      expect(query.lt).not.toHaveBeenCalled();
    });

    it('applies the cursor as a `lt` filter when `before` is given', async () => {
      const db = mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: { data: [], error: null },
      });

      await MessageService.getConversationMessages(5, 10, 20, 42);

      const query = db.forTable('messages')!;
      expect(query.limit).toHaveBeenCalledWith(20);
      expect(query.lt).toHaveBeenCalledWith('id', 42);
    });

    it('throws a generic error when the database read fails', async () => {
      mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: { data: null, error: { message: 'connection reset' } },
      });

      // The raw driver error must not leak to the caller.
      await expect(MessageService.getConversationMessages(5, 10)).rejects.toThrow(
        'Failed to fetch messages',
      );
    });

    it('normalises an array-shaped sender join into a single object', async () => {
      mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        // Supabase returns embedded relations as arrays in some configurations.
        messages: { data: [messageRow({ sender: [{ id: 10, name: 'Ada', avatar_url: null }] })], error: null },
      });

      const [message] = await MessageService.getConversationMessages(5, 10);

      expect(message!.sender).toEqual({ id: 10, name: 'Ada', avatar_url: null });
    });

    it('falls back to a placeholder sender when the join is empty', async () => {
      mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: { data: [messageRow({ sender: null, sender_id: 77 })], error: null },
      });

      const [message] = await MessageService.getConversationMessages(5, 10);

      expect(message!.sender).toEqual({ id: 77, name: null, avatar_url: null });
    });

    it('returns an empty array when the table returns no rows', async () => {
      mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: { data: null, error: null },
      });

      await expect(MessageService.getConversationMessages(5, 10)).resolves.toEqual([]);
    });
  });

  describe('sendMessage', () => {
    it('rejects a sender who is not a participant', async () => {
      mockSupabase(supabase, { conversation_participants: NOT_PARTICIPANT });

      await expect(MessageService.sendMessage(5, 10, 'hi')).rejects.toThrow(
        'Unauthorized: Not a participant of this conversation',
      );
    });

    it('inserts the message and returns it with sender details', async () => {
      const db = mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: { data: messageRow({ id: 12, content: 'hi' }), error: null },
      });

      const message = await MessageService.sendMessage(5, 10, 'hi');

      expect(db.forTable('messages')!.insert).toHaveBeenCalledWith({
        conversation_id: 5,
        sender_id: 10,
        content: 'hi',
      });
      expect(message).toMatchObject({
        id: 12,
        content: 'hi',
        conversation_id: 5,
        sender_id: 10,
        sender: { id: 10, name: 'Ada' },
      });
    });

    it('throws a generic error when the insert fails', async () => {
      mockSupabase(supabase, {
        conversation_participants: PARTICIPANT,
        messages: { data: null, error: { message: 'constraint violation' } },
      });

      await expect(MessageService.sendMessage(5, 10, 'hi')).rejects.toThrow('Failed to send message');
    });
  });

  describe('getConversationParticipantIds', () => {
    it('maps rows to user ids', async () => {
      mockSupabase(supabase, {
        conversation_participants: {
          data: [{ user_id: 10 }, { user_id: 11 }, { user_id: 12 }],
          error: null,
        },
      });

      await expect(MessageService.getConversationParticipantIds(5)).resolves.toEqual([10, 11, 12]);
    });

    it('returns an empty array on error instead of throwing', async () => {
      // Callers use this for socket fan-out, so a failure must degrade quietly.
      mockSupabase(supabase, {
        conversation_participants: { data: null, error: { message: 'boom' } },
      });

      await expect(MessageService.getConversationParticipantIds(5)).resolves.toEqual([]);
    });
  });
});
