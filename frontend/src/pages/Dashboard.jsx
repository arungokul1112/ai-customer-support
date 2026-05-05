import React, { useEffect, useState } from 'react';
import { chatAPI, ticketAPI, analyticsAPI } from '../services/api';
import { MessageSquare, Ticket as TicketIcon, Sparkles, AlertCircle, Loader2, ArrowUpRight } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, color, delay }) => (
  <div className="glass-card p-6 rounded-3xl flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors`} style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={24} />
      </div>
      <div className="text-slate-300 dark:text-slate-600 group-hover:text-primary-500 transition-colors">
        <ArrowUpRight size={18} />
      </div>
    </div>
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeChats: 0,
    openTickets: 0,
    sentiment: { happy: 0, neutral: 0, angry: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [chatsRes, ticketsRes, sentimentRes] = await Promise.all([
          chatAPI.getChats({ status: 'open', limit: 1 }),
          ticketAPI.getStats(),
          analyticsAPI.getSentiment()
        ]);
        
        const sentimentData = sentimentRes.data.data.reduce((acc, curr) => {
          acc[curr.sentiment] = curr.count;
          return acc;
        }, { happy: 0, neutral: 0, angry: 0 });

        setStats({
          activeChats: chatsRes.data.pagination.total,
          openTickets: ticketsRes.data.data.byStatus.open,
          sentiment: sentimentData
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary-500" size={32} />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading System State</p>
      </div>
    );
  }

  const totalSentiment = (stats.sentiment.happy || 0) + (stats.sentiment.neutral || 0) + (stats.sentiment.angry || 0) || 1;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary-600" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Overview</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">System metrics and customer intelligence at a glance</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={MessageSquare} title="Active Sessions" value={stats.activeChats} color="#8b5cf6" />
        <StatCard icon={TicketIcon} title="Queue Volume" value={stats.openTickets} color="#f59e0b" />
        <StatCard icon={AlertCircle} title="Negative Sentiment" value={stats.sentiment.angry || 0} color="#f43f5e" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Sentiment Distribution</h3>
             <span className="px-3 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold rounded-full uppercase">Real-time</span>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                <span className="text-slate-500 dark:text-slate-400">Satisfied</span>
                <span className="text-emerald-600 dark:text-emerald-400">{Math.round((stats.sentiment.happy / totalSentiment) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${(stats.sentiment.happy / totalSentiment) * 100}%` }}></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                <span className="text-slate-500 dark:text-slate-400">Neutral</span>
                <span className="text-slate-400 dark:text-slate-500">{Math.round((stats.sentiment.neutral / totalSentiment) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2">
                <div className="bg-slate-400 dark:bg-white/20 h-2 rounded-full transition-all duration-1000" style={{ width: `${(stats.sentiment.neutral / totalSentiment) * 100}%` }}></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                <span className="text-slate-500 dark:text-slate-400">Frustrated</span>
                <span className="text-rose-600 dark:text-rose-400">{Math.round((stats.sentiment.angry / totalSentiment) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2">
                <div className="bg-rose-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${(stats.sentiment.angry / totalSentiment) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
