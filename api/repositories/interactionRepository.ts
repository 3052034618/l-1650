import db from '../db/index.js';
import { Like, Favorite, Comment } from '../../shared/types.js';
import { getUserById } from './userRepository.js';
import { mapToUser } from './userRepository.js';

export interface DbLike {
  id: number;
  user_id: number;
  poem_id: number;
  created_at: string;
}

export interface DbComment {
  id: number;
  user_id: number;
  poem_id: number;
  content: string;
  created_at: string;
}

export interface InteractionResult<T> {
  success: boolean;
  error?: string;
  data?: T;
}

function checkPoemExistsAndPublic(poemId: number): InteractionResult<null> {
  const poem = db.prepare('SELECT is_shared, is_approved FROM poems WHERE id = ?').get(poemId) as { is_shared: number; is_approved: number } | undefined;
  
  if (!poem) {
    return { success: false, error: '作品不存在或已被删除' };
  }
  
  if (!poem.is_shared || !poem.is_approved) {
    return { success: false, error: '该作品尚未公开，无法进行此操作' };
  }
  
  return { success: true };
}

export function toggleLike(userId: number, poemId: number): InteractionResult<{ liked: boolean; likesCount: number }> {
  const checkResult = checkPoemExistsAndPublic(poemId);
  if (!checkResult.success) {
    return checkResult;
  }

  const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND poem_id = ?').get(userId, poemId);
  
  if (existing) {
    db.prepare('DELETE FROM likes WHERE user_id = ? AND poem_id = ?').run(userId, poemId);
    db.prepare('UPDATE poems SET likes_count = likes_count - 1 WHERE id = ?').run(poemId);
    const poem = db.prepare('SELECT likes_count FROM poems WHERE id = ?').get(poemId) as { likes_count: number };
    return { success: true, data: { liked: false, likesCount: poem.likes_count } };
  } else {
    db.prepare('INSERT INTO likes (user_id, poem_id) VALUES (?, ?)').run(userId, poemId);
    db.prepare('UPDATE poems SET likes_count = likes_count + 1 WHERE id = ?').run(poemId);
    const poem = db.prepare('SELECT likes_count FROM poems WHERE id = ?').get(poemId) as { likes_count: number };
    return { success: true, data: { liked: true, likesCount: poem.likes_count } };
  }
}

export function toggleFavorite(userId: number, poemId: number): InteractionResult<{ favorited: boolean; favoritesCount: number }> {
  const checkResult = checkPoemExistsAndPublic(poemId);
  if (!checkResult.success) {
    return checkResult;
  }

  const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND poem_id = ?').get(userId, poemId);
  
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND poem_id = ?').run(userId, poemId);
    db.prepare('UPDATE poems SET favorites_count = favorites_count - 1 WHERE id = ?').run(poemId);
    const poem = db.prepare('SELECT favorites_count FROM poems WHERE id = ?').get(poemId) as { favorites_count: number };
    return { success: true, data: { favorited: false, favoritesCount: poem.favorites_count } };
  } else {
    db.prepare('INSERT INTO favorites (user_id, poem_id) VALUES (?, ?)').run(userId, poemId);
    db.prepare('UPDATE poems SET favorites_count = favorites_count + 1 WHERE id = ?').run(poemId);
    const poem = db.prepare('SELECT favorites_count FROM poems WHERE id = ?').get(poemId) as { favorites_count: number };
    return { success: true, data: { favorited: true, favoritesCount: poem.favorites_count } };
  }
}

export function addComment(userId: number, poemId: number, content: string): InteractionResult<Comment> {
  const checkResult = checkPoemExistsAndPublic(poemId);
  if (!checkResult.success) {
    return checkResult;
  }

  const stmt = db.prepare(`
    INSERT INTO comments (user_id, poem_id, content)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(userId, poemId, content);
  db.prepare('UPDATE poems SET comments_count = comments_count + 1 WHERE id = ?').run(poemId);
  return { success: true, data: getCommentById(result.lastInsertRowid as number)! };
}

export function getCommentById(id: number): Comment | null {
  const stmt = db.prepare('SELECT * FROM comments WHERE id = ?');
  const comment = stmt.get(id) as DbComment | undefined;
  if (!comment) return null;

  const author = getUserById(comment.user_id);
  return {
    id: comment.id,
    userId: comment.user_id,
    poemId: comment.poem_id,
    content: comment.content,
    createdAt: comment.created_at,
    author: author || undefined,
  };
}

export function getPoemComments(poemId: number): Comment[] {
  const stmt = db.prepare(`
    SELECT * FROM comments WHERE poem_id = ? ORDER BY created_at DESC
  `);
  const comments = stmt.all(poemId) as DbComment[];
  
  return comments.map(c => {
    const author = getUserById(c.user_id);
    return {
      id: c.id,
      userId: c.user_id,
      poemId: c.poem_id,
      content: c.content,
      createdAt: c.created_at,
      author: author || undefined,
    };
  });
}

export function hasUserLiked(userId: number, poemId: number): boolean {
  const stmt = db.prepare('SELECT id FROM likes WHERE user_id = ? AND poem_id = ?');
  const result = stmt.get(userId, poemId);
  return !!result;
}

export function hasUserFavorited(userId: number, poemId: number): boolean {
  const stmt = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND poem_id = ?');
  const result = stmt.get(userId, poemId);
  return !!result;
}
