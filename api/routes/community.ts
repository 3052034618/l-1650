import { Router } from 'express';
import { getCommunityPoemsHandler, getCommunityPoemDetail, likePoem, favoritePoem, getComments, addCommentHandler, getHotPoemsHandler } from '../controllers/communityController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/hot', getHotPoemsHandler);
router.get('/', getCommunityPoemsHandler);
router.get('/:id', authenticateToken, getCommunityPoemDetail);
router.post('/:id/like', authenticateToken, likePoem);
router.post('/:id/favorite', authenticateToken, favoritePoem);
router.get('/:id/comments', getComments);
router.post('/:id/comments', authenticateToken, addCommentHandler);

export default router;
