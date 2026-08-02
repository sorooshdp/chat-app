import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { MessageService } from "../services/messageService";
import { emitNewMessage, emitConversationListUpdate } from "../socket";

export class MessageController {
  static async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const conversationIdParam = req.params.conversationId;
      if (!conversationIdParam) {
        res.status(400).json({ error: "Conversation ID is required" });
        return;
      }

      const conversationId = parseInt(conversationIdParam);

      if (isNaN(conversationId)) {
        res.status(400).json({ error: "Invalid conversation ID" });
        return;
      }

      // Parse pagination params (clamped to prevent resource exhaustion)
      const rawLimit = parseInt(req.query.limit as string);
      const limit = Number.isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 100);

      const rawBefore = parseInt(req.query.before as string);
      const before = Number.isNaN(rawBefore) ? undefined : rawBefore;

      const messages = await MessageService.getConversationMessages(conversationId, req.user.id, limit, before);

      res.json({ messages, hasMore: messages.length === limit });
    } catch (error) {
      console.error("Error fetching messages:", error);
      const isAuthError = error instanceof Error && error.message.startsWith("Unauthorized");
      res.status(isAuthError ? 403 : 500).json({
        error: isAuthError ? "Not a participant of this conversation" : "Internal server error",
      });
    }
  }

  static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const conversationIdParam = req.params.conversationId;
      if (!conversationIdParam) {
        res.status(400).json({ error: "Conversation ID is required" });
        return;
      }

      const conversationId = parseInt(conversationIdParam);
      const { content } = req.body;

      if (isNaN(conversationId)) {
        res.status(400).json({ error: "Invalid conversation ID" });
        return;
      }

      if (!content || typeof content !== "string" || content.trim().length === 0) {
        res.status(400).json({ error: "Message content is required" });
        return;
      }

      if (content.trim().length > 5000) {
        res.status(400).json({ error: "Message too long (max 5000 characters)" });
        return;
      }

      const message = await MessageService.sendMessage(conversationId, req.user.id, content.trim());

      // Emit the message to all connected clients in the conversation room
      emitNewMessage(conversationId, message);

      // Emit conversation list update to all participants (for sidebar updates)
      const participantIds = await MessageService.getConversationParticipantIds(conversationId);
      emitConversationListUpdate(participantIds, conversationId, {
        content: message.content,
        created_at: message.created_at,
        sender_id: message.sender_id,
      });

      res.status(201).json({ message });
    } catch (error) {
      console.error("Error sending message:", error);
      const isAuthError = error instanceof Error && error.message.startsWith("Unauthorized");
      res.status(isAuthError ? 403 : 500).json({
        error: isAuthError ? "Not a participant of this conversation" : "Internal server error",
      });
    }
  }
}
