import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Search, Filter, Plus, Trash2, Edit2, Share2, Eye } from 'lucide-react';
import { api } from '../utils/api';
import { Poem, Category } from '../../shared/types.js';
import Empty from '../components/Empty';
import { cn } from '../lib/utils';

export default function Works() {
  const navigate = useNavigate();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [filteredPoems, setFilteredPoems] = useState<Poem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [poemsRes, categoriesRes] = await Promise.all([
          api.poems.getMy(),
          api.categories.getAll(),
        ]);
        if (poemsRes.success && poemsRes.data) {
          setPoems(poemsRes.data);
          setFilteredPoems(poemsRes.data);
        }
        if (categoriesRes.success && categoriesRes.data) {
          setCategories(categoriesRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = poems;
    if (searchQuery) {
      filtered = filtered.filter(
        p => p.title.includes(searchQuery) || p.content.includes(searchQuery)
      );
    }
    if (selectedGenre) {
      filtered = filtered.filter(p => p.genre === selectedGenre);
    }
    setFilteredPoems(filtered);
  }, [searchQuery, selectedGenre, poems]);

  const handleDelete = async (id: number) => {
    const res = await api.poems.delete(id);
    if (res.success) {
      setPoems(prev => prev.filter(p => p.id !== id));
      setDeleteConfirm(null);
    }
  };

  const handleShare = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await api.poems.share(id);
    if (res.success && res.data) {
      setPoems(prev => prev.map(p => p.id === id ? { ...p, isShared: res.data!.isShared } : p));
    }
  };

  const genreCounts = categories.map(cat => ({
    ...cat,
    count: poems.filter(p => p.genre === cat.name).length,
  }));

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4a7c59] to-[#2d5a3d] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-serif">我的作品库</h1>
              <p className="text-gray-400">共 {poems.length} 首诗作</p>
            </div>
          </div>
          <Link
            to="/create"
            className="px-6 py-3 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-lg text-white font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-[#e94560]/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            创作新诗
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索作品标题或内容..."
              className="w-full pl-12 pr-4 py-3 bg-[#f5f0e1]/10 border border-[#f5f0e1]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e94560] transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-3 bg-[#f5f0e1]/10 border border-[#f5f0e1]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#e94560] transition-all appearance-none pr-10"
            >
              <option value="">全部体裁</option>
              {genreCounts.filter(c => c.count > 0).map(cat => (
                <option key={cat.id} value={cat.name} className="bg-[#1a1a2e]">
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {genreCounts.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setSelectedGenre(selectedGenre === cat.name ? '' : cat.name)}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all',
                selectedGenre === cat.name
                  ? 'bg-[#e94560]/20 border-[#e94560]'
                  : 'bg-[#f5f0e1]/5 border-[#f5f0e1]/10 hover:border-[#e94560]/30'
              )}
            >
              <div className="text-2xl font-bold text-white mb-1">{cat.count}</div>
              <div className={cn(
                'text-sm',
                selectedGenre === cat.name ? 'text-[#e94560]' : 'text-gray-400'
              )}>
                {cat.name}
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-56 bg-[#f5f0e1]/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredPoems.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {filteredPoems.map((poem) => (
              <div
                key={poem.id}
                className="relative bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10 hover:border-[#e94560]/30 transition-all group"
              >
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/works/${poem.id}/edit`);
                    }}
                    className="p-2 rounded-lg bg-[#f5f0e1]/10 text-gray-400 hover:text-white hover:bg-[#f5f0e1]/20 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleShare(poem.id, e)}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      poem.isShared
                        ? 'bg-[#4a7c59]/20 text-[#4a7c59]'
                        : 'bg-[#f5f0e1]/10 text-gray-400 hover:text-white hover:bg-[#f5f0e1]/20'
                    )}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(poem.id);
                    }}
                    className="p-2 rounded-lg bg-[#f5f0e1]/10 text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div
                  onClick={() => navigate(`/works/${poem.id}`)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4 pr-20">
                    <div>
                      <h3 className="text-xl font-bold text-white font-serif mb-2 group-hover:text-[#e94560] transition-colors">
                        {poem.title}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#4a7c59]/20 text-[#4a7c59] text-xs">
                          {poem.genre}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {new Date(poem.createdAt).toLocaleDateString()}
                        </span>
                        {poem.isShared && (
                          <span className="px-2 py-0.5 rounded-full bg-[#e94560]/20 text-[#e94560] text-xs">
                            已分享
                          </span>
                        )}
                        {poem.isApproved && (
                          <span className="px-2 py-0.5 rounded-full bg-[#4a7c59]/20 text-[#4a7c59] text-xs">
                            已审核
                          </span>
                        )}
                        {!poem.isApproved && poem.isShared && (
                          <span className="px-2 py-0.5 rounded-full bg-[#f5d742]/20 text-[#f5d742] text-xs">
                            审核中
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-300 font-serif leading-relaxed line-clamp-4 mb-4 whitespace-pre-line">
                    {poem.content}
                  </p>

                  <div className="flex items-center gap-6 pt-4 border-t border-[#f5f0e1]/10 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>{poem.viewsCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#e94560]">
                      <span className="w-4 h-4 flex items-center justify-center">♥</span>
                      <span>{poem.likesCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 flex items-center justify-center">💬</span>
                      <span>{poem.commentsCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 flex items-center justify-center">⭐</span>
                      <span>{poem.favoritesCount}</span>
                    </div>
                    {poem.audioUrl && (
                      <div className="flex items-center gap-1.5 text-[#4a7c59] ml-auto">
                        <span className="w-4 h-4 flex items-center justify-center">🎵</span>
                        <span>有朗读</span>
                      </div>
                    )}
                  </div>
                </div>

                {deleteConfirm === poem.id && (
                  <div className="absolute inset-0 bg-[#1a1a2e]/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                    <div className="text-center p-6">
                      <p className="text-white font-medium mb-4">确定要删除这首诗吗？</p>
                      <p className="text-gray-400 text-sm mb-6">删除后无法恢复</p>
                      <div className="flex items-center gap-4 justify-center">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-6 py-2 bg-[#f5f0e1]/10 rounded-lg text-gray-300 hover:bg-[#f5f0e1]/20 transition-all"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleDelete(poem.id)}
                          className="px-6 py-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-all"
                        >
                          确认删除
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty
            icon={BookOpen}
            title={searchQuery || selectedGenre ? '没有找到匹配的作品' : '暂无作品'}
            description={searchQuery || selectedGenre ? '尝试其他搜索条件' : '点击右上角按钮开始创作你的第一首诗'}
          />
        )}
      </div>
    </div>
  );
}
