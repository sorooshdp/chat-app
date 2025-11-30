import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { ConversationService } from "../services/conversationService";

export class ConversationController {
  static async getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log("entered get function");
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      console.log("Fetching conversations for user:", req.user.id);
      const conversations = await ConversationService.getUserConversations(req.user.id);
      res.json({ conversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async createConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { participantIds, type, name } = req.body;

      if (!participantIds || !Array.isArray(participantIds)) {
        res.status(400).json({ error: "Invalid participant list" });
        return;
      }

      if (!["dm", "group"].includes(type)) {
        res.status(400).json({ error: "Invalid conversation type" });
        return;
      }

      const conversationId = await ConversationService.createConversation(req.user.id, participantIds, type, name);

      // Fetch the full conversation details
      const conversations = await ConversationService.getUserConversations(req.user.id);
      const newConversation = conversations.find((c) => c.id === conversationId);

      res.status(201).json({
        conversationId,
        conversation: newConversation, // Return full conversation object
      });
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      res.status(400).json({ error: error.message || "Failed to create conversation" });
    }
  }
}
