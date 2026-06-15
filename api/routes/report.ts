import { Router } from 'express';
import { getMonthlyReportHandler } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/monthly', authenticateToken, getMonthlyReportHandler);

export default router;
