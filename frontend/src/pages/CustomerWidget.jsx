import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { MessageSquare, Send, X, Minus } from 'lucide-react';

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
        if (userId.startsWith('agent')) {
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
      return toast.error('Name and Email are required to resume');
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
      toast.success('Welcome back! Chat history loaded.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No previous chat found');
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
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center gap-2"
        >
          <MessageSquare size={24} />
          <span className="font-bold pr-1">Chat with us</span>
        </button>
      )}

      {isOpen && (
        <div className="bg-slate-900 w-96 h-[550px] rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="font-bold">Support Agent Online</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsOpen(false)}><Minus size={20} /></button>
              <button onClick={() => setIsOpen(false)}><X size={20} /></button>
            </div>
          </div>

          {!isStarted ? (
            <div className="flex-1 flex flex-col p-6">
               <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">Hi there! 👋</h3>
                  <p className="text-sm text-slate-400">Please enter your details to start chatting with an agent.</p>
               </div>
               
               <form onSubmit={startChat} className="space-y-3">
                  <input 
                     type="text" 
                     placeholder="Your Name" 
                     required
                     value={customerInfo.name}
                     onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                     className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 placeholder-slate-400"
                  />
                  <input 
                     type="email" 
                     placeholder="Email Address" 
                     required
                     value={customerInfo.email}
                     onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                     className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 placeholder-slate-400"
                  />
                  <div className="flex gap-2 pt-2">
                     <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/30">
                        Start New
                     </button>
                     <button 
                        type="button" 
                        onClick={resumeChat}
                        className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg font-medium transition-colors"
                     >
                        Resume Old
                     </button>
                  </div>
               </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                  <div key={m.id || i} className={`flex ${m.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${m.senderType === 'customer' ? 'bg-primary text-white rounded-br-none' : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'}`}>
                      {m.message}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="text-xs text-slate-500 italic">Agent is typing...</div>}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-900">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input 
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary" 
                    placeholder="Type your message..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                  />
                  <button type="submit" disabled={!inputMsg.trim()} className="bg-primary hover:bg-primary-dark text-white p-2 rounded-lg transition-colors disabled:opacity-50">
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
