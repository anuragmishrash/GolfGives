import api from './axios';
export const charityAPI = {
  getCharities: (params) => api.get('/charities', { params }),
  getCharityBySlug: (slug) => api.get(`/charities/${slug}`),
};
