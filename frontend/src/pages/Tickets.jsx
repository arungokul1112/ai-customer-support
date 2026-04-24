import React, { useState, useEffect } from 'react';
import { ticketAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Filter, Search, Tag, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ status: '', priority: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        ticketAPI.getTickets(filter),
        ticketAPI.getStats()
      ]);
      setTickets(ticketsRes.data.data);
      setStats(statsRes.data.data);
    } catch (err) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await ticketAPI.updateTicket(id, { status });
      toast.success('Ticket updated');
      loadData();
    } catch (err) {
      toast.error('Failed to update ticket');
    }
  };

  const getPriorityColor = (p) => {
    switch(p) {
      case 'high': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  const getStatusIcon = (s) => {
    switch(s) {
      case 'resolved': return <CheckCircle size={14} className="text-emerald-500" />;
      case 'in_progress': return <Clock size={14} className="text-amber-500" />;
      default: return <AlertCircle size={14} className="text-rose-500" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ticket Management</h1>
          <p className="text-slate-400 mt-2">Track and resolve customer issues across all platforms.</p>
        </div>
        
        {stats && (
          <div className="flex gap-4">
            <div className="glass-card px-4 py-2 rounded-xl border border-slate-700/50">
               <p className="text-[10px] font-bold text-slate-500 uppercase">Open</p>
               <p className="text-xl font-bold text-white">{stats.byStatus.open}</p>
            </div>
            <div className="glass-card px-4 py-2 rounded-xl border border-slate-700/50">
               <p className="text-[10px] font-bold text-slate-500 uppercase">In Progress</p>
               <p className="text-xl font-bold text-amber-400">{stats.byStatus.in_progress}</p>
            </div>
            <div className="glass-card px-4 py-2 rounded-xl border border-slate-700/50">
               <p className="text-[10px] font-bold text-slate-500 uppercase">Resolved</p>
               <p className="text-xl font-bold text-emerald-400">{stats.byStatus.resolved}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-slate-400 mr-4">
           <Filter size={18}/>
           <span className="text-sm font-semibold">Filter:</span>
        </div>
        
        <select 
          className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={filter.status}
          onChange={e => setFilter({...filter, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <select 
          className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={filter.priority}
          onChange={e => setFilter({...filter, priority: e.target.value})}
        >
          <option value="">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-widest font-bold">
              <th className="px-6 py-4">Ticket ID</th>
              <th className="px-6 py-4">Subject / Title</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading tickets...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No tickets found matching your filters.</td></tr>
            ) : tickets.map(t => (
              <tr key={t.id} className="hover:bg-slate-700/20 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">#{t.id.slice(0,8)}</td>
                <td className="px-6 py-4">
                  <p className="text-white font-semibold text-sm">{t.title || 'Untitled Ticket'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag size={12} className="text-slate-500"/>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{t.category}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getPriorityColor(t.priority)}`}>
                    {t.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    {getStatusIcon(t.status)}
                    <span className="capitalize">{t.status.replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {t.status !== 'resolved' ? (
                      <>
                        {t.status === 'open' && (
                          <button 
                            onClick={() => updateStatus(t.id, 'in_progress')}
                            className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-3 py-1 rounded text-xs transition-colors"
                          >
                            Start
                          </button>
                        )}
                        <button 
                          onClick={() => updateStatus(t.id, 'resolved')}
                          className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1 rounded text-xs transition-colors"
                        >
                          Resolve
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-600 italic">No actions</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Tickets;
