import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router: Router = Router();

router.get('/:conversationId', authenticateToken, MessageController.getMessages);
router.post('/:conversationId', authenticateToken, MessageController.sendMessage);

export default router;
