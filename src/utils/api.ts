import { getAuthHeaders } from '../store/useAuthStore';
import { Poem, ApiResponse, MeterCheckResult, Comment, MonthlyReport, Category } from '../../shared/types.js';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  return res.json();
}

export const api = {
  poems: {
    check: (content: string, genre: string) =>
      request<MeterCheckResult>('/poems/check', {
        method: 'POST',
        body: JSON.stringify({ content, genre }),
      }),
    create: (data: { title: string; content: string; genre: string; categoryId?: number }) =>
      request<Poem>('/poems', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMy: (genre?: string) =>
      request<Poem[]>(`/poems${genre ? `?genre=${encodeURIComponent(genre)}` : ''}`),
    getById: (id: number) => request<Poem>(`/poems/${id}`),
    update: (id: number, data: any) =>
      request<Poem>(`/poems/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<null>(`/poems/${id}`, { method: 'DELETE' }),
    share: (id: number) =>
      request<Poem>(`/poems/${id}/share`, { method: 'POST' }),
    uploadAudio: (id: number, formData: FormData) =>
      request<any>(`/poems/${id}/audio`, {
        method: 'POST',
        body: formData,
        headers: {},
      }),
  },
  community: {
    getHot: (limit = 10) => request<Poem[]>(`/community/hot?limit=${limit}`),
    getList: (genre?: string, sortBy: 'hot' | 'latest' = 'hot') =>
      request<Poem[]>(`/community${genre ? `?genre=${encodeURIComponent(genre)}&sortBy=${sortBy}` : `?sortBy=${sortBy}`}`),
    getDetail: (id: number) => request<Poem & { liked: boolean; favorited: boolean }>(`/community/${id}`),
    like: (id: number) =>
      request<{ liked: boolean; likesCount: number }>(`/community/${id}/like`, { method: 'POST' }),
    favorite: (id: number) =>
      request<{ favorited: boolean; favoritesCount: number }>(`/community/${id}/favorite`, { method: 'POST' }),
    getComments: (id: number) => request<Comment[]>(`/community/${id}/comments`),
    addComment: (id: number, content: string) =>
      request<Comment>(`/community/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  },
  report: {
    getMonthly: (month?: string) =>
      request<MonthlyReport>(`/report/monthly${month ? `?month=${month}` : ''}`),
  },
  categories: {
    getAll: () => request<Category[]>('/categories'),
  },
  admin: {
    getPending: () => request<Poem[]>('/admin/poems/pending'),
    approve: (id: number) =>
      request<Poem>(`/admin/poems/${id}/approve`, { method: 'PUT' }),
    reject: (id: number) =>
      request<null>(`/admin/poems/${id}/reject`, { method: 'PUT' }),
    getCategories: () => request<Category[]>('/admin/categories'),
    createCategory: (data: { name: string; description?: string }) =>
      request<Category>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateCategory: (id: number, data: any) =>
      request<Category>(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteCategory: (id: number) =>
      request<null>(`/admin/categories/${id}`, { method: 'DELETE' }),
  },
  auth: {
    getProfile: () => request<any>('/auth/profile'),
    getReminder: () => request<any>('/auth/reminder'),
    updateReminder: (data: any) =>
      request<any>('/auth/reminder', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};
