import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Bookmark, Share2, Play, Pause, Clock, Eye, User, Send, Edit2, Trash2, Mic, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { api } from '../utils/api';
import { Poem, Comment } from '../../shared/types.js';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';
import Empty from '../components/Empty';

export default function WorkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [poem, setPoem] = useState<(Poem & { liked?: boolean; favorited?: boolean }) | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const isFromWorks = location.pathname.startsWith('/works');

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setError(null);
        const poemId = parseInt(id);
        
        let poemRes;
        if (isFromWorks) {
          poemRes = await api.poems.getById(poemId);
        } else {
          poemRes = await api.community.getDetail(poemId);
        }

        if (!poemRes.success) {
          setError(poemRes.errors?.[0] || '加载作品失败');
          return;
        }

        if (poemRes.data) {
          setPoem(poemRes.data);
        }

        if (!isFromWorks || (poemRes.data?.isShared && poemRes.data?.isApproved)) {
          const commentsRes = await api.community.getComments(poemId);
          if (commentsRes.success && commentsRes.data) {
            setComments(commentsRes.data);
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        setError(error.message || '网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isFromWorks]);

  const [actionError, setActionError] = useState<string | null>(null);

  const showActionError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 3000);
  };

  const handleActionError = (errorMsg: string | undefined, defaultMsg: string) => {
    const msg = errorMsg || defaultMsg;
    showActionError(msg);
    
    if (msg.includes('不存在') || msg.includes('已被删除')) {
      setTimeout(() => {
        setPoem(null);
        setError(msg);
      }, 1500);
    }
  };

  const handleLike = async () => {
    if (!poem) return;
    if (!user) {
      showActionError('请先登录后再点赞');
      return;
    }
    if (!poem.isShared || !poem.isApproved) {
      showActionError('该作品尚未公开，无法点赞');
      return;
    }
    const res = await api.community.like(poem.id);
    if (res.success && res.data) {
      setPoem(prev => prev ? {
        ...prev,
        liked: res.data!.liked,
        likesCount: res.data!.likesCount,
      } : null);
    } else {
      handleActionError(res.errors?.[0], '点赞失败，请稍后重试');
    }
  };

  const handleFavorite = async () => {
    if (!poem) return;
    if (!user) {
      showActionError('请先登录后再收藏');
      return;
    }
    if (!poem.isShared || !poem.isApproved) {
      showActionError('该作品尚未公开，无法收藏');
      return;
    }
    const res = await api.community.favorite(poem.id);
    if (res.success && res.data) {
      setPoem(prev => prev ? {
        ...prev,
        favorited: res.data!.favorited,
        favoritesCount: res.data!.favoritesCount,
      } : null);
    } else {
      handleActionError(res.errors?.[0], '收藏失败，请稍后重试');
    }
  };

  const handleAddComment = async () => {
    if (!poem || !newComment.trim()) return;
    if (!user) {
      showActionError('请先登录后再评论');
      return;
    }
    if (!poem.isShared || !poem.isApproved) {
      showActionError('该作品尚未公开，无法评论');
      return;
    }
    const res = await api.community.addComment(poem.id, newComment.trim());
    if (res.success && res.data) {
      setComments(prev => [...prev, res.data!]);
      setNewComment('');
      setPoem(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
    } else {
      handleActionError(res.errors?.[0], '评论失败，请稍后重试');
    }
  };

  const handleDelete = async () => {
    if (!poem) return;
    const res = await api.poems.delete(poem.id);
    if (res.success) {
      navigate('/works');
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || audioError) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current || audioError) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(1, percent)) * (duration || poem?.audioDuration || 0);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioError) return;
    setSeeking(true);
    handleSeek(e);
  };

  const handleSeekMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seeking) return;
    handleSeek(e);
  };

  const handleSeekEnd = () => {
    setSeeking(false);
  };

  const isOwner = user?.id === poem?.userId;

  const getStatusBadge = () => {
    if (!poem.isShared) {
      return (
        <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-sm flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          草稿
        </span>
      );
    }
    if (!poem.isApproved) {
      return (
        <span className="px-3 py-1 rounded-full bg-[#f5d742]/20 text-[#f5d742] text-sm flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          审核中
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full bg-[#4a7c59]/20 text-[#4a7c59] text-sm flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5" />
        已发布
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-[#f5f0e1]/5 rounded w-32 mb-8 animate-pulse" />
          <div className="h-96 bg-[#f5f0e1]/5 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </button>
          <Empty
            title="加载失败"
            description={error}
            icon={AlertTriangle}
          />
        </div>
      </div>
    );
  }

  if (!poem) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <Empty title="作品不存在" description="该作品可能已被删除" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {actionError && (
          <div className="fixed top-4 right-4 z-50 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
            {actionError}
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>

        <div className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-8 border border-[#f5f0e1]/10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white font-serif mb-4">{poem.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4a7c59] to-[#2d5a3d] flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-300">
                    {poem.author?.username || user?.username || '匿名'}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#4a7c59]/20 text-[#4a7c59] text-sm">
                  {poem.genre}
                </span>
                {getStatusBadge()}
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(poem.createdAt).toLocaleDateString()}
                </span>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {poem.viewsCount} 次阅读
                </span>
              </div>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/works/${poem.id}/edit`)}
                  className="p-2 rounded-lg bg-[#f5f0e1]/10 text-gray-400 hover:text-white hover:bg-[#f5f0e1]/20 transition-all"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="p-2 rounded-lg bg-[#f5f0e1]/10 text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="text-center py-8 border-y border-[#f5f0e1]/10">
            <div className="text-2xl text-gray-200 font-serif leading-loose whitespace-pre-line">
              {poem.content.split('\n').map((line, i) => (
                <p key={i} className="mb-2">{line}</p>
              ))}
            </div>
          </div>

          {poem.audioUrl && (
            <div className="mt-8 p-6 bg-[#0f0f1a] rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#4a7c59]">
                  <Mic className="w-5 h-5" />
                  <span className="font-medium">朗读音频</span>
                </div>
                {audioError ? (
                  <span className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    音频加载失败
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">
                    {formatTime(duration || poem.audioDuration || 0)}
                  </span>
                )}
              </div>
              
              {audioError ? (
                <div className="flex items-center justify-center gap-3 py-8 text-gray-400">
                  <AlertTriangle className="w-8 h-8 text-red-400/60" />
                  <div>
                    <p className="text-white font-medium">音频文件加载失败</p>
                    <p className="text-sm text-gray-500">文件可能已损坏或被删除，请重新录制或上传</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlay}
                      disabled={audioLoading}
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4a7c59] to-[#2d5a3d] flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {audioLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white ml-1" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div
                        ref={progressRef}
                        className="relative h-12 bg-[#1a1a2e] rounded-lg p-2 cursor-pointer select-none overflow-hidden"
                        onMouseDown={handleSeekStart}
                        onMouseMove={handleSeekMove}
                        onMouseUp={handleSeekEnd}
                        onMouseLeave={handleSeekEnd}
                      >
                        <div className="relative flex items-center gap-1 h-full">
                          {poem.waveformData?.map((value, i) => {
                            const totalDuration = duration || poem.audioDuration || 0;
                            const waveTime = (i / (poem.waveformData?.length || 1)) * totalDuration;
                            const isPlayed = currentTime > waveTime;
                            return (
                              <div
                                key={i}
                                className={cn(
                                  'flex-1 rounded-full transition-colors',
                                  isPlayed ? 'bg-[#4a7c59]' : 'bg-[#4a7c59]/30'
                                )}
                                style={{ height: `${Math.max(12, value * 100)}%` }}
                              />
                            );
                          })}
                        </div>
                        <div
                          className="absolute top-0 left-0 h-full w-1 bg-white/50 rounded-full pointer-events-none"
                          style={{
                            left: `${((currentTime / (duration || poem.audioDuration || 1)) * 100).toFixed(2)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>{formatTime(currentTime)}</span>
                        <span className="text-gray-600">点击或拖动波形调整进度</span>
                        <span>{formatTime(duration || poem.audioDuration || 0)}</span>
                      </div>
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={poem.audioUrl}
                    onLoadStart={() => {
                      setAudioLoading(true);
                      setAudioError(false);
                    }}
                    onCanPlay={() => {
                      setAudioLoading(false);
                      setDuration(audioRef.current?.duration || poem.audioDuration || 0);
                    }}
                    onLoadedMetadata={(e) => {
                      setDuration((e.target as HTMLAudioElement).duration);
                    }}
                    onTimeUpdate={(e) => {
                      if (!seeking) {
                        setCurrentTime((e.target as HTMLAudioElement).currentTime);
                      }
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                      setIsPlaying(false);
                      setCurrentTime(0);
                    }}
                    onError={() => {
                      setAudioError(true);
                      setAudioLoading(false);
                      setIsPlaying(false);
                    }}
                    className="hidden"
                    preload="metadata"
                  />
                </>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#f5f0e1]/10">
            <div className="flex items-center gap-8">
              <button
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-2 transition-all',
                  poem.liked ? 'text-[#e94560]' : 'text-gray-400 hover:text-[#e94560]'
                )}
              >
                <Heart className={cn('w-6 h-6', poem.liked && 'fill-current')} />
                <span className="font-medium">{poem.likesCount}</span>
              </button>
              <button
                onClick={handleFavorite}
                className={cn(
                  'flex items-center gap-2 transition-all',
                  poem.favorited ? 'text-[#f5d742]' : 'text-gray-400 hover:text-[#f5d742]'
                )}
              >
                <Bookmark className={cn('w-6 h-6', poem.favorited && 'fill-current')} />
                <span className="font-medium">{poem.favoritesCount}</span>
              </button>
              <div className="flex items-center gap-2 text-gray-400">
                <MessageCircle className="w-6 h-6" />
                <span className="font-medium">{poem.commentsCount}</span>
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-[#f5f0e1]/10 rounded-lg text-gray-300 hover:bg-[#f5f0e1]/20 transition-all"
            >
              <Share2 className="w-5 h-5" />
              分享
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10">
          <h3 className="text-xl font-bold text-white mb-6">评论 ({comments.length})</h3>
          <div className="flex items-start gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的评论..."
                rows={3}
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-[#f5f0e1]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e94560] transition-all resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAddComment();
                  }
                }}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-lg text-white font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-[#e94560]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  发送评论
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4a7c59] to-[#2d5a3d] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{comment.author?.username?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-white font-medium">{comment.author?.username}</span>
                      <span className="text-gray-500 text-sm">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">暂无评论，快来抢沙发吧</p>
              </div>
            )}
          </div>
        </div>

        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1a1a2e] rounded-2xl p-8 border border-[#f5f0e1]/10 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">确定要删除这首诗吗？</h3>
              <p className="text-gray-400 mb-6">删除后无法恢复，相关的评论和互动数据也将被清除。</p>
              <div className="flex items-center gap-4 justify-end">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-6 py-2 bg-[#f5f0e1]/10 rounded-lg text-gray-300 hover:bg-[#f5f0e1]/20 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-all"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
