import React, { useState, useEffect, useRef } from 'react';
import { chatAPI, ticketAPI } from '../services/api';
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
  const [sentiment, setSentiment] = useState('neutral');
  const [filter, setFilter] = useState('open'); // 'open' or 'closed'
  
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

    const handleAiSuggestion = ({ chatId, suggestion, sentiment }) => {
      if (activeChat && chatId === activeChat.id) {
        setAiSuggestion(suggestion);
        setSentiment(sentiment);
        toast('New AI Suggestion!', { icon: '🤖' });
      }
    };

    const handleChatUpdated = ({ chatId, sentiment, lastAISuggestion, status }) => {
      // Update the chat in the list if it matches the current filter
      setChats((prev) => {
        const index = prev.findIndex(c => c.id === chatId);
        if (status && status !== filter) {
          return prev.filter(c => c.id !== chatId);
        }
        if (index !== -1) {
          return prev.map(c => c.id === chatId ? { ...c, sentiment, lastAISuggestion, status: status || c.status } : c);
        }
        return prev;
      });

      if (activeChat && chatId === activeChat.id) {
        setSentiment(sentiment);
        setAiSuggestion(lastAISuggestion);
        if (status) setActiveChat(prev => ({ ...prev, status }));
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
      setSentiment(chat.sentiment || 'neutral');
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

  const updateTicket = async (updates) => {
    if (!activeChat || !activeChat.Ticket) return;
    try {
      const res = await ticketAPI.updateTicket(activeChat.Ticket.id, updates);
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

  return (
    <div className="flex h-full w-full bg-slate-900 overflow-hidden">
      
      {/* 1. Chat List Sidebar */}
      <div className="w-1/4 border-r border-slate-700/50 flex flex-col bg-slate-800/30">
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="font-bold text-slate-100">Conversations</h2>
          <button onClick={createSimulatedChat} className="bg-primary/20 text-primary hover:bg-primary/30 p-2 rounded-full cursor-pointer transition-colors" title="Create Dummy Chat">
            <Plus size={18} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-slate-900/50">
           <button 
             onClick={() => setFilter('open')}
             className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'open' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-200'}`}
           >
             ACTIVE
           </button>
           <button 
             onClick={() => setFilter('closed')}
             className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'closed' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
           >
             RESOLVED
           </button>
        </div>

        <div className="flex-1 overflow-y-auto w-full p-2 space-y-2">
          {chats.length === 0 && (
            <p className="text-slate-400 p-4 text-center text-sm">
              No {filter === 'open' ? 'active' : 'resolved'} chats found.
            </p>
          )}
          {chats.map(c => (
            <div 
              key={c.id} 
              onClick={() => selectChat(c)}
              className={`p-3 rounded-xl cursor-pointer transition-all border ${activeChat?.id === c.id ? 'bg-slate-800 border-slate-700 shadow-lg' : 'border-transparent hover:bg-slate-800/50'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-100 truncate">{c.customerName}</span>
                <span className={`w-2 h-2 rounded-full ${c.sentiment === 'angry' ? 'bg-rose-500' : c.sentiment === 'happy' ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
              </div>
              <p className="text-xs text-slate-400">{c.status === 'open' ? 'Active' : 'Resolved'}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-900 relative">
        {activeChat ? (
          <>
            <div className="px-6 py-4 border-b border-slate-700/50 glass-card rounded-none flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center">
                   <UserIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-wide">{activeChat.customerName}</h3>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                     <span className={`px-2 py-0.5 rounded-md text-white shadow-sm ${sentiment === 'angry' ? 'bg-rose-500/80 shadow-rose-900' : sentiment === 'happy' ? 'bg-emerald-500/80 shadow-emerald-900' : 'bg-slate-500/80'}`}>
                       {sentiment.toUpperCase()}
                     </span>
                     {activeChat.status === 'closed' && (
                       <span className="bg-slate-700 px-2 py-0.5 rounded-md text-slate-300 border border-slate-600">RESOLVED</span>
                     )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {activeChat.status === 'open' && (
                  <>
                    <button 
                      onClick={simulateCustomerMessage} 
                      className="bg-amber-500/20 text-amber-300 border border-amber-500/50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                    >
                      Simulate Reply
                    </button>
                    <button 
                      onClick={closeActiveChat}
                      className="bg-rose-500/20 text-rose-300 border border-rose-500/50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-500/30 transition-colors"
                    >
                      Close Chat
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/80">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-slate-500">No messages yet. Waiting for customer...</div>
              )}
              {messages.map((m, i) => (
                <div key={m.id || i} className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-md ${m.senderType === 'agent' ? 'ml-auto bg-gradient-to-r from-primary to-primary-light text-white rounded-br-none' : m.senderType === 'customer' ? 'mr-auto bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none' : 'mr-auto bg-slate-700 text-slate-300 font-mono text-sm'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-slate-700/50 bg-slate-800/80 backdrop-blur-md">
              {activeChat.status === 'open' ? (
                <form onSubmit={sendMessage} className="flex gap-3 max-w-4xl mx-auto items-end relative">
                  <textarea 
                    className="flex-1 glass-input min-h-[60px] resize-none pb-2 pt-3 shadow-inner bg-slate-900/90 text-slate-100 placeholder:text-slate-500" 
                    placeholder="Type a message to the customer..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                  />
                  <button type="submit" disabled={!inputMsg.trim()} className="btn-primary h-[60px] w-[60px] flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
                    <Send size={20} className="ml-1" />
                  </button>
                </form>
              ) : (
                <div className="max-w-4xl mx-auto p-4 bg-slate-900/50 rounded-xl border border-slate-700 text-center text-slate-400 text-sm italic">
                  This conversation has been resolved and is now read-only.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
      
      {/* 3. AI Copilot Sidebar */}
      <div className="w-[300px] border-l border-slate-700/50 flex flex-col bg-slate-800/20 backdrop-blur-sm z-20 shadow-[-10px_0_20px_rgba(0,0,0,0.1)]">
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
          <Bot className="text-primary-light" size={20} />
          <h2 className="font-bold text-slate-100">AI Copilot</h2>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-6">
          {activeChat ? (
            <div className="space-y-6">
              <div className="glass-card p-4 rounded-xl shadow-md border border-slate-700/50">
                <h3 className="font-bold text-sm text-slate-300 mb-3 flex items-center gap-2"><AlertCircle size={14}/> Detect Sentiment</h3>
                <div className={`p-3 rounded-lg flex items-center justify-center font-bold tracking-wider ${sentiment === 'angry' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : sentiment === 'happy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                </div>
              </div>

              {/* Ticket Management Section */}
              <div className="glass-card p-4 rounded-xl shadow-md border border-slate-700/50 bg-slate-800/40">
                <h3 className="font-bold text-sm text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <MessageSquare size={14}/> Ticket Info
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Priority</label>
                    <select 
                      value={activeChat.Ticket?.priority || 'medium'}
                      onChange={(e) => updateTicket({ priority: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Status</label>
                    <select 
                      value={activeChat.Ticket?.status || 'open'}
                      onChange={(e) => updateTicket({ status: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Category</label>
                    <input 
                      type="text"
                      value={activeChat.Ticket?.category || 'general'}
                      onChange={(e) => updateTicket({ category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl shadow-lg border border-slate-700/50 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary group-hover:w-2 transition-all"></div>
                <h3 className="font-bold text-sm text-slate-300 mb-2">Smart Suggestion</h3>
                {aiSuggestion ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-100 italic leading-relaxed">"{aiSuggestion}"</p>
                    <button 
                      onClick={applySuggestion}
                      className="w-full bg-primary/20 hover:bg-primary/30 text-primary-light py-2 rounded-lg text-xs font-bold transition-colors border border-primary/20"
                    >
                      APPLY REPLY
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Waiting for customer message...</p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-slate-500 text-sm p-4">
              Select a chat to see AI insights
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default ChatView;
