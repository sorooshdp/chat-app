import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router: Router = Router();

router.get('/:conversationId', authenticateToken, MessageController.getMessages);
router.post('/:conversationId', authenticateToken, MessageController.sendMessage);
router.put('/:conversationId/:messageId', authenticateToken, MessageController.editMessage);
router.delete('/:conversationId/:messageId', authenticateToken, MessageController.deleteMessage);

export default router;
