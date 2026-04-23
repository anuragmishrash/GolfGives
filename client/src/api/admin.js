import api from './axios';
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getDraws: (params) => api.get('/admin/draws', { params }),
  simulateDraw: (data) => api.post('/admin/draws/simulate', data),
  publishDraw: (data) => api.post('/admin/draws/publish', data),
  getDrawById: (id) => api.get(`/admin/draws/${id}`),
  getCharities: (params) => api.get('/charities', { params }),
  createCharity: (data) => api.post('/admin/charities', data),
  updateCharity: (id, data) => api.put(`/admin/charities/${id}`, data),
  deleteCharity: (id) => api.delete(`/admin/charities/${id}`),
  getWinners: (params) => api.get('/admin/winners', { params }),
  verifyWinner: (id, data) => api.put(`/admin/winners/${id}/verify`, data),
  markPayout: (id) => api.put(`/admin/winners/${id}/payout`),
  getAnalytics: () => api.get('/admin/analytics'),
};
