import React from 'react';
import { LucideIcon, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
}

export default function Empty({ 
  icon: Icon = BookOpen, 
  title = '暂无数据', 
  description = '还没有任何内容',
  className 
}: EmptyProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 text-center',
      className
    )}>
      <div className="w-20 h-20 rounded-full bg-[#f5f0e1]/10 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-gray-500" />
      </div>
      <h3 className="text-xl font-bold text-white font-serif mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm">{description}</p>
    </div>
  );
}
