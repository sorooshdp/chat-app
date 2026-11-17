import { MessageService } from '../../services/messageService';
import db from '../../db';

jest.mock('../../db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

const mockedQuery = db.query as jest.Mock;

function rawMessageRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    content: 'hello',
    created_at: '2026-01-01T00:00:00.000Z',
    sender_id: 10,
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

describe('MessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConversationMessages', () => {
    it('rejects a user who is not a participant', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] });

      await expect(MessageService.getConversationMessages(5, 10)).rejects.toThrow(
        'Unauthorized: Not a participant of this conversation',
      );

      expect(mockedQuery).toHaveBeenCalledTimes(1);
    });

    it('returns messages oldest-first for a participant', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockResolvedValueOnce({
          rows: [
            rawMessageRow({ id: 3, content: 'newest' }),
            rawMessageRow({ id: 2, content: 'middle' }),
            rawMessageRow({ id: 1, content: 'oldest' }),
          ],
        });

      const messages = await MessageService.getConversationMessages(5, 10);

      expect(messages.map((m) => m.content)).toEqual(['oldest', 'middle', 'newest']);
    });

    it('scopes the query to the conversation and applies the default limit', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockResolvedValueOnce({ rows: [] });

      await MessageService.getConversationMessages(5, 10);

      expect(mockedQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('WHERE m.conversation_id = $1'),
        [5, 50],
      );
    });

    it('applies the cursor filter when `before` is given', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockResolvedValueOnce({ rows: [] });

      await MessageService.getConversationMessages(5, 10, 20, 42);

      expect(mockedQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('AND m.id < $2'),
        [5, 42, 20],
      );
    });

    it('throws a generic error when the database read fails', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockRejectedValueOnce(new Error('connection reset'));

      await expect(MessageService.getConversationMessages(5, 10)).rejects.toThrow(
        'Failed to fetch messages',
      );
    });
  });

  describe('sendMessage', () => {
    it('rejects a sender who is not a participant', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] });

      await expect(MessageService.sendMessage(5, 10, 'hi')).rejects.toThrow(
        'Unauthorized: Not a participant of this conversation',
      );
    });

    it('inserts the message and returns it with sender details', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockResolvedValueOnce({
          rows: [rawMessageRow({ id: 12, content: 'hi' })],
        });

      const message = await MessageService.sendMessage(5, 10, 'hi');

      expect(mockedQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO messages'),
        [5, 10, 'hi', null],
      );
      expect(message).toMatchObject({
        id: 12,
        content: 'hi',
        conversation_id: 5,
        sender_id: 10,
        sender: { id: 10, name: 'Ada', avatar_url: null },
      });
    });

    it('throws a generic error when the insert fails', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockRejectedValueOnce(new Error('constraint violation'));

      await expect(MessageService.sendMessage(5, 10, 'hi')).rejects.toThrow('Failed to send message');
    });
  });

  describe('editMessage and deleteMessage', () => {
    it('throws when editing a message not owned by sender or not in conversation', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] });

      await expect(MessageService.editMessage(5, 12, 10, 'updated')).rejects.toThrow(
        'Failed to edit message or unauthorized',
      );
    });

    it('throws when deleting a message not owned by sender', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] });

      await expect(MessageService.deleteMessage(5, 12, 10)).rejects.toThrow(
        'Failed to delete message or unauthorized',
      );
    });
  });

  describe('getConversationParticipantIds', () => {
    it('maps rows to user ids', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ user_id: 10 }, { user_id: 11 }, { user_id: 12 }],
      });

      await expect(MessageService.getConversationParticipantIds(5)).resolves.toEqual([10, 11, 12]);
    });

    it('returns an empty array on error instead of throwing', async () => {
      mockedQuery.mockRejectedValueOnce(new Error('boom'));

      await expect(MessageService.getConversationParticipantIds(5)).resolves.toEqual([]);
    });
  });
});