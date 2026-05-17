import React, { useState, useEffect, useRef } from 'react';
import { chatAPI, ticketAPI, aiAPI } from '../services/api';
import { useSocketContext } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Bot, Send, User as UserIcon, Plus, MessageSquare, Sparkles, AlertCircle } from 'lucide-react';

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  useEffect(() => {
    if (socket && user?.companyId) {
      socket.emit('join_company', { companyId: user.companyId });
    }
  }, [socket, user]);

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
    <div className="flex h-full w-full bg-white dark:bg-brand-dark overflow-hidden transition-colors">
      
      {/* 1. Chat List Sidebar */}
      <div className="w-[260px] border-r border-slate-200 dark:border-brand-border-dark flex flex-col bg-slate-50/50 dark:bg-brand-surface-dark/20">
        <div className="p-4 border-b border-slate-200 dark:border-brand-border-dark flex justify-between items-center bg-white dark:bg-brand-surface-dark">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Inbox</h2>
        </div>
        
        {/* Tabs */}
        <div className="flex p-1.5 bg-slate-100 dark:bg-black/20 m-3 rounded-2xl">
           <button 
             onClick={() => setFilter('open')}
             className={`flex-1 py-1.5 text-[10px] font-bold rounded-xl transition-all ${filter === 'open' ? 'bg-white dark:bg-brand-surface-dark text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             Active
           </button>
           <button 
             onClick={() => setFilter('closed')}
             className={`flex-1 py-1.5 text-[10px] font-bold rounded-xl transition-all ${filter === 'closed' ? 'bg-white dark:bg-brand-surface-dark text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             Resolved
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
          {chats.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
               <MessageSquare size={20} className="mb-2 opacity-20" />
               <p className="text-[10px] font-bold uppercase tracking-widest">No conversations</p>
            </div>
          )}
          {chats.map(c => (
            <div 
              key={c.id} 
              onClick={() => selectChat(c)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border group relative ${activeChat?.id === c.id ? 'bg-white dark:bg-brand-surface-dark border-primary-500 shadow-premium dark:shadow-premium-dark' : 'bg-transparent border-transparent hover:bg-white/50 dark:hover:bg-white/5'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-bold ${activeChat?.id === c.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{c.customerName}</span>
                <span className={`w-2 h-2 rounded-full ${c.sentiment === 'angry' ? 'bg-rose-500' : c.sentiment === 'happy' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  {c.Ticket?.category || 'General'}
                </p>
                <p className="text-[10px] text-slate-400">{new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-brand-dark relative transition-colors">
        {activeChat ? (
          <>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-brand-border-dark bg-white dark:bg-brand-dark flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 text-primary-600 flex items-center justify-center">
                   <UserIcon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{activeChat.customerName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                     <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-tight ${sentiment === 'angry' ? 'bg-rose-50 text-rose-600' : sentiment === 'happy' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>
                       {sentiment}
                     </span>
                     {activeChat.status === 'closed' && (
                       <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-tight">RESOLVED</span>
                     )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {activeChat.status === 'open' && (
                  <button 
                    onClick={closeActiveChat}
                    className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold py-1.5 px-4 rounded-xl text-[10px] transition-all"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {messages.length === 0 && (
                <div className="flex flex-col h-full items-center justify-center text-slate-300 gap-2">
                   <Bot size={32} className="opacity-10" />
                   <p className="text-[10px] font-bold uppercase tracking-widest italic">Awaiting connection...</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={m.id || i} className={`flex flex-col ${m.senderType === 'agent' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[75%] px-4 py-3 shadow-sm ${m.senderType === 'agent' ? 'chat-bubble-agent' : m.senderType === 'customer' ? 'chat-bubble-customer' : 'bg-slate-100 dark:bg-white/5 text-slate-500 text-[10px] rounded-xl'}`}>
                    <p className="text-sm leading-relaxed">{m.message}</p>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 mt-2 px-1 uppercase">
                    {m.senderType} • {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-6 bg-white dark:bg-brand-dark border-t border-slate-200 dark:border-brand-border-dark">
              {activeChat.status === 'open' ? (
                <form onSubmit={sendMessage} className="flex gap-4 max-w-5xl mx-auto items-end">
                  <div className="flex-1 relative">
                    <textarea 
                      className="input-field min-h-[50px] max-h-[150px] resize-none py-3.5" 
                      placeholder="Type your response..."
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                    />
                  </div>
                  <button type="submit" disabled={!inputMsg.trim()} className="h-[50px] w-[50px] flex items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 active:scale-95 disabled:opacity-30 transition-all">
                    <Send size={20} />
                  </button>
                </form>
              ) : (
                <div className="max-w-xl mx-auto p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-brand-border-dark text-center">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Archived Conversation</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-brand-border-dark">
              <MessageSquare size={32} className="opacity-20" />
            </div>
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Select a conversation</p>
          </div>
        )}
      </div>
      
      {/* 3. AI Copilot Sidebar */}
      <div className="w-[260px] border-l border-slate-200 dark:border-brand-border-dark flex flex-col bg-slate-50/50 dark:bg-brand-surface-dark/20 transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-brand-border-dark flex items-center gap-2 bg-white dark:bg-brand-surface-dark">
          <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600">
            <Sparkles size={18} fill="currentColor" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">Intelligence</h2>
          </div>
        </div>
        
        <div className="flex-1 p-5 overflow-y-auto space-y-6 scrollbar-hide">
          {activeChat ? (
            <div className="space-y-6">
              
              {/* Metadata Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Context</h3>
                  <button 
                    onClick={updateTicket}
                    className="text-[10px] font-bold text-primary-600 hover:text-primary-700 uppercase"
                  >
                    Update
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Priority</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-black/20 p-1 rounded-xl">
                      {['low', 'medium', 'high'].map(p => (
                        <button 
                          key={p}
                          onClick={() => setTicketForm({ ...ticketForm, priority: p })}
                          className={`py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${ticketForm.priority === p ? 'bg-white dark:bg-brand-surface-dark text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Category</label>
                    <input 
                      type="text"
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="input-field text-[11px] py-2"
                      placeholder="e.g. BILLING"
                    />
                  </div>
                </div>
              </div>

              {/* AI Summary Card */}
              <div className="bg-white dark:bg-brand-surface-dark p-4 rounded-2xl border border-slate-200 dark:border-brand-border-dark shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[10px] text-slate-900 dark:text-white uppercase tracking-widest">Summary</h3>
                  <button onClick={generateSummary} disabled={isSummarizing} className="text-[10px] text-primary-600 disabled:opacity-50 font-bold uppercase">Run</button>
                </div>
                {aiSummary ? (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">"{aiSummary}"</p>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-[10px] text-slate-400 italic">No summary generated</p>
                  </div>
                )}
              </div>

              {/* Smart Suggestion Card */}
              <div className="bg-primary-600 p-5 rounded-2xl shadow-xl shadow-primary-600/20">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} className="text-primary-100" />
                  <h3 className="font-bold text-[10px] text-white uppercase tracking-widest">Suggestion</h3>
                </div>
                {aiSuggestion ? (
                  <div className="space-y-4">
                    <p className="text-[11px] text-primary-50 font-medium leading-relaxed italic">"{aiSuggestion}"</p>
                    <button 
                      onClick={applySuggestion}
                      className="w-full bg-white text-primary-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-50 transition-all shadow-lg"
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-[10px] text-primary-200 italic">Listening for context...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 gap-3">
               <Sparkles size={24} className="text-slate-400" />
               <p className="text-[9px] font-bold uppercase tracking-widest">AI Standby</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default ChatView;
