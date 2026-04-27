import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Shield, Mail, Trash2, ShieldCheck, User as UserIcon, Loader2 } from 'lucide-react';
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
      <div className="flex-1 flex items-center justify-center bg-slate-900 p-8">
        <div className="glass-card p-12 rounded-[2.5rem] text-center max-w-md">
           <Shield className="mx-auto text-rose-500 mb-6" size={64} />
           <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Access Denied</h2>
           <p className="text-slate-400">You must have administrative privileges to access system settings and manage agents.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">System <span className="text-indigo-500">Settings</span></h1>
            <p className="text-slate-400 mt-2">Manage your support ecosystem and agent credentials.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            <UserPlus size={18} /> Provision Agent
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="glass-card rounded-[2rem] p-8 border border-white/5 hover:bg-white/[0.03] transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ShieldCheck size={24} className="text-indigo-500/20" />
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-indigo-400">
                    <UserIcon size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white truncate w-40">{agent.name}</h3>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                      {agent.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Mail size={14} />
                    <span className="truncate">{agent.email}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                   <p className="text-[10px] font-bold text-slate-500 uppercase">Registered {new Date(agent.createdAt).toLocaleDateString()}</p>
                   {agent.id !== currentUser.id && (
                     <button className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                        <Trash2 size={16} />
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Provisioning Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-page-enter">
              <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Provision <span className="text-indigo-500 text-stroke">New Agent</span></h2>
              <form onSubmit={handleAddAgent} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    placeholder="Agent Name"
                    value={newAgent.name}
                    onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Work Email</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    placeholder="email@company.com"
                    value={newAgent.email}
                    onChange={e => setNewAgent({...newAgent, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Password</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    placeholder="••••••••"
                    value={newAgent.password}
                    onChange={e => setNewAgent({...newAgent, password: e.target.value})}
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                  >
                    Deploy Access
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;
