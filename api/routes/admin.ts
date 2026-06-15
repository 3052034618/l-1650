import { Router } from 'express';
import { getPendingReviews, approvePoemHandler, rejectPoemHandler, getCategories, createCategoryHandler, updateCategoryHandler, deleteCategoryHandler } from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/poems/pending', getPendingReviews);
router.put('/poems/:id/approve', approvePoemHandler);
router.put('/poems/:id/reject', rejectPoemHandler);
router.get('/categories', getCategories);
router.post('/categories', createCategoryHandler);
router.put('/categories/:id', updateCategoryHandler);
router.delete('/categories/:id', deleteCategoryHandler);

export default router;
