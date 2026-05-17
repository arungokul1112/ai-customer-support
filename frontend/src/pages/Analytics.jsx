import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { BarChart3, TrendingUp, Users, PieChart as PieChartIcon, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    sentiment: [],
    categories: [],
    agents: [],
    volume: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sentiment, categories, agents, volume] = await Promise.all([
        analyticsAPI.getSentiment(),
        analyticsAPI.getCategories(),
        analyticsAPI.getAgents(),
        analyticsAPI.getVolume()
      ]);

      setData({
        sentiment: sentiment.data.data,
        categories: categories.data.data,
        agents: agents.data.data,
        volume: volume.data.data
      });
    } catch (err) {
      toast.error('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const COLORS = ['#6366f1', '#14b8a6', '#f43f5e', '#f59e0b', '#06b6d4'];

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary-500" size={32} />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Processing Neural Data</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full transition-colors">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary-600" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Intelligence Hub</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Deep insight into support operations and customer experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Sentiment Trends */}
        <div className="glass-card rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Sentiment Evolution</h3>
             <span className="px-3 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold rounded-full uppercase">Neural Scan</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.sentiment}>
                <defs>
                  <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-white/5" vertical={false} />
                <XAxis dataKey="sentiment" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--tw-bg-opacity)', background: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorTeal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ticket Categories */}
        <div className="glass-card rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Context Allocation</h3>
             <span className="px-3 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold rounded-full uppercase">Queue Stats</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={10}
                  dataKey="count"
                  nameKey="category"
                  stroke="none"
                >
                  {data.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent Performance */}
        <div className="glass-card rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Unit Throughput</h3>
             <span className="px-3 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold rounded-full uppercase">Active Ops</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.agents}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-white/5" vertical={false} />
                <XAxis dataKey="agentName" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.02)'}}
                  contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="resolved" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Volume */}
        <div className="glass-card rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Activity Pulse</h3>
             <span className="px-3 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold rounded-full uppercase">Real-time</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-white/5" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={4} dot={{ r: 5, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
