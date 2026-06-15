import db from '../db/index.js';
import { User, RegisterRequest, Reminder } from '../../shared/types.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

export interface DbUser {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  avatar?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export function mapToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    avatar: dbUser.avatar,
    role: dbUser.role,
    createdAt: dbUser.created_at,
  };
}

export async function createUser(data: RegisterRequest): Promise<User> {
  const passwordHash = bcrypt.hashSync(data.password, 10);
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password_hash)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(data.username, data.email, passwordHash);
  return getUserById(result.lastInsertRowid as number)!;
}

export function findByUsername(username: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username) as DbUser | undefined;
  return user ? mapToUser(user) : null;
}

export function findByEmail(email: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email) as DbUser | undefined;
  return user ? mapToUser(user) : null;
}

export function findByUsernameWithPassword(username: string): (DbUser) | null {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username) as DbUser | null;
}

export function getUserById(id: number): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(id) as DbUser | undefined;
  return user ? mapToUser(user) : null;
}

export function updateUserProfile(id: number, data: { username?: string; email?: string; avatar?: string }): User | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.username) {
    fields.push('username = ?');
    values.push(data.username);
  }
  if (data.email) {
    fields.push('email = ?');
    values.push(data.email);
  }
  if (data.avatar !== undefined) {
    fields.push('avatar = ?');
    values.push(data.avatar);
  }

  values.push(id);
  const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getUserById(id);
}

export function getReminder(userId: number): Reminder | null {
  const stmt = db.prepare('SELECT * FROM reminders WHERE user_id = ?');
  const reminder = stmt.get(userId) as any;
  if (!reminder) return null;
  return {
    id: reminder.id,
    userId: reminder.user_id,
    reminderTime: reminder.reminder_time,
    isEnabled: reminder.is_enabled ? true : false,
    timezone: reminder.timezone,
    createdAt: reminder.created_at,
  };
}

export function updateReminder(userId: number, data: { reminderTime?: string; isEnabled?: boolean; timezone?: string }): Reminder {
  const existing = getReminder(userId);
  
  if (!existing) {
    const stmt = db.prepare(`
      INSERT INTO reminders (user_id, reminder_time, is_enabled, timezone)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      userId,
      data.reminderTime || '09:00:00',
      data.isEnabled !== undefined ? (data.isEnabled ? 1 : 0) : 1,
      data.timezone || 'Asia/Shanghai'
    );
    return getReminder(userId)!;
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (data.reminderTime) {
    fields.push('reminder_time = ?');
    values.push(data.reminderTime);
  }
  if (data.isEnabled !== undefined) {
    fields.push('is_enabled = ?');
    values.push(data.isEnabled ? 1 : 0);
  }
  if (data.timezone) {
    fields.push('timezone = ?');
    values.push(data.timezone);
  }

  values.push(userId);
  const stmt = db.prepare(`UPDATE reminders SET ${fields.join(', ')} WHERE user_id = ?`);
  stmt.run(...values);
  return getReminder(userId)!;
}
