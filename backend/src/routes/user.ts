import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/search', authenticateToken, UserController.searchUsers);

export default router;
