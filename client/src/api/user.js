import api from './axios';
export const userAPI = {
  getMe: () => api.get('/user/me'),
  updateProfile: (data) => api.put('/user/profile', data),
  updateCharity: (data) => api.put('/user/charity', data),
  getScores: () => api.get('/user/scores'),
  addScore: (data) => api.post('/user/scores', data),
  updateScore: (id, data) => api.put(`/user/scores/${id}`, data),
  deleteScore: (id) => api.delete(`/user/scores/${id}`),
  getDraws: (params) => api.get('/user/draws', { params }),
  getWinnings: () => api.get('/user/winnings'),
};
