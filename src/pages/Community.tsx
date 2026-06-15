import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Clock, Filter, Search, Award, Flame, AlertCircle, X, Mic } from 'lucide-react';
import { api } from '../utils/api';
import { Poem, Category } from '../../shared/types.js';
import PoemCard from '../components/PoemCard';
import Empty from '../components/Empty';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';

export default function Community() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [poems, setPoems] = useState<(Poem & { liked?: boolean; favorited?: boolean })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [sortBy, setSortBy] = useState<'hot' | 'latest'>('hot');
  const [hasAudioFilter, setHasAudioFilter] = useState<boolean | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [hotPoems, setHotPoems] = useState<Poem[]>([]);
  const [hotPoemsLoading, setHotPoemsLoading] = useState(true);

  const showActionError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 3000);
  };

  const handleActionError = (errorMsg: string | undefined, defaultMsg: string, poemId?: number) => {
    const msg = errorMsg || defaultMsg;
    showActionError(msg);
    
    if ((msg.includes('不存在') || msg.includes('已被删除')) && poemId) {
      setTimeout(() => {
        setPoems(prev => prev.filter(p => p.id !== poemId));
      }, 1500);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await api.categories.getAll();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchPoems = async () => {
      setLoading(true);
      try {
        const res = await api.community.getList(selectedGenre || undefined, sortBy, hasAudioFilter);
        if (res.success && res.data) {
          setPoems(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch poems:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPoems();
  }, [selectedGenre, sortBy, hasAudioFilter]);

  useEffect(() => {
    const fetchHotPoems = async () => {
      setHotPoemsLoading(true);
      try {
        const res = await api.community.getHot(3, hasAudioFilter);
        if (res.success && res.data) {
          setHotPoems(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch hot poems:', error);
      } finally {
        setHotPoemsLoading(false);
      }
    };
    fetchHotPoems();
  }, [hasAudioFilter]);

  const handleLike = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showActionError('请先登录后再点赞');
      return;
    }
    const poem = poems.find(p => p.id === id);
    if (!poem) {
      showActionError('作品不存在或已被删除');
      return;
    }
    if (!poem.isShared || !poem.isApproved) {
      showActionError('该作品尚未公开，无法点赞');
      return;
    }
    const res = await api.community.like(id);
    if (res.success && res.data) {
      setPoems(prev => prev.map(p => 
        p.id === id 
          ? { ...p, liked: res.data!.liked, likesCount: res.data!.likesCount }
          : p
      ));
    } else {
      handleActionError(res.errors?.[0], '点赞失败，请稍后再试', id);
    }
  };

  const handleFavorite = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showActionError('请先登录后再收藏');
      return;
    }
    const poem = poems.find(p => p.id === id);
    if (!poem) {
      showActionError('作品不存在或已被删除');
      return;
    }
    if (!poem.isShared || !poem.isApproved) {
      showActionError('该作品尚未公开，无法收藏');
      return;
    }
    const res = await api.community.favorite(id);
    if (res.success && res.data) {
      setPoems(prev => prev.map(p => 
        p.id === id 
          ? { ...p, favorited: res.data!.favorited, favoritesCount: res.data!.favoritesCount }
          : p
      ));
    } else {
      handleActionError(res.errors?.[0], '收藏失败，请稍后再试', id);
    }
  };

  const filteredPoems = poems.filter(p => 
    !searchQuery || 
    p.title.includes(searchQuery) || 
    p.content.includes(searchQuery) ||
    p.author?.username?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen p-8 relative">
      {actionError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[slideDown_0.3s_ease-out]">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9b59b6] to-[#8e44ad] flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-serif">诗韵社区</h1>
              <p className="text-gray-400">与诗友共赏佳作</p>
            </div>
          </div>
        </div>

        {hotPoemsLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-[#f5f0e1]/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : hotPoems.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {hotPoems.map((poem, index) => (
              <div
                key={poem.id}
                onClick={() => navigate(`/community/${poem.id}`)}
                className={cn(
                  'relative bg-gradient-to-br p-6 rounded-2xl border cursor-pointer transition-all hover:scale-105',
                  index === 0 
                    ? 'from-[#f5d742]/20 to-[#e5c400]/10 border-[#f5d742]/30'
                    : index === 1
                      ? 'from-[#bdc3c7]/20 to-[#95a5a6]/10 border-[#bdc3c7]/30'
                      : 'from-[#e67e22]/20 to-[#d35400]/10 border-[#e67e22]/30'
                )}
              >
                <div className="absolute top-4 right-4">
                  <Award className={cn(
                    'w-8 h-8',
                    index === 0 ? 'text-[#f5d742]' : index === 1 ? 'text-[#bdc3c7]' : 'text-[#e67e22]'
                  )} />
                </div>
                <div className="text-sm text-gray-400 mb-2">热度榜第 {index + 1} 名</div>
                <h3 className="text-xl font-bold text-white font-serif mb-2 line-clamp-1">{poem.title}</h3>
                <p className="text-gray-400 text-sm mb-2">@{poem.author?.username}</p>
                <p className="text-gray-300 font-serif line-clamp-2 text-sm">{poem.content}</p>
                <div className="flex items-center gap-4 mt-4 text-sm flex-wrap">
                  <span className="text-[#e94560]">♥ {poem.likesCount}</span>
                  <span className="text-gray-500">💬 {poem.commentsCount}</span>
                  <span className="text-gray-500">⭐ {poem.favoritesCount}</span>
                  {poem.audioUrl && (
                    <span className="flex items-center gap-1 text-[#4a7c59] px-2 py-0.5 bg-[#4a7c59]/10 rounded-full text-xs">
                      <Mic className="w-3 h-3" />
                      {Math.floor((poem.audioDuration || 0) / 60)}分{String((poem.audioDuration || 0) % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-[#f5f0e1]/5 rounded-2xl">
            <p className="text-gray-400">暂无符合条件的热门作品</p>
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索作品、作者..."
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
              {categories.map(cat => (
                <option key={cat.id} value={cat.name} className="bg-[#1a1a2e]">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center bg-[#f5f0e1]/10 rounded-lg p-1">
            <button
              onClick={() => setHasAudioFilter(undefined)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm',
                hasAudioFilter === undefined
                  ? 'bg-[#4a7c59] text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              全部
            </button>
            <button
              onClick={() => setHasAudioFilter(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm',
                hasAudioFilter === true
                  ? 'bg-[#4a7c59] text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Mic className="w-4 h-4" />
              有朗读
            </button>
            <button
              onClick={() => setHasAudioFilter(false)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm',
                hasAudioFilter === false
                  ? 'bg-[#4a7c59] text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              无朗读
            </button>
          </div>
          <div className="flex items-center bg-[#f5f0e1]/10 rounded-lg p-1">
            <button
              onClick={() => setSortBy('hot')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md transition-all',
                sortBy === 'hot'
                  ? 'bg-[#e94560] text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Flame className="w-4 h-4" />
              热门
            </button>
            <button
              onClick={() => setSortBy('latest')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md transition-all',
                sortBy === 'latest'
                  ? 'bg-[#e94560] text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Clock className="w-4 h-4" />
              最新
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-400">
          <TrendingUp className="w-5 h-5" />
          <span>共 {filteredPoems.length} 首作品</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-56 bg-[#f5f0e1]/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredPoems.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {filteredPoems.map(poem => (
              <PoemCard
                key={poem.id}
                poem={poem}
                liked={poem.liked}
                favorited={poem.favorited}
                onLike={(e) => handleLike(poem.id, e)}
                onFavorite={(e) => handleFavorite(poem.id, e)}
                onClick={() => navigate(`/community/${poem.id}`)}
              />
            ))}
          </div>
        ) : (
          <Empty
            icon={Users}
            title={searchQuery || selectedGenre ? '没有找到匹配的作品' : '社区暂无作品'}
            description={searchQuery || selectedGenre ? '尝试其他搜索条件' : '快去创作并分享你的第一首诗吧'}
          />
        )}
      </div>
    </div>
  );
}
