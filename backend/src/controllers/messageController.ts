import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { MessageService } from '../services/messageService';

export class MessageController {
  static async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const conversationIdParam = req.params.conversationId;
      if (!conversationIdParam) {
        res.status(400).json({ error: 'Conversation ID is required' });
        return;
      }

      const conversationId = parseInt(conversationIdParam);

      if (isNaN(conversationId)) {
        res.status(400).json({ error: 'Invalid conversation ID' });
        return;
      }

      const messages = await MessageService.getConversationMessages(
        conversationId,
        req.user.id
      );

      res.json({ messages });
    } catch (error) {
      console.error('Error fetching messages:', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: message });
    }
  }

  static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const conversationIdParam = req.params.conversationId;
      if (!conversationIdParam) {
        res.status(400).json({ error: 'Conversation ID is required' });
        return;
      }

      const conversationId = parseInt(conversationIdParam);
      const { content } = req.body;

      if (isNaN(conversationId)) {
        res.status(400).json({ error: 'Invalid conversation ID' });
        return;
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        res.status(400).json({ error: 'Message content is required' });
        return;
      }

      if (content.trim().length > 5000) {
        res.status(400).json({ error: 'Message too long (max 5000 characters)' });
        return;
      }

      const message = await MessageService.sendMessage(
        conversationId,
        req.user.id,
        content.trim()
      );

      res.status(201).json({ message });
    } catch (error) {
      console.error('Error sending message:', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: message });
    }
  }
}
