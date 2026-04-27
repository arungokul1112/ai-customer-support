import React, { useState, useEffect, useRef } from 'react';
import { chatAPI, ticketAPI, aiAPI } from '../services/api';
import { useSocketContext } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Bot, Send, User as UserIcon, AlertCircle, Plus, MessageSquare } from 'lucide-react';

const ChatView = () => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [sentiment, setSentiment] = useState('neutral');
  const [filter, setFilter] = useState('open'); // 'open' or 'closed'
  const [ticketForm, setTicketForm] = useState({ priority: '', status: '', category: '' });
  
  const { user } = useAuth();
  const { socket } = useSocketContext();
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chats on mount and when filter changes
  useEffect(() => {
    const loadChats = async () => {
      try {
        const res = await chatAPI.getChats({ status: filter });
        setChats(res.data.data);
      } catch (err) {
        toast.error('Failed to load chats');
      }
    };
    loadChats();
  }, [filter]);

  // Join company room for background updates
  useEffect(() => {
    if (socket && user?.companyId) {
      socket.emit('join_company', { companyId: user.companyId });
    }
  }, [socket, user]);

  // Handle Socket events
  useEffect(() => {
    if (!socket) return;
    
    const handleReceiveMessage = (msg) => {
      if (activeChat && msg.chatId === activeChat.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleAiSuggestion = ({ chatId, suggestion, sentiment, category, priority }) => {
      if (activeChat && chatId === activeChat.id) {
        setAiSuggestion(suggestion);
        setSentiment(sentiment);
        if (category) setTicketForm(prev => ({ ...prev, category }));
        if (priority) setTicketForm(prev => ({ ...prev, priority }));
        toast('AI Suggested Updates!', { icon: '🤖' });
      }
    };

    const handleChatUpdated = ({ chatId, sentiment, lastAISuggestion, status, category, priority }) => {
      // Update the chat in the list if it matches the current filter
      setChats((prev) => {
        const index = prev.findIndex(c => c.id === chatId);
        if (status && status !== filter) {
          return prev.filter(c => c.id !== chatId);
        }
        if (index !== -1) {
          return prev.map(c => {
            if (c.id === chatId) {
              const updatedTicket = c.Ticket ? { ...c.Ticket, category: category || c.Ticket.category, priority: priority || c.Ticket.priority } : null;
              return { ...c, sentiment, lastAISuggestion, status: status || c.status, Ticket: updatedTicket };
            }
            return c;
          });
        }
        return prev;
      });

      if (activeChat && chatId === activeChat.id) {
        setSentiment(sentiment);
        setAiSuggestion(lastAISuggestion);
        if (status) setActiveChat(prev => ({ ...prev, status }));
        if (category || priority) {
          setTicketForm(prev => ({
            ...prev,
            category: category || prev.category,
            priority: priority || prev.priority
          }));
        }
      }

      if (sentiment === 'angry') {
        toast(`Urgent: Angry customer in another chat!`, { icon: '⚠️', duration: 4000 });
      }
    };

    const handleNotification = async ({ type, payload }) => {
      if (type === 'new_chat' || type === 'chat_reopened') {
        if (filter === 'open') {
          const res = await chatAPI.getChats({ status: 'open' });
          setChats(res.data.data);
        }
        const message = type === 'new_chat' ? 'New conversation started!' : `Chat with ${payload.customerName} reopened!`;
        toast(message, { icon: '🔔' });
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('ai_suggestion', handleAiSuggestion);
    socket.on('chat_updated', handleChatUpdated);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('ai_suggestion', handleAiSuggestion);
      socket.off('chat_updated', handleChatUpdated);
      socket.off('notification', handleNotification);
    };
  }, [socket, activeChat, filter]);

  const selectChat = async (chat) => {
    try {
      setActiveChat(chat);
      setAiSuggestion(chat.lastAISuggestion || null);
      setAiSummary(null);
      setSentiment(chat.sentiment || 'neutral');
      setTicketForm({
        priority: chat.Ticket?.priority || 'medium',
        status: chat.Ticket?.status || 'open',
        category: chat.Ticket?.category || 'general'
      });
      const res = await chatAPI.getChatById(chat.id);
      setMessages(res.data.data.Messages || []);
      if (socket) {
        socket.emit('join_chat', { chatId: chat.id, userId: user.id });
      }
    } catch (err) {
      toast.error('Failed to load chat messages');
    }
  };

  const createSimulatedChat = async () => {
    try {
      const res = await chatAPI.createChat({ 
        customerName: 'Premium Customer', 
        customerEmail: 'vip@customer.com' 
      });
      const newChat = res.data.data;
      setChats([newChat, ...chats]);
      selectChat(newChat);
      toast.success('New session created');
    } catch (err) {
      toast.error('Failed to create chat');
    }
  };

  const simulateCustomerMessage = async () => {
    if (!activeChat) return;
    const msg = "I'm having a serious issue with my account billing. Please help me resolve this fuck up as soon as possible!";
    if (socket) {
      socket.emit('send_message', {
        chatId: activeChat.id,
        companyId: user.companyId,
        message: msg,
        senderType: 'customer'
      });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeChat || !socket) return;
    socket.emit('send_message', {
      chatId: activeChat.id,
      companyId: user.companyId,
      message: inputMsg,
      senderType: 'agent'
    });
    setInputMsg('');
    setAiSuggestion(null);
  };

  const applySuggestion = () => {
    if (aiSuggestion) setInputMsg(aiSuggestion);
  };

  const updateTicket = async () => {
    if (!activeChat || !activeChat.Ticket) return;
    try {
      const res = await ticketAPI.updateTicket(activeChat.Ticket.id, ticketForm);
      const updatedTicket = res.data.data;
      setActiveChat({ ...activeChat, Ticket: updatedTicket });
      setChats(chats.map(c => c.id === activeChat.id ? { ...c, Ticket: updatedTicket } : c));
      toast.success('Ticket updated');
    } catch (err) {
      toast.error('Failed to update ticket');
    }
  };

  const closeActiveChat = async () => {
    if (!activeChat) return;
    try {
      await chatAPI.closeChat(activeChat.id);
      setChats(chats.filter(c => c.id !== activeChat.id));
      setActiveChat(null);
      setMessages([]);
      toast.success('Chat closed');
    } catch (err) {
      toast.error('Failed to close chat');
    }
  };

  const generateSummary = async () => {
    if (!activeChat) return;
    try {
      setIsSummarizing(true);
      const res = await aiAPI.getSummary(activeChat.id);
      setAiSummary(res.data.data.summary);
      toast.success('Summary Generated');
    } catch (err) {
      toast.error('Failed to generate summary');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-900 overflow-hidden">
      
      {/* 1. Chat List Sidebar */}
      <div className="w-1/4 border-r border-slate-700/30 flex flex-col bg-slate-900/40 backdrop-blur-md">
        <div className="p-5 border-b border-slate-700/30 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gradient">Messages</h2>
          <button onClick={createSimulatedChat} className="bg-primary/10 text-primary hover:bg-primary/20 p-2.5 rounded-xl cursor-pointer transition-all hover:rotate-90" title="New Session">
            <Plus size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex p-3 gap-2 bg-slate-900/20">
           <button 
             onClick={() => setFilter('open')}
             className={`flex-1 py-2 text-xs font-black rounded-xl transition-all tracking-widest ${filter === 'open' ? 'bg-primary text-white shadow-lg glow-primary' : 'text-slate-500 hover:text-slate-300'}`}
           >
             ACTIVE
           </button>
           <button 
             onClick={() => setFilter('closed')}
             className={`flex-1 py-2 text-xs font-black rounded-xl transition-all tracking-widest ${filter === 'closed' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
           >
             RESOLVED
           </button>
        </div>

        <div className="flex-1 overflow-y-auto w-full p-3 space-y-3 scrollbar-hide">
          {chats.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
               <MessageSquare size={32} className="mb-2 opacity-20" />
               <p className="text-sm italic">No conversations yet</p>
            </div>
          )}
          {chats.map(c => (
            <div 
              key={c.id} 
              onClick={() => selectChat(c)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden ${activeChat?.id === c.id ? 'bg-slate-800/80 border-slate-600 shadow-2xl glow-primary' : 'border-transparent hover:bg-slate-800/40 hover:border-slate-700/50'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-bold transition-colors ${activeChat?.id === c.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{c.customerName}</span>
                <span className={`w-2.5 h-2.5 rounded-full ring-4 ring-slate-900/50 ${c.sentiment === 'angry' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : c.sentiment === 'happy' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`}></span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-black tracking-tighter text-slate-500 group-hover:text-slate-400">
                  {c.Ticket?.category || 'General'} • {c.Ticket?.priority || 'Medium'}
                </p>
                <p className="text-[10px] text-slate-600">{new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {activeChat?.id === c.id && <div className="absolute left-0 top-0 w-1 h-full bg-primary"></div>}
            </div>
          ))}
        </div>
      </div>
      
      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-900 relative">
        {activeChat ? (
          <>
            <div className="px-8 py-5 border-b border-slate-700/30 bg-slate-900/60 backdrop-blur-xl flex justify-between items-center z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 text-primary flex items-center justify-center shadow-inner border border-white/5">
                   <UserIcon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">{activeChat.customerName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest text-white uppercase shadow-lg ${sentiment === 'angry' ? 'bg-rose-500 glow-rose' : sentiment === 'happy' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-600'}`}>
                       {sentiment}
                     </span>
                     {activeChat.status === 'closed' && (
                       <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest text-slate-400 border border-slate-700 uppercase">RESOLVED</span>
                     )}
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                {activeChat.status === 'open' && (
                  <>
                    <button 
                      onClick={simulateCustomerMessage} 
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      Simulate
                    </button>
                    <button 
                      onClick={closeActiveChat}
                      className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                    >
                      Resolve
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {messages.length === 0 && (
                <div className="flex flex-col h-full items-center justify-center text-slate-600 gap-4">
                   <Bot size={48} className="animate-pulse-soft opacity-20" />
                   <p className="text-sm italic">Secure channel established. Waiting for message...</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={m.id || i} className={`flex flex-col ${m.senderType === 'agent' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[75%] rounded-3xl px-6 py-4 shadow-2xl transition-all hover:scale-[1.01] ${m.senderType === 'agent' ? 'bg-gradient-to-br from-primary to-primary-light text-white rounded-br-none shadow-primary/20' : m.senderType === 'customer' ? 'bg-slate-800 text-slate-100 border border-slate-700/50 rounded-bl-none' : 'bg-slate-700/50 text-slate-300 font-mono text-xs italic rounded-2xl'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed font-medium">{m.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-600 mt-2 px-2 font-bold uppercase tracking-widest">
                    {m.senderType} • {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-6 border-t border-slate-700/30 bg-slate-900/80 backdrop-blur-2xl">
              {activeChat.status === 'open' ? (
                <form onSubmit={sendMessage} className="flex gap-4 max-w-5xl mx-auto items-end relative group">
                  <div className="flex-1 relative">
                    <textarea 
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all min-h-[60px] resize-none shadow-inner" 
                      placeholder="Secure message to client..."
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                    />
                    <div className="absolute right-4 bottom-3 text-[10px] font-bold text-slate-600 pointer-events-none">ENTER TO SEND</div>
                  </div>
                  <button type="submit" disabled={!inputMsg.trim()} className="h-[60px] w-[60px] flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all transition-transform">
                    <Send size={24} className="ml-1" />
                  </button>
                </form>
              ) : (
                <div className="max-w-4xl mx-auto p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50 text-center flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-[0.2em] mb-1">Archived Session</span>
                  <p className="text-slate-400 text-sm italic font-medium">This conversation was marked as resolved. Re-open via customer message.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-6">
            <div className="w-32 h-32 rounded-full bg-slate-800/30 flex items-center justify-center border border-slate-700/30 animate-pulse-soft">
              <MessageSquare size={48} className="opacity-10" />
            </div>
            <p className="text-lg font-black tracking-widest text-slate-700 uppercase">Select a Channel to begin</p>
          </div>
        )}
      </div>
      
      {/* 3. AI Copilot Sidebar */}
      <div className="w-[320px] border-l border-slate-700/30 flex flex-col bg-slate-900/60 backdrop-blur-2xl z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.3)]">
        <div className="p-6 border-b border-slate-700/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary-light shadow-inner">
            <Bot size={24} className="animate-pulse-soft" />
          </div>
          <div>
            <h2 className="font-black text-white uppercase tracking-[0.2em] text-xs">AI Copilot</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
               <span className="text-[8px] font-black text-slate-500 uppercase">Neural Link Active</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-5 overflow-y-auto space-y-6 scrollbar-hide">
          {activeChat ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              
              {/* Sentiment Card */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <AlertCircle size={64} />
                </div>
                <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                   Live Sentiment
                </h3>
                <div className={`p-4 rounded-xl flex items-center justify-center font-black text-lg tracking-[0.1em] border uppercase transition-all ${sentiment === 'angry' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 glow-rose' : sentiment === 'happy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {sentiment}
                </div>
              </div>

              {/* Ticket Management Section */}
              <div className="glass-card p-5 rounded-2xl bg-slate-800/40 relative group">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Classification
                  </h3>
                  <button 
                    onClick={updateTicket}
                    className="text-[9px] font-black text-primary-light hover:text-white uppercase tracking-tighter bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-all active:scale-95"
                  >
                    Commit
                  </button>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block px-1">Priority Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['low', 'medium', 'high'].map(p => (
                        <button 
                          key={p}
                          onClick={() => setTicketForm({ ...ticketForm, priority: p })}
                          className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${ticketForm.priority === p ? 'bg-primary border-primary text-white shadow-lg glow-primary' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block px-1">Issue Status</label>
                    <select 
                      value={ticketForm.status}
                      onChange={(e) => setTicketForm({ ...ticketForm, status: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    >
                      <option value="open">Open Session</option>
                      <option value="in_progress">In Analysis</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block px-1">Category Tag</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={ticketForm.category}
                        onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                        placeholder="e.g. BILLING"
                      />
                      <Plus size={14} className="absolute right-4 top-3.5 text-slate-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Summary Card */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50 group-hover:w-2 transition-all"></div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-widest">Neural Summary</h3>
                  <button 
                    type="button"
                    onClick={generateSummary}
                    disabled={isSummarizing}
                    className="text-[9px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest disabled:opacity-50 transition-colors"
                  >
                    {isSummarizing ? 'Processing...' : 'Refresh'}
                  </button>
                </div>
                {aiSummary ? (
                  <p className="text-xs text-slate-300 leading-relaxed font-medium italic opacity-90">"{aiSummary}"</p>
                ) : (
                  <button 
                    type="button"
                    onClick={generateSummary}
                    disabled={isSummarizing}
                    className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-400 hover:border-slate-700 transition-all"
                  >
                    {isSummarizing ? 'Connecting...' : 'Generate Insights'}
                  </button>
                )}
              </div>

              {/* Smart Suggestion Card */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden group border-primary/20 glow-primary">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary group-hover:w-2 transition-all"></div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-[10px] text-primary-light uppercase tracking-widest">Smart Suggestion</h3>
                  <button 
                    type="button"
                    onClick={async () => {
                      if (!activeChat || messages.length === 0) return;
                      try {
                        const lastMsg = [...messages].reverse().find(m => m.senderType === 'customer');
                        if (!lastMsg) return toast.error('No customer message to reply to');
                        const res = await aiAPI.getSuggestion(activeChat.id, lastMsg.message);
                        setAiSuggestion(res.data.data.suggestion);
                        toast.success('Reply recalibrated');
                      } catch (err) {
                        toast.error('Neural link failure');
                      }
                    }}
                    className="text-[9px] font-black text-slate-500 hover:text-primary-light uppercase tracking-widest transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
                {aiSuggestion ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-100 font-medium leading-relaxed italic border-l-2 border-primary/30 pl-4 py-1">"{aiSuggestion}"</p>
                    <button 
                      onClick={applySuggestion}
                      className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 active:scale-95"
                    >
                      Use Intel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4 gap-2 opacity-30">
                    <Bot size={24} className="text-slate-600" />
                    <p className="text-[10px] font-black uppercase text-slate-600">Awaiting Input</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4">
               <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center">
                  <Bot size={32} className="text-slate-800" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Neural insights available upon selection</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default ChatView;
