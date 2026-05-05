import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Shield, Mail, Trash2, ShieldCheck, User as UserIcon, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user: currentUser } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', email: '', password: '', role: 'agent' });

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getAgents();
      setAgents(res.data.data);
    } catch (err) {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchAgents();
    }
  }, [currentUser]);

  const handleAddAgent = async (e) => {
    e.preventDefault();
    try {
      await userAPI.createAgent(newAgent);
      toast.success('Agent account created');
      setShowAddModal(false);
      setNewAgent({ name: '', email: '', password: '', role: 'agent' });
      fetchAgents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create agent');
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-brand-dark p-8 transition-colors">
        <div className="bg-slate-50 dark:bg-brand-surface-dark p-12 rounded-[2.5rem] text-center max-w-md border border-slate-200 dark:border-brand-border-dark shadow-premium dark:shadow-premium-dark">
           <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 mx-auto mb-6">
             <Shield size={32} />
           </div>
           <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">Access Denied</h2>
           <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Administrative clearance is required to manage infrastructure agents.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full transition-colors">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Agent Infrastructure</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage system access and specialized support units</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} /> Provision Unit
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanning Registry</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="glass-card rounded-[2rem] p-6 group hover:shadow-premium dark:hover:shadow-premium-dark transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-primary-600">
                  <UserIcon size={22} />
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-tight">
                  {agent.role}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{agent.name}</h3>
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[11px] font-medium mt-1">
                    <Mail size={12} />
                    <span className="truncate">{agent.email}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-brand-border-dark flex justify-between items-center">
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Provisioned {new Date(agent.createdAt).toLocaleDateString()}</p>
                   {agent.id !== currentUser.id && (
                     <button className="p-2 text-slate-300 hover:text-rose-600 dark:text-slate-700 dark:hover:text-rose-500 transition-colors">
                        <Trash2 size={16} />
                     </button>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provisioning Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white dark:bg-brand-surface-dark w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative border border-slate-200 dark:border-brand-border-dark animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tight">New Unit Profile</h2>
            
            <form onSubmit={handleAddAgent} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Identity</label>
                <input 
                  type="text" 
                  required 
                  className="input-field py-3"
                  placeholder="Full Name"
                  value={newAgent.name}
                  onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Network Address</label>
                <input 
                  type="email" 
                  required 
                  className="input-field py-3"
                  placeholder="email@organization.com"
                  value={newAgent.email}
                  onChange={e => setNewAgent({...newAgent, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Access Key</label>
                <input 
                  type="password" 
                  required 
                  className="input-field py-3"
                  placeholder="••••••••"
                  value={newAgent.password}
                  onChange={e => setNewAgent({...newAgent, password: e.target.value})}
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase py-3.5 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 btn-primary text-xs uppercase"
                >
                  Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
