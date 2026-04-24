import React, { useEffect, useState } from 'react';
import { chatAPI, ticketAPI, analyticsAPI } from '../services/api';
import { MessageSquare, Ticket as TicketIcon, BarChart3, AlertCircle } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className="glass-card p-6 rounded-xl flex items-center gap-4 border-l-4" style={{ borderLeftColor: color }}>
    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-900 shadow-inner">
      <Icon size={24} style={{ color }} />
    </div>
    <div>
      <p className="text-sm text-slate-400 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
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

  if (loading) return <div className="p-8 text-center text-slate-400">Loading dashboard...</div>;

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8 text-white">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400">AI Support Overview</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={MessageSquare} title="Active Chats" value={stats.activeChats} color="#06b6d4" />
        <StatCard icon={TicketIcon} title="Open Tickets" value={stats.openTickets} color="#f59e0b" />
        <StatCard icon={AlertCircle} title="Angry Customers" value={stats.sentiment.angry || 0} color="#f43f5e" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Sentiment Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-300">Happy</span>
              <span className="text-emerald-400 font-bold">{stats.sentiment.happy || 0}</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2">
              <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${(stats.sentiment.happy / (stats.sentiment.happy + stats.sentiment.neutral + stats.sentiment.angry || 1)) * 100}%` }}></div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-300">Neutral</span>
              <span className="text-slate-400 font-bold">{stats.sentiment.neutral || 0}</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2">
              <div className="bg-slate-500 h-2 rounded-full" style={{ width: `${(stats.sentiment.neutral / (stats.sentiment.happy + stats.sentiment.neutral + stats.sentiment.angry || 1)) * 100}%` }}></div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-300">Angry</span>
              <span className="text-rose-400 font-bold">{stats.sentiment.angry || 0}</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2">
              <div className="bg-rose-400 h-2 rounded-full" style={{ width: `${(stats.sentiment.angry / (stats.sentiment.happy + stats.sentiment.neutral + stats.sentiment.angry || 1)) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
