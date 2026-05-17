import axios from 'axios';

const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
if (import.meta.env.MODE === 'production' && !import.meta.env.VITE_API_URL) {
  console.warn(
    'VITE_API_URL is not defined in production. The frontend will try to call localhost instead of the deployed backend.'
  );
}
const api = axios.create({
  baseURL: `${apiBaseURL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

export const chatAPI = {
  getChats: (params) => api.get('/chats', { params }),
  getChatById: (id) => api.get(`/chats/${id}`),
  createChat: (data) => api.post('/chats', data),
  resumeChat: (data) => api.post('/chats/resume', data),
  closeChat: (id) => api.put(`/chats/${id}/close`),
};

export const ticketAPI = {
  getTickets: (params) => api.get('/tickets', { params }),
  getStats: () => api.get('/tickets/stats'),
  updateTicket: (id, data) => api.put(`/tickets/${id}`, data),
};

export const analyticsAPI = {
  getSentiment: () => api.get('/analytics/sentiment'),
  getCategories: () => api.get('/analytics/categories'),
  getAgents: () => api.get('/analytics/agents'),
  getVolume: () => api.get('/analytics/volume'),
};

export const userAPI = {
  getAgents: () => api.get('/users/agents'),
  createAgent: (data) => api.post('/users/agents', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
};

export const aiAPI = {
  getSummary: (chatId) => api.post('/ai/summarize', { chatId }),
  getSuggestion: (chatId, message) => api.post('/ai/suggest', { chatId, message }),
  getSentiment: (chatId, message) => api.post('/ai/sentiment', { chatId, message }),
  getClassification: (chatId, message) => api.post('/ai/classify', { chatId, message }),
};

export default api;
