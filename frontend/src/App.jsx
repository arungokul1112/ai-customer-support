import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChatView from './pages/ChatView';
import Tickets from './pages/Tickets';
import CustomerWidget from './pages/CustomerWidget';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'glass-card text-white',
              style: { background: '#1e293b', color: '#fff' }
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chats" element={<ChatView />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/analytics" element={<div className="p-8 text-2xl font-bold">Analytics Module Coming Soon</div>} />
              <Route path="/settings" element={<div className="p-8 text-2xl font-bold">Settings Component Coming Soon</div>} />
              <Route path="/customer" element={<CustomerWidget />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
