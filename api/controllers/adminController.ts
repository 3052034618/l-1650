import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse, Poem, Category } from '../../shared/types.js';
import { getPendingPoems, approvePoem, rejectPoem } from '../repositories/poemRepository.js';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../repositories/categoryRepository.js';

export function getPendingReviews(req: AuthRequest, res: Response<ApiResponse<Poem[]>>) {
  try {
    const poems = getPendingPoems();
    res.json({
      success: true,
      data: poems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['获取待审核作品失败'],
    });
  }
}

export function approvePoemHandler(req: AuthRequest, res: Response<ApiResponse<Poem>>) {
  try {
    const { id } = req.params;
    const poem = approvePoem(parseInt(id));

    if (!poem) {
      return res.status(404).json({
        success: false,
        errors: ['作品不存在'],
      });
    }

    res.json({
      success: true,
      data: poem,
      message: '审核通过',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['审核失败'],
    });
  }
}

export function rejectPoemHandler(req: AuthRequest, res: Response<ApiResponse<null>>) {
  try {
    const { id } = req.params;
    const success = rejectPoem(parseInt(id));

    if (!success) {
      return res.status(404).json({
        success: false,
        errors: ['作品不存在'],
      });
    }

    res.json({
      success: true,
      message: '已拒绝该作品',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['操作失败'],
    });
  }
}

export function getCategories(req: AuthRequest, res: Response<ApiResponse<Category[]>>) {
  try {
    const categories = getAllCategories(true);
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['获取分类失败'],
    });
  }
}

export function createCategoryHandler(req: AuthRequest, res: Response<ApiResponse<Category>>) {
  try {
    const { name, description, meterRules } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        errors: ['分类名称不能为空'],
      });
    }

    const category = createCategory({
      name: name.trim(),
      description,
      meterRules,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['创建分类失败'],
    });
  }
}

export function updateCategoryHandler(req: AuthRequest, res: Response<ApiResponse<Category>>) {
  try {
    const { id } = req.params;
    const { name, description, meterRules, isActive } = req.body;

    const category = updateCategory(parseInt(id), {
      name: name?.trim(),
      description,
      meterRules,
      isActive,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        errors: ['分类不存在'],
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['更新分类失败'],
    });
  }
}

export function deleteCategoryHandler(req: AuthRequest, res: Response<ApiResponse<null>>) {
  try {
    const { id } = req.params;
    const success = deleteCategory(parseInt(id));

    if (!success) {
      return res.status(404).json({
        success: false,
        errors: ['分类不存在'],
      });
    }

    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['删除分类失败'],
    });
  }
}
