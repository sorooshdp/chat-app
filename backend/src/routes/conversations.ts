// backend/src/routes/conversation.ts
import { Router } from 'express';
import { ConversationController } from '../controllers/conversationController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router: Router = Router();

router.get('/', authenticateToken, ConversationController.getConversations);
router.get('/:conversationId', authenticateToken, ConversationController.getConversationById);
router.post('/', authenticateToken, ConversationController.createConversation);

export default router;
