import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Feather, TrendingUp, BookOpen, Award, Clock, Sparkles, Bell, BellOff } from 'lucide-react';
import { api } from '../utils/api';
import { Poem, Reminder } from '../../shared/types.js';
import PoemCard from '../components/PoemCard';
import { useAuthStore } from '../store/useAuthStore';
import Empty from '../components/Empty';
import { cn } from '../lib/utils';

const dailyPoems = [
  {
    title: '静夜思',
    author: '李白',
    content: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
    genre: '五言绝句',
  },
  {
    title: '春晓',
    author: '孟浩然',
    content: '春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。',
    genre: '五言绝句',
  },
  {
    title: '登鹳雀楼',
    author: '王之涣',
    content: '白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。',
    genre: '五言绝句',
  },
];

export default function Home() {
  const [hotPoems, setHotPoems] = useState<Poem[]>([]);
  const [myPoems, setMyPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyPoem] = useState(dailyPoems[Math.floor(Math.random() * dailyPoems.length)]);
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises: Promise<any>[] = [
          api.community.getHot(6),
          api.poems.getMy(),
        ];
        
        if (user) {
          promises.push(api.auth.getReminder());
        }

        const [hotRes, myRes, reminderRes] = await Promise.all(promises);
        
        if (hotRes.success && hotRes.data) {
          setHotPoems(hotRes.data);
        }
        if (myRes.success && myRes.data) {
          setMyPoems(myRes.data.slice(0, 3));
        }
        if (reminderRes && reminderRes.success && reminderRes.data) {
          setReminder(reminderRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const stats = [
    { label: '我的作品', value: myPoems.length, icon: BookOpen, color: 'from-[#e94560] to-[#ff6b6b]' },
    { label: '获得点赞', value: myPoems.reduce((sum, p) => sum + p.likesCount, 0), icon: Award, color: 'from-[#4a7c59] to-[#2d5a3d]' },
    { label: '本月创作', value: myPoems.filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth()).length, icon: Feather, color: 'from-[#f5d742] to-[#e5c400]' },
    { label: '社区热门', value: hotPoems.length, icon: TrendingUp, color: 'from-[#9b59b6] to-[#8e44ad]' },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white font-serif mb-2">
              欢迎回来，{user?.username}
            </h1>
            <p className="text-gray-400">今日诗意盎然，何不挥毫泼墨？</p>
          </div>
          <Link
            to="/create"
            className="px-8 py-4 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-xl text-white font-bold text-lg flex items-center gap-3 hover:shadow-xl hover:shadow-[#e94560]/30 transition-all hover:scale-105"
          >
            <Feather className="w-6 h-6" />
            开始创作
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10 hover:border-[#e94560]/30 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-8">
            <div className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-8 border border-[#f5f0e1]/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5d742] to-[#e5c400] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">每日一诗</h2>
                  <p className="text-sm text-gray-400">品味经典，涵养诗心</p>
                </div>
              </div>
              <div className="text-center py-6">
                <h3 className="text-3xl font-bold text-[#e94560] font-serif mb-3">{dailyPoem.title}</h3>
                <p className="text-gray-400 mb-6">—— {dailyPoem.author}</p>
                <div className="text-xl text-gray-200 font-serif leading-loose whitespace-pre-line">
                  {dailyPoem.content}
                </div>
                <div className="mt-6 inline-block px-4 py-1 rounded-full bg-[#4a7c59]/20 text-[#4a7c59] text-sm">
                  {dailyPoem.genre}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">社区热门</h2>
                    <p className="text-sm text-gray-400">最受欢迎的诗作</p>
                  </div>
                </div>
                <Link to="/community" className="text-[#e94560] text-sm hover:underline">
                  查看更多 →
                </Link>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-48 bg-[#f5f0e1]/5 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : hotPoems.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {hotPoems.map(poem => (
                    <PoemCard key={poem.id} poem={poem} showActions={false} />
                  ))}
                </div>
              ) : (
                <Empty description="暂无热门作品" />
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10">
              <div className="flex items-center gap-3 mb-6">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  reminder?.isEnabled 
                    ? 'bg-gradient-to-br from-[#f5d742] to-[#e5c400]' 
                    : 'bg-gradient-to-br from-gray-600 to-gray-700'
                )}>
                  {reminder?.isEnabled ? (
                    <Bell className="w-5 h-5 text-white" />
                  ) : (
                    <BellOff className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">创作提醒</h2>
                  <p className="text-sm text-gray-400">每日坚持，诗意人生</p>
                </div>
              </div>
              {user ? (
                <div className="text-center py-4">
                  <div className={cn(
                    'text-5xl font-bold font-mono mb-2',
                    reminder?.isEnabled ? 'text-[#f5d742]' : 'text-gray-500'
                  )}>
                    {reminder?.reminderTime?.substring(0, 5) || '--:--'}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {reminder?.isEnabled 
                      ? `每天 ${reminder.reminderTime?.substring(0, 5)} 提醒创作` 
                      : '提醒已关闭'}
                  </p>
                  <p className={cn(
                    'text-sm mt-2 flex items-center justify-center gap-1',
                    reminder?.isEnabled ? 'text-[#4a7c59]' : 'text-gray-500'
                  )}>
                    {reminder?.isEnabled ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#4a7c59] animate-pulse" />
                        提醒已开启
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3 h-3" />
                        提醒已关闭
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-3">
                    点击右下角 🔔 图标可修改设置
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-gray-500 font-mono mb-2">--:--</div>
                  <p className="text-gray-400 text-sm">登录后可设置创作提醒</p>
                  <Link 
                    to="/login" 
                    className="inline-block mt-3 px-4 py-2 bg-[#e94560] rounded-lg text-white text-sm hover:bg-[#ff6b6b] transition-colors"
                  >
                    立即登录
                  </Link>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4a7c59] to-[#2d5a3d] flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">我的作品</h2>
                    <p className="text-sm text-gray-400">最近创作</p>
                  </div>
                </div>
                <Link to="/works" className="text-[#e94560] text-sm hover:underline">
                  全部 →
                </Link>
              </div>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-[#f5f0e1]/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : myPoems.length > 0 ? (
                <div className="space-y-4">
                  {myPoems.map(poem => (
                    <Link
                      key={poem.id}
                      to={`/works/${poem.id}`}
                      className="block bg-gradient-to-br from-[#f5f0e1]/5 to-[#f5f0e1]/10 backdrop-blur-sm rounded-xl p-4 border border-[#f5f0e1]/10 hover:border-[#e94560]/30 transition-all"
                    >
                      <h3 className="text-white font-bold font-serif mb-1">{poem.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2 font-serif">{poem.content}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                        <span className="px-2 py-0.5 rounded-full bg-[#4a7c59]/20 text-[#4a7c59]">
                          {poem.genre}
                        </span>
                        <span>{new Date(poem.createdAt).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty description="暂无作品，快去创作吧" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}