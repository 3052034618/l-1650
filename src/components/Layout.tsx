import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Feather, BookOpen, Users, BarChart3, Settings, LogOut, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuthStore();

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/create', icon: Feather, label: '创作' },
    { path: '/works', icon: BookOpen, label: '作品库' },
    { path: '/community', icon: Users, label: '社区' },
    { path: '/report', icon: BarChart3, label: '报告' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated && !['/login', '/register'].includes(location.pathname)) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNWYwZTEiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0tOCAwaC0ydi00aDJ2NHptLTggMGgtMnYtNGgydjR6bTE2LTZoLTJ2LTRoMnY0em0tOCAwaC0ydi00aDJ2NHptLTggMGgtMnYtNGgydjR6bTE2LTZoLTJ2LTRoMnY0em0tOCAwaC0ydi00aDJ2NHptLTggMGgtMnYtNGgydjR6Ii8+PC9nPjwvZz48L3N2Zz4=')]"></div>
      </div>

      {isAuthenticated && (
        <nav className="fixed left-0 top-0 h-full w-64 bg-[#0f0f1a]/80 backdrop-blur-xl border-r border-[#e94560]/20 z-50">
          <div className="p-6">
            <Link to="/" className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center">
                <Feather className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-serif">诗韵</h1>
                <p className="text-xs text-gray-400">个人诗歌创作平台</p>
              </div>
            </Link>

            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300',
                      isActive
                        ? 'bg-gradient-to-r from-[#e94560]/20 to-transparent text-[#e94560] border-l-2 border-[#e94560]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {user?.role === 'admin' && (
              <div className="mt-8 pt-6 border-t border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-4">管理后台</p>
                <Link
                  to="/admin"
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300',
                    location.pathname.startsWith('/admin')
                      ? 'bg-gradient-to-r from-[#4a7c59]/20 to-transparent text-[#4a7c59] border-l-2 border-[#4a7c59]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">管理中心</span>
                </Link>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4a7c59] to-[#2d5a3d] flex items-center justify-center">
                <span className="text-white font-bold">{user?.username?.[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user?.username}</p>
                <p className="text-xs text-gray-400">{user?.role === 'admin' ? '管理员' : '普通用户'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">退出登录</span>
            </button>
          </div>
        </nav>
      )}

      <main className={cn(
        'min-h-screen transition-all duration-300',
        isAuthenticated ? 'ml-64' : ''
      )}>
        {children}
      </main>
    </div>
  );
}
