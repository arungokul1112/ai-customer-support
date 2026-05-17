import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { MessageSquare, Send, X, Minus, Bot, Sparkles } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CustomerWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '' });
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !socket) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('receive_message', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      newSocket.on('user_typing', ({ userId, isTyping }) => {
        if (userId.startsWith('agent') || userId.length < 10) {
          setIsTyping(isTyping);
        }
      });

      return () => newSocket.close();
    }
  }, [isOpen]);

  const startChat = async (e) => {
    e.preventDefault();
    if (!customerInfo.name) return toast.error('Name is required');
    
    try {
      const res = await chatAPI.createChat({ 
        customerName: customerInfo.name, 
        customerEmail: customerInfo.email 
      });
      
      const newChat = res.data.data;
      setChat(newChat);
      setIsStarted(true);
      
      if (socket) {
        socket.emit('join_chat', { chatId: newChat.id, userId: 'customer_' + newChat.id });
      }
    } catch (err) {
      toast.error('Failed to start chat');
    }
  };

  const resumeChat = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      return toast.error('Name and Email required');
    }
    
    try {
      const res = await chatAPI.resumeChat({ 
        customerName: customerInfo.name, 
        customerEmail: customerInfo.email 
      });
      
      const existingChat = res.data.data;
      setChat(existingChat);
      setMessages(existingChat.Messages || []);
      setIsStarted(true);
      
      if (socket) {
        socket.emit('join_chat', { chatId: existingChat.id, userId: 'customer_' + existingChat.id });
      }
      toast.success('Conversation restored');
    } catch (err) {
      toast.error('No previous session found');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !chat || !socket) return;

    socket.emit('send_message', {
      chatId: chat.id,
      message: inputMsg,
      senderType: 'customer'
    });

    setInputMsg('');
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] font-sans antialiased">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white w-16 h-16 rounded-[2rem] shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:scale-105 flex items-center justify-center group"
        >
          <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {isOpen && (
        <div className="bg-white dark:bg-brand-dark w-[380px] h-[600px] rounded-[2.5rem] shadow-premium dark:shadow-premium-dark border border-slate-200 dark:border-brand-border-dark flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 origin-bottom-right">
          {/* Header */}
          <div className="bg-white dark:bg-brand-dark p-6 flex justify-between items-center border-b border-slate-100 dark:border-brand-border-dark">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600">
                <Sparkles size={20} fill="currentColor" />
              </div>
              <div>
                <span className="block text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Support</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                   <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Agents Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl text-slate-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          {!isStarted ? (
            <div className="flex-1 flex flex-col p-8 justify-center">
               <div className="mb-10 text-center">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Hello.</h3>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">How can we help you today?</p>
               </div>
               
               <form onSubmit={startChat} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Your Name</label>
                    <input 
                       type="text" 
                       placeholder="Identity" 
                       required
                       value={customerInfo.name}
                       onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                       className="input-field py-3.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                       type="email" 
                       placeholder="Endpoint" 
                       required
                       value={customerInfo.email}
                       onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                       className="input-field py-3.5"
                    />
                  </div>
                  <div className="flex flex-col gap-3 pt-6">
                     <button type="submit" className="w-full btn-primary py-4 text-xs">
                        Start Conversation
                     </button>
                     <button 
                        type="button" 
                        onClick={resumeChat}
                        className="w-full py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-400 transition-all"
                     >
                        Restore Session
                     </button>
                  </div>
               </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col bg-white dark:bg-brand-dark overflow-hidden transition-colors">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                <div className="text-center py-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-700">Secured Channel</span>
                </div>
                {messages.map((m, i) => (
                  <div key={m.id || i} className={`flex ${m.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-3 shadow-sm ${m.senderType === 'customer' ? 'chat-bubble-agent !rounded-2xl !rounded-br-none' : 'chat-bubble-customer !rounded-2xl !rounded-bl-none'}`}>
                      <p className="text-sm leading-relaxed">{m.message}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-1.5 items-center px-2 py-1">
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-6 bg-white dark:bg-brand-dark border-t border-slate-100 dark:border-brand-border-dark">
                <form onSubmit={sendMessage} className="flex gap-3">
                  <input 
                    className="input-field py-3 text-sm" 
                    placeholder="Message..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                  />
                  <button type="submit" disabled={!inputMsg.trim()} className="bg-primary-600 hover:bg-primary-700 text-white w-12 h-12 rounded-2xl transition-all shadow-lg shadow-primary-600/20 disabled:opacity-30 flex items-center justify-center">
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerWidget;
