import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse, Poem, Comment } from '../../shared/types.js';
import { getCommunityPoems, getHotPoems, getPoemById, incrementViews } from '../repositories/poemRepository.js';
import { toggleLike, toggleFavorite, addComment, getPoemComments, hasUserLiked, hasUserFavorited } from '../repositories/interactionRepository.js';

export function getCommunityPoemsHandler(req: AuthRequest, res: Response<ApiResponse<Poem[]>>) {
  try {
    const { genre, sortBy, page, limit, hasAudio } = req.query;
    let hasAudioBool: boolean | undefined;
    if (hasAudio === 'true') hasAudioBool = true;
    else if (hasAudio === 'false') hasAudioBool = false;

    const poems = getCommunityPoems({
      genre: genre as string,
      sortBy: (sortBy as 'hot' | 'latest') || 'hot',
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      hasAudio: hasAudioBool,
    });

    res.json({
      success: true,
      data: poems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['获取社区作品失败'],
    });
  }
}

export function getCommunityPoemDetail(req: AuthRequest, res: Response<ApiResponse<Poem & { liked: boolean; favorited: boolean }>>) {
  try {
    const { id } = req.params;
    const poem = getPoemById(parseInt(id), true);

    if (!poem) {
      return res.status(404).json({
        success: false,
        errors: ['作品不存在'],
      });
    }

    if (!poem.isShared || !poem.isApproved) {
      return res.status(403).json({
        success: false,
        errors: ['该作品尚未公开'],
      });
    }

    incrementViews(parseInt(id));

    const liked = req.user ? hasUserLiked(req.user.id, parseInt(id)) : false;
    const favorited = req.user ? hasUserFavorited(req.user.id, parseInt(id)) : false;

    res.json({
      success: true,
      data: {
        ...poem,
        liked,
        favorited,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['获取作品详情失败'],
    });
  }
}

export function likePoem(req: AuthRequest, res: Response<ApiResponse<{ liked: boolean; likesCount: number }>>) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        errors: ['请先登录后再点赞'],
      });
    }

    const { id } = req.params;
    const result = toggleLike(req.user.id, parseInt(id));

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: [result.error || '点赞失败'],
      });
    }

    res.json({
      success: true,
      data: result.data!,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errors: [error.message || '点赞失败，请稍后重试'],
    });
  }
}

export function favoritePoem(req: AuthRequest, res: Response<ApiResponse<{ favorited: boolean; favoritesCount: number }>>) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        errors: ['请先登录后再收藏'],
      });
    }

    const { id } = req.params;
    const result = toggleFavorite(req.user.id, parseInt(id));

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: [result.error || '收藏失败'],
      });
    }

    res.json({
      success: true,
      data: result.data!,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errors: [error.message || '收藏失败，请稍后重试'],
    });
  }
}

export function getComments(req: AuthRequest, res: Response<ApiResponse<Comment[]>>) {
  try {
    const { id } = req.params;
    const comments = getPoemComments(parseInt(id));

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['获取评论失败'],
    });
  }
}

export function addCommentHandler(req: AuthRequest, res: Response<ApiResponse<Comment>>) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        errors: ['请先登录后再评论'],
      });
    }

    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        errors: ['评论内容不能为空'],
      });
    }

    const result = addComment(req.user.id, parseInt(id), content.trim());

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: [result.error || '评论失败'],
      });
    }

    res.status(201).json({
      success: true,
      data: result.data!,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errors: [error.message || '评论失败，请稍后重试'],
    });
  }
}

export function getHotPoemsHandler(req: AuthRequest, res: Response<ApiResponse<Poem[]>>) {
  try {
    const { limit, hasAudio } = req.query;
    let hasAudioBool: boolean | undefined;
    if (hasAudio === 'true') hasAudioBool = true;
    else if (hasAudio === 'false') hasAudioBool = false;

    const poems = getHotPoems(limit ? parseInt(limit as string) : 10, hasAudioBool);

    res.json({
      success: true,
      data: poems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['获取热门作品失败'],
    });
  }
}
