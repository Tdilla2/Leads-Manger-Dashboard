import { Router, Request, Response } from 'express';
import { login, changePassword } from '../services/auth.service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const result = await login(username, password);
    if (!result) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    if (newPassword === 'password123') {
      res.status(400).json({ error: 'Please choose a different password' });
      return;
    }

    const result = await changePassword(req.user!.id, newPassword);
    if (!result) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
