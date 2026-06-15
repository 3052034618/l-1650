import db from '../db/index.js';
import { Category } from '../../shared/types.js';

export interface DbCategory {
  id: number;
  name: string;
  description: string;
  meter_rules: string;
  is_active: number;
  created_at: string;
}

export function mapToCategory(dbCat: DbCategory): Category {
  return {
    id: dbCat.id,
    name: dbCat.name,
    description: dbCat.description,
    meterRules: dbCat.meter_rules,
    isActive: dbCat.is_active ? true : false,
    createdAt: dbCat.created_at,
  };
}

export function getAllCategories(includeInactive = false): Category[] {
  let sql = 'SELECT * FROM categories';
  if (!includeInactive) {
    sql += ' WHERE is_active = 1';
  }
  sql += ' ORDER BY id';
  const stmt = db.prepare(sql);
  const categories = stmt.all() as DbCategory[];
  return categories.map(mapToCategory);
}

export function getCategoryById(id: number): Category | null {
  const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
  const category = stmt.get(id) as DbCategory | undefined;
  return category ? mapToCategory(category) : null;
}

export function createCategory(data: { name: string; description?: string; meterRules?: string }): Category {
  const stmt = db.prepare(`
    INSERT INTO categories (name, description, meter_rules)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.description || '',
    data.meterRules || '{"custom": true}'
  );
  return getCategoryById(result.lastInsertRowid as number)!;
}

export function updateCategory(id: number, data: { name?: string; description?: string; meterRules?: string; isActive?: boolean }): Category | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.meterRules) {
    fields.push('meter_rules = ?');
    values.push(data.meterRules);
  }
  if (data.isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(data.isActive ? 1 : 0);
  }

  values.push(id);
  const stmt = db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getCategoryById(id);
}

export function deleteCategory(id: number): boolean {
  const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}
