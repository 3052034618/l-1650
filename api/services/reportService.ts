import db from '../db/index.js';
import { MonthlyReport, Poem } from '../../shared/types.js';
import { mapToPoem } from '../repositories/poemRepository.js';
import { DbPoem } from '../repositories/poemRepository.js';

export function generateMonthlyReport(userId: number, month?: string): MonthlyReport {
  const now = new Date();
  const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [year, monthNum] = targetMonth.split('-').map(Number);
  
  const startDate = new Date(year, monthNum - 1, 1).toISOString().slice(0, 10);
  const endDate = new Date(year, monthNum, 0).toISOString().slice(0, 10);

  const poemsStmt = db.prepare(`
    SELECT * FROM poems 
    WHERE user_id = ? AND created_at BETWEEN ? AND ?
    ORDER BY created_at DESC
  `);
  const poems = poemsStmt.all(userId, startDate + ' 00:00:00', endDate + ' 23:59:59') as DbPoem[];
  const mappedPoems = poems.map(p => mapToPoem(p));

  const genreDistribution: { genre: string; count: number }[] = [];
  const genreCounts: Record<string, number> = {};
  poems.forEach(p => {
    genreCounts[p.genre] = (genreCounts[p.genre] || 0) + 1;
  });
  for (const [genre, count] of Object.entries(genreCounts)) {
    genreDistribution.push({ genre, count });
  }

  const popularityRank = mappedPoems
    .map(poem => ({
      poem,
      score: poem.likesCount * 3 + poem.commentsCount * 2 + poem.favoritesCount * 4 + poem.viewsCount,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const totalAudioDuration = poems.reduce((sum, p) => sum + (p.audio_duration || 0), 0);

  const trendStmt = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM poems 
    WHERE user_id = ? AND created_at BETWEEN ? AND ?
    GROUP BY DATE(created_at)
    ORDER BY date
  `);
  const trendData = trendStmt.all(userId, startDate + ' 00:00:00', endDate + ' 23:59:59') as { date: string; count: number }[];
  
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const creationTrend: { date: string; count: number }[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const date = `${year}-${String(monthNum).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dayData = trendData.find(t => t.date === date);
    creationTrend.push({ date, count: dayData?.count || 0 });
  }

  const statsStmt = db.prepare(`
    SELECT 
      COALESCE(SUM(likes_count), 0) as totalLikes,
      COALESCE(SUM(comments_count), 0) as totalComments,
      COALESCE(SUM(favorites_count), 0) as totalFavorites,
      COALESCE(SUM(views_count), 0) as totalViews
    FROM poems 
    WHERE user_id = ? AND created_at BETWEEN ? AND ?
  `);
  const stats = statsStmt.get(userId, startDate + ' 00:00:00', endDate + ' 23:59:59') as {
    totalLikes: number;
    totalComments: number;
    totalFavorites: number;
    totalViews: number;
  };

  return {
    month: targetMonth,
    totalPoems: poems.length,
    genreDistribution,
    popularityRank,
    totalAudioDuration,
    creationTrend,
    interactionStats: stats,
  };
}
