import db from '../db/index.js';
import { Poem, CreatePoemRequest, UpdatePoemRequest, Category } from '../../shared/types.js';
import { mapToUser, getUserById } from './userRepository.js';

export interface DbPoem {
  id: number;
  user_id: number;
  category_id?: number;
  title: string;
  content: string;
  genre: string;
  tone_pattern?: string;
  rhyme_pattern?: string;
  audio_url?: string;
  audio_duration?: number;
  waveform_data?: string;
  is_shared: number;
  is_approved: number;
  likes_count: number;
  comments_count: number;
  favorites_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export function mapToPoem(dbPoem: DbPoem, includeAuthor = false, includeCategory = false): Poem {
  const poem: Poem = {
    id: dbPoem.id,
    userId: dbPoem.user_id,
    categoryId: dbPoem.category_id,
    title: dbPoem.title,
    content: dbPoem.content,
    genre: dbPoem.genre,
    tonePattern: dbPoem.tone_pattern,
    rhymePattern: dbPoem.rhyme_pattern,
    audioUrl: dbPoem.audio_url,
    audioDuration: dbPoem.audio_duration,
    waveformData: dbPoem.waveform_data ? JSON.parse(dbPoem.waveform_data) : undefined,
    isShared: dbPoem.is_shared ? true : false,
    isApproved: dbPoem.is_approved ? true : false,
    likesCount: dbPoem.likes_count,
    commentsCount: dbPoem.comments_count,
    favoritesCount: dbPoem.favorites_count,
    viewsCount: dbPoem.views_count,
    createdAt: dbPoem.created_at,
    updatedAt: dbPoem.updated_at,
  };

  if (includeAuthor) {
    const author = getUserById(dbPoem.user_id);
    if (author) poem.author = author;
  }

  return poem;
}

export function createPoem(userId: number, data: CreatePoemRequest): Poem {
  const stmt = db.prepare(`
    INSERT INTO poems (user_id, category_id, title, content, genre, tone_pattern, rhyme_pattern)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    userId,
    data.categoryId || null,
    data.title,
    data.content,
    data.genre,
    data.tonePattern || null,
    data.rhymePattern || null
  );
  return getPoemById(result.lastInsertRowid as number)!;
}

export function getPoemById(id: number, includeAuthor = false): Poem | null {
  const stmt = db.prepare('SELECT * FROM poems WHERE id = ?');
  const poem = stmt.get(id) as DbPoem | undefined;
  return poem ? mapToPoem(poem, includeAuthor) : null;
}

export function getUserPoems(userId: number, options: { genre?: string; page?: number; limit?: number } = {}): Poem[] {
  let sql = 'SELECT * FROM poems WHERE user_id = ?';
  const params: any[] = [userId];

  if (options.genre) {
    sql += ' AND genre = ?';
    params.push(options.genre);
  }

  sql += ' ORDER BY created_at DESC';

  if (options.page && options.limit) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(options.limit, (options.page - 1) * options.limit);
  }

  const stmt = db.prepare(sql);
  const poems = stmt.all(...params) as DbPoem[];
  return poems.map(p => mapToPoem(p));
}

export function getCommunityPoems(options: { genre?: string; sortBy?: 'hot' | 'latest'; page?: number; limit?: number; hasAudio?: boolean } = {}): Poem[] {
  let sql = 'SELECT * FROM poems WHERE is_shared = 1 AND is_approved = 1';
  const params: any[] = [];

  if (options.genre) {
    sql += ' AND genre = ?';
    params.push(options.genre);
  }

  if (options.hasAudio === true) {
    sql += ' AND audio_url IS NOT NULL AND audio_url != \'\'';
  } else if (options.hasAudio === false) {
    sql += ' AND (audio_url IS NULL OR audio_url = \'\')';
  }

  if (options.sortBy === 'hot') {
    sql += ' ORDER BY (CASE WHEN audio_url IS NOT NULL AND audio_url != \'\' THEN 1 ELSE 0 END) DESC, (likes_count * 3 + comments_count * 2 + favorites_count * 4 + views_count) DESC';
  } else {
    sql += ' ORDER BY (CASE WHEN audio_url IS NOT NULL AND audio_url != \'\' THEN 1 ELSE 0 END) DESC, created_at DESC';
  }

  if (options.page && options.limit) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(options.limit, (options.page - 1) * options.limit);
  } else {
    sql += ' LIMIT 20';
  }

  const stmt = db.prepare(sql);
  const poems = stmt.all(...params) as DbPoem[];
  return poems.map(p => mapToPoem(p, true));
}

export function getPendingPoems(): Poem[] {
  const stmt = db.prepare(`
    SELECT * FROM poems 
    WHERE is_shared = 1 AND is_approved = 0 
    ORDER BY created_at DESC
  `);
  const poems = stmt.all() as DbPoem[];
  return poems.map(p => mapToPoem(p, true));
}

export function updatePoem(id: number, data: UpdatePoemRequest): Poem | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.content) {
    fields.push('content = ?');
    values.push(data.content);
  }
  if (data.genre) {
    fields.push('genre = ?');
    values.push(data.genre);
  }
  if (data.categoryId !== undefined) {
    fields.push('category_id = ?');
    values.push(data.categoryId || null);
  }
  if (data.isShared !== undefined) {
    fields.push('is_shared = ?');
    values.push(data.isShared ? 1 : 0);
    if (data.isShared) {
      fields.push('is_approved = ?');
      values.push(0);
    }
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = db.prepare(`UPDATE poems SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getPoemById(id);
}

export function updatePoemAudio(id: number, audioUrl: string, duration: number, waveformData: number[]): Poem | null {
  const stmt = db.prepare(`
    UPDATE poems 
    SET audio_url = ?, audio_duration = ?, waveform_data = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(audioUrl, duration, JSON.stringify(waveformData), id);
  return getPoemById(id);
}

export function deletePoem(id: number): boolean {
  const stmt = db.prepare('DELETE FROM poems WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function approvePoem(id: number): Poem | null {
  const stmt = db.prepare('UPDATE poems SET is_approved = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(id);
  return getPoemById(id, true);
}

export function rejectPoem(id: number): boolean {
  const stmt = db.prepare('UPDATE poems SET is_shared = 0, is_approved = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function incrementViews(id: number): void {
  const stmt = db.prepare('UPDATE poems SET views_count = views_count + 1 WHERE id = ?');
  stmt.run(id);
}

export function sharePoem(id: number): Poem | null {
  const stmt = db.prepare(`
    UPDATE poems 
    SET is_shared = 1, is_approved = 0, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(id);
  return getPoemById(id);
}

export function getHotPoems(limit = 10): Poem[] {
  return getCommunityPoems({ sortBy: 'hot', limit });
}
