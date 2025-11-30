import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { UserService } from '../services/userService';

export class UserController {
  static async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { q } = req.query;

      if (typeof q !== 'string') {
        res.status(400).json({ error: 'Query parameter "q" is required' });
        return;
      }

      const users = await UserService.searchUsers(q, req.user.id);
      res.json({ users });
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
