import { Router } from 'express';
import { getAllCategories } from '../repositories/categoryRepository.js';
import { ApiResponse, Category } from '../../shared/types.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const categories = getAllCategories();
    res.json({
      success: true,
      data: categories,
    } as ApiResponse<Category[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['获取分类失败'],
    });
  }
});

export default router;
