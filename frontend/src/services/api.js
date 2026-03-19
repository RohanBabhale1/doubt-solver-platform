import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// Doubts
export const getDoubts = (params) => api.get('/doubts', { params });
export const getDoubt = (id) => api.get(`/doubts/${id}`);
export const createDoubt = (data) => api.post('/doubts', data);
export const updateDoubt = (id, data) => api.put(`/doubts/${id}`, data);
export const deleteDoubt = (id) => api.delete(`/doubts/${id}`);
export const solveDoubt = (id) => api.patch(`/doubts/${id}/solve`);
export const getPopularDoubts = () => api.get('/doubts/popular');
export const getRecentDoubts = () => api.get('/doubts/recent');
export const getMyDoubts = () => api.get('/doubts/my');

// Replies
export const getReplies = (doubtId) => api.get(`/doubts/${doubtId}/replies`);
export const createReply = (doubtId, data) => api.post(`/doubts/${doubtId}/replies`, data);
export const updateReply = (replyId, data) => api.put(`/replies/${replyId}`, data);
export const deleteReply = (replyId) => api.delete(`/replies/${replyId}`);
export const acceptReply = (replyId) => api.patch(`/replies/${replyId}/accept`);

// Votes
export const toggleVote = (replyId) => api.post(`/votes/replies/${replyId}/vote`);
export const getMyVotes = () => api.get('/votes/my');

// Notifications
export const getNotifications = (params) => api.get('/notifications', { params });
export const getUnreadCount = () => api.get('/notifications/count');
export const markRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead = () => api.patch('/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

// Subjects
export const getSubjects = () => api.get('/subjects');
export const getSubjectDoubts = (id, params) => api.get(`/subjects/${id}/doubts`, { params });

// Search
export const search = (params) => api.get('/search', { params });
export const searchSubjects = (q) => api.get('/search/subjects', { params: { q } });

// Profile
export const getProfile = (userId) => api.get(`/profile/${userId}`);
export const updateProfile = (data) => api.put('/profile', data);
export const uploadAvatar = (formData) => api.put('/profile/avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getUserDoubts = (userId, params) => api.get(`/profile/${userId}/doubts`, { params });
export const getUserReplies = (userId) => api.get(`/profile/${userId}/replies`);
export const getMyStats = () => api.get('/profile/stats');

// Platform stats
export const getPlatformStats = () => api.get('/stats/platform');

export default api;