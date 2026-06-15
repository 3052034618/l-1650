import { Router } from 'express';
import { createPoemHandler, getMyPoems, getPoemDetail, updatePoemHandler, deletePoemHandler, sharePoemHandler, uploadAudioHandler, upload, checkPoemMeter } from '../controllers/poemController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/check', authenticateToken, checkPoemMeter);
router.get('/', authenticateToken, getMyPoems);
router.post('/', authenticateToken, createPoemHandler);
router.get('/:id', authenticateToken, getPoemDetail);
router.put('/:id', authenticateToken, updatePoemHandler);
router.delete('/:id', authenticateToken, deletePoemHandler);
router.post('/:id/share', authenticateToken, sharePoemHandler);
router.post('/:id/audio', authenticateToken, upload.single('audio'), uploadAudioHandler);

export default router;
