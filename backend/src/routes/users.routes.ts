import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import * as usersService from '../services/users.service';

const router = Router();

// All user routes require admin
router.use(authenticateToken, requireAdmin);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await usersService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { username, displayName, role } = req.body;

    if (!username || !displayName) {
      res.status(400).json({ error: 'Username and display name are required' });
      return;
    }

    const user = await usersService.createUser(username, displayName, role || 'user');
    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { displayName, username, role } = req.body;

    if (!displayName || !username) {
      res.status(400).json({ error: 'Display name and username are required' });
      return;
    }

    const user = await usersService.updateUser(req.params.id, displayName, username, role || 'user');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await usersService.deleteUser(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const reset = await usersService.resetPassword(req.params.id);
    if (!reset) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
