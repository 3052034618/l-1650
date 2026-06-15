import { Router, type Request, type Response, type NextFunction } from 'express';
import { createPoemHandler, getMyPoems, getPoemDetail, updatePoemHandler, deletePoemHandler, sharePoemHandler, uploadAudioHandler, upload, checkPoemMeter } from '../controllers/poemController.js';
import { authenticateToken } from '../middleware/auth.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

const handleUploadError = (err: any, req: Request, res: Response<ApiResponse<any>>, next: NextFunction) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        errors: ['音频文件大小不能超过10MB'],
      });
    }
    if (err.message && err.message.includes('仅支持MP3')) {
      return res.status(400).json({
        success: false,
        errors: [err.message],
      });
    }
    return res.status(400).json({
      success: false,
      errors: [err.message || '音频上传失败'],
    });
  }
  next();
};

router.post('/check', authenticateToken, checkPoemMeter);
router.get('/', authenticateToken, getMyPoems);
router.post('/', authenticateToken, createPoemHandler);
router.get('/:id', authenticateToken, getPoemDetail);
router.put('/:id', authenticateToken, updatePoemHandler);
router.delete('/:id', authenticateToken, deletePoemHandler);
router.post('/:id/share', authenticateToken, sharePoemHandler);
router.post('/:id/audio', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  upload.single('audio')(req, res, (err: any) => handleUploadError(err, req, res, next));
}, uploadAudioHandler);

export default router;
