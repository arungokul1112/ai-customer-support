import React, { useState, useEffect } from 'react';
import { ticketAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Filter, Search, Tag, AlertCircle, CheckCircle, Clock, MoreVertical, Loader2 } from 'lucide-react';

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
      case 'high': return 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100 dark:border-rose-500/20';
      case 'medium': return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
      default: return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full transition-colors">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Queue Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Lifecycle tracking and request orchestration</p>
        </div>
        
        {stats && (
          <div className="flex gap-4">
            <div className="glass-card px-5 py-4 rounded-2xl min-w-[100px]">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active</p>
               <p className="text-xl font-black text-slate-900 dark:text-white">{stats.byStatus.open}</p>
            </div>
            <div className="glass-card px-5 py-4 rounded-2xl min-w-[100px]">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">In Review</p>
               <p className="text-xl font-black text-amber-600 dark:text-amber-400">{stats.byStatus.in_progress}</p>
            </div>
            <div className="glass-card px-5 py-4 rounded-2xl min-w-[100px]">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resolved</p>
               <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.byStatus.resolved}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-brand-surface-dark p-4 rounded-3xl border border-slate-200 dark:border-brand-border-dark shadow-sm">
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mr-2">
           <Filter size={18}/>
           <span className="text-[11px] font-bold uppercase tracking-widest">Filter Set</span>
        </div>
        
        <select 
          className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-brand-border-dark text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          value={filter.status}
          onChange={e => setFilter({...filter, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          <option value="open">Open Requests</option>
          <option value="in_progress">In Analysis</option>
          <option value="resolved">Resolved</option>
        </select>

        <select 
          className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-brand-border-dark text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          value={filter.priority}
          onChange={e => setFilter({...filter, priority: e.target.value})}
        >
          <option value="">All Priorities</option>
          <option value="high">Critical Only</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Standard Priority</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-brand-surface-dark rounded-[2rem] border border-slate-200 dark:border-brand-border-dark overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-widest font-black">
                <th className="px-8 py-5">Reference</th>
                <th className="px-8 py-5">Context</th>
                <th className="px-8 py-5">Priority</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-brand-border-dark">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin text-primary-500 mx-auto mb-2" size={24} />
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Synchronizing Queue...</p>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                    No matching records found
                  </td>
                </tr>
              ) : tickets.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-5 font-mono text-[11px] text-slate-400">#{t.id.slice(0,6)}</td>
                  <td className="px-8 py-5">
                    <p className="text-slate-900 dark:text-white font-bold text-sm">{t.title || 'Support Session'}</p>
                    <div className="flex items-center gap-2 mt-1.5 opacity-60">
                      <Tag size={12} className="text-primary-500"/>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">{t.category}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border tracking-tight ${getPriorityColor(t.priority)}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                      {getStatusIcon(t.status)}
                      <span className="capitalize">{t.status.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-3">
                      {t.status !== 'resolved' ? (
                        <>
                          {t.status === 'open' && (
                            <button 
                              onClick={() => updateStatus(t.id, 'in_progress')}
                              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-[11px] font-bold uppercase transition-all"
                            >
                              Engage
                            </button>
                          )}
                          <button 
                            onClick={() => updateStatus(t.id, 'resolved')}
                            className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all shadow-sm"
                          >
                            Resolve
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 dark:text-slate-700">
                          <CheckCircle size={16} />
                          <span className="text-[10px] font-bold uppercase">Archived</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Tickets;
