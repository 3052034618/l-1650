import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Download, Calendar, BookOpen, Heart, MessageCircle, Eye, Mic, Award, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { api } from '../utils/api';
import { MonthlyReport } from '../../shared/types.js';
import { exportToPDF } from '../utils/pdf';
import { useAuthStore } from '../store/useAuthStore';
import Empty from '../components/Empty';
import { cn } from '../lib/utils';

const COLORS = ['#e94560', '#4a7c59', '#f5d742', '#9b59b6', '#3498db', '#e67e22'];

export default function Report() {
  const { user } = useAuthStore();
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (!selectedMonth) {
      setSelectedMonth(currentMonth);
    }
  }, [currentMonth, selectedMonth]);

  useEffect(() => {
    if (!selectedMonth) return;
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await api.report.getMonthly(selectedMonth);
        if (res.success && res.data) {
          setReport(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [selectedMonth]);

  const handleExportPDF = async () => {
    if (!reportRef.current || !report) return;
    setExporting(true);
    try {
      await exportToPDF(reportRef.current, `${user?.username}_创作报告_${selectedMonth}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(date.toISOString().slice(0, 7));
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="h-12 bg-[#f5f0e1]/5 rounded w-48 mb-8 animate-pulse" />
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-[#f5f0e1]/5 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-80 bg-[#f5f0e1]/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!report || report.totalPoems === 0) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3498db] to-[#2980b9] flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white font-serif">创作报告</h1>
                <p className="text-gray-400">记录你的诗意旅程</p>
              </div>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-3 bg-[#f5f0e1]/10 border border-[#f5f0e1]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#e94560] transition-all"
            >
              {months.map(m => (
                <option key={m} value={m} className="bg-[#1a1a2e]">
                  {m.replace('-', '年')}月
                </option>
              ))}
            </select>
          </div>
          <Empty
            icon={BarChart3}
            title="本月暂无创作数据"
            description="快去创作你的第一首诗吧"
          />
        </div>
      </div>
    );
  }

  const stats = [
    { label: '作品总数', value: report.totalPoems, icon: BookOpen, color: 'from-[#e94560] to-[#ff6b6b]' },
    { label: '获得点赞', value: report.interactionStats.totalLikes, icon: Heart, color: 'from-[#e94560] to-[#ff6b6b]' },
    { label: '收到评论', value: report.interactionStats.totalComments, icon: MessageCircle, color: 'from-[#4a7c59] to-[#2d5a3d]' },
    { label: '被收藏', value: report.interactionStats.totalFavorites, icon: Award, color: 'from-[#f5d742] to-[#e5c400]' },
    { label: '总浏览量', value: report.interactionStats.totalViews, icon: Eye, color: 'from-[#9b59b6] to-[#8e44ad]' },
    { label: '朗读时长', value: `${Math.floor(report.totalAudioDuration / 60)}分${report.totalAudioDuration % 60}秒`, icon: Mic, color: 'from-[#3498db] to-[#2980b9]' },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3498db] to-[#2980b9] flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-serif">创作报告</h1>
              <p className="text-gray-400">记录你的诗意旅程</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-3 bg-[#f5f0e1]/10 border border-[#f5f0e1]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#e94560] transition-all"
              >
                {months.map(m => (
                  <option key={m} value={m} className="bg-[#1a1a2e]">
                    {m.replace('-', '年')}月
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="px-6 py-3 bg-gradient-to-r from-[#4a7c59] to-[#2d5a3d] rounded-lg text-white font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-[#4a7c59]/30 transition-all disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {exporting ? '导出中...' : '导出PDF'}
            </button>
          </div>
        </div>

        <div ref={reportRef}>
          <div className="grid grid-cols-3 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#e94560]" />
                创作趋势
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.creationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                    <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#e94560" strokeWidth={3} dot={{ fill: '#e94560' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#4a7c59]" />
                体裁分布
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report.genreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ genre, percent }) => `${genre} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#888"
                      dataKey="count"
                    >
                      {report.genreDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#f5d742]" />
                互动数据
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: '点赞', value: report.interactionStats.totalLikes },
                    { name: '评论', value: report.interactionStats.totalComments },
                    { name: '收藏', value: report.interactionStats.totalFavorites },
                    { name: '浏览', value: report.interactionStats.totalViews },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                    <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" fill="#f5d742" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#9b59b6]" />
                人气排行
              </h3>
              <div className="space-y-4">
                {report.popularityRank.slice(0, 5).map((item, index) => (
                  <div
                    key={item.poem.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl',
                      index === 0 ? 'bg-[#f5d742]/10 border border-[#f5d742]/30' :
                      index === 1 ? 'bg-[#bdc3c7]/10 border border-[#bdc3c7]/30' :
                      index === 2 ? 'bg-[#e67e22]/10 border border-[#e67e22]/30' :
                      'bg-[#f5f0e1]/5 border border-[#f5f0e1]/10'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold',
                      index === 0 ? 'bg-[#f5d742] text-white' :
                      index === 1 ? 'bg-[#bdc3c7] text-white' :
                      index === 2 ? 'bg-[#e67e22] text-white' :
                      'bg-[#f5f0e1]/20 text-gray-400'
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate font-serif">{item.poem.title}</p>
                      <p className="text-xs text-gray-500">{item.poem.genre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#e94560] font-bold">{item.score} 分</p>
                      <p className="text-xs text-gray-500">
                        ♥{item.poem.likesCount} 💬{item.poem.commentsCount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
