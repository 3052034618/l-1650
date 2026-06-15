import { Request, Response } from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
import { generateToken, AuthRequest } from '../middleware/auth.js';
import { createUser, findByUsername, findByEmail, findByUsernameWithPassword, updateReminder, getReminder } from '../repositories/userRepository.js';
import { ApiResponse, LoginRequest, RegisterRequest, User, Reminder } from '../../shared/types.js';

export async function login(req: Request, res: Response<ApiResponse<{ token: string; user: Omit<User, 'createdAt'> }>>) {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        errors: ['用户名和密码不能为空'],
      });
    }

    const dbUser = findByUsernameWithPassword(username);
    if (!dbUser) {
      return res.status(401).json({
        success: false,
        errors: ['用户名或密码错误'],
      });
    }

    const isValidPassword = await bcrypt.compare(password, dbUser.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        errors: ['用户名或密码错误'],
      });
    }

    const user = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      avatar: dbUser.avatar,
      role: dbUser.role,
    };

    const token = generateToken(user);

    res.json({
      success: true,
      data: { token, user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['登录失败，请稍后重试'],
    });
  }
}

export async function register(req: Request, res: Response<ApiResponse<{ token: string; user: Omit<User, 'createdAt'> }>>) {
  try {
    const { username, email, password }: RegisterRequest = req.body;
    const errors: string[] = [];

    if (!username || username.length < 2) {
      errors.push('用户名至少2个字符');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('请输入有效的邮箱地址');
    }
    if (!password || password.length < 6) {
      errors.push('密码至少6个字符');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    if (findByUsername(username)) {
      return res.status(400).json({
        success: false,
        errors: ['用户名已存在'],
      });
    }

    if (findByEmail(email)) {
      return res.status(400).json({
        success: false,
        errors: ['邮箱已被注册'],
      });
    }

    const user = await createUser({ username, email, password });
    const userWithoutCreatedAt = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    };

    const token = generateToken(userWithoutCreatedAt);

    updateReminder(user.id, { reminderTime: '09:00:00', isEnabled: true });

    res.status(201).json({
      success: true,
      data: { token, user: userWithoutCreatedAt },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['注册失败，请稍后重试'],
    });
  }
}

export function logout(req: Request, res: Response<ApiResponse<null>>) {
  res.json({
    success: true,
    message: '已退出登录',
  });
}

export function getProfile(req: AuthRequest, res: Response<ApiResponse<User>>) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      errors: ['未登录'],
    });
  }

  res.json({
    success: true,
    data: req.user as User,
  });
}

export function getReminderSettings(req: AuthRequest, res: Response<ApiResponse<Reminder | null>>) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      errors: ['未登录'],
    });
  }

  const reminder = getReminder(req.user.id);
  res.json({
    success: true,
    data: reminder,
  });
}

export function updateReminderSettings(req: AuthRequest, res: Response<ApiResponse<Reminder>>) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      errors: ['未登录'],
    });
  }

  const { reminderTime, isEnabled, timezone } = req.body;
  const reminder = updateReminder(req.user.id, { reminderTime, isEnabled, timezone });

  res.json({
    success: true,
    data: reminder,
  });
}
