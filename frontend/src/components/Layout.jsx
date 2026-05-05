import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, MessageSquare, Ticket, BarChart3, Settings, 
  LogOut, Sun, Moon, Sparkles 
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/chats', label: 'Conversations', icon: MessageSquare },
  { path: '/tickets', label: 'Support Queue', icon: Ticket },
  { path: '/analytics', label: 'Intelligence', icon: BarChart3 },
  { path: '/settings', label: 'Workspace', icon: Settings },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-brand-surface-light dark:bg-brand-dark overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-brand-surface-dark border-r border-slate-200 dark:border-brand-border-dark flex flex-col shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
               <Sparkles size={18} fill="currentColor" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Copilot
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="px-4 mb-4">
            <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Main Menu</p>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
                        isActive 
                          ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-brand-border-dark space-y-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400 border border-slate-200 dark:border-white/5">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate capitalize">{user?.role}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 dark:bg-brand-dark">
        <div className="h-full overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
