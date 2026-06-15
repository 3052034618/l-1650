import { Router } from 'express';
import { login, register, logout, getProfile, getReminderSettings, updateReminderSettings } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.get('/reminder', authenticateToken, getReminderSettings);
router.put('/reminder', authenticateToken, updateReminderSettings);

export default router;
