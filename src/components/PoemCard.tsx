import React from 'react';
import { Heart, MessageCircle, Bookmark, Eye, Clock, Mic } from 'lucide-react';
import { Poem } from '../../shared/types.js';
import { formatDate } from '../utils/pdf.js';
import { cn } from '../lib/utils';

interface PoemCardProps {
  poem: Poem;
  onLike?: (e: React.MouseEvent) => void | Promise<void>;
  onFavorite?: (e: React.MouseEvent) => void | Promise<void>;
  onClick?: () => void;
  liked?: boolean;
  favorited?: boolean;
  showActions?: boolean;
  className?: string;
}

export default function PoemCard({ poem, onLike, onFavorite, onClick, liked, favorited, showActions = true, className }: PoemCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10 hover:border-[#e94560]/30 transition-all duration-500 cursor-pointer overflow-hidden',
        className
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#e94560]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white font-serif mb-1 group-hover:text-[#e94560] transition-colors">
              {poem.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="px-2 py-0.5 rounded-full bg-[#4a7c59]/20 text-[#4a7c59] text-xs">
                {poem.genre}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(poem.createdAt)}
              </span>
              {poem.author && (
                <span className="text-gray-500">@{poem.author.username}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-300 leading-relaxed font-serif line-clamp-4 whitespace-pre-line">
            {poem.content}
          </p>
        </div>

        {poem.audioUrl && (
          <div className="flex items-center gap-2 mb-4 text-[#4a7c59]">
            <Mic className="w-4 h-4" />
            <span className="text-sm">
              已录制朗读 {Math.floor(poem.audioDuration! / 60)}分{poem.audioDuration! % 60}秒
            </span>
          </div>
        )}

        {showActions && (
          <div className="flex items-center gap-4 pt-4 border-t border-[#f5f0e1]/10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike?.(e);
              }}
              className={cn(
                'flex items-center gap-1.5 transition-all',
                liked ? 'text-[#e94560]' : 'text-gray-400 hover:text-[#e94560]'
              )}
            >
              <Heart className={cn('w-4 h-4', liked && 'fill-current')} />
              <span className="text-sm">{poem.likesCount}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite?.(e);
              }}
              className={cn(
                'flex items-center gap-1.5 transition-all',
                favorited ? 'text-[#f5d742]' : 'text-gray-400 hover:text-[#f5d742]'
              )}
            >
              <Bookmark className={cn('w-4 h-4', favorited && 'fill-current')} />
              <span className="text-sm">{poem.favoritesCount}</span>
            </button>

            <div className="flex items-center gap-1.5 text-gray-400">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{poem.commentsCount}</span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-400 ml-auto">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{poem.viewsCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
