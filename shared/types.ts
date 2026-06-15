export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  meterRules: string;
  isActive: boolean;
  createdAt: string;
}

export interface Poem {
  id: number;
  userId: number;
  categoryId?: number;
  title: string;
  content: string;
  genre: string;
  tonePattern?: string;
  rhymePattern?: string;
  audioUrl?: string;
  audioDuration?: number;
  waveformData?: number[];
  isShared: boolean;
  isApproved: boolean;
  likesCount: number;
  commentsCount: number;
  favoritesCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  author?: User;
  category?: Category;
}

export interface Like {
  id: number;
  userId: number;
  poemId: number;
  createdAt: string;
}

export interface Favorite {
  id: number;
  userId: number;
  poemId: number;
  createdAt: string;
}

export interface Comment {
  id: number;
  userId: number;
  poemId: number;
  content: string;
  createdAt: string;
  author?: User;
}

export interface Reminder {
  id: number;
  userId: number;
  reminderTime: string;
  isEnabled: boolean;
  timezone: string;
  createdAt: string;
}

export interface MeterCheckResult {
  isValid: boolean;
  charResults: {
    char: string;
    position: number;
    expectedTone: '平' | '仄' | '中';
    actualTone: '平' | '仄' | '未知';
    isCorrect: boolean;
    suggestion?: string;
  }[];
  rhymeResults: {
    lineIndex: number;
    char: string;
    expectedRhyme: string;
    actualRhyme: string;
    isCorrect: boolean;
    suggestion?: string;
  }[];
  suggestions: string[];
}

export interface MonthlyReport {
  month: string;
  totalPoems: number;
  genreDistribution: { genre: string; count: number }[];
  popularityRank: { poem: Poem; score: number }[];
  totalAudioDuration: number;
  creationTrend: { date: string; count: number }[];
  interactionStats: {
    totalLikes: number;
    totalComments: number;
    totalFavorites: number;
    totalViews: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface CreatePoemRequest {
  title: string;
  content: string;
  genre: string;
  categoryId?: number;
  tonePattern?: string;
  rhymePattern?: string;
}

export interface UpdatePoemRequest {
  title?: string;
  content?: string;
  genre?: string;
  categoryId?: number;
  isShared?: boolean;
}

export interface AudioUploadResponse {
  audioUrl: string;
  audioDuration: number;
  waveformData: number[];
}
