import api from './axios';
export const subscriptionAPI = {
  createCheckoutSession: (data) => api.post('/subscriptions/create-checkout-session', data),
  verifySession: (sessionId) => api.get(`/subscriptions/verify-session?session_id=${sessionId}`),
  getStatus: () => api.get('/subscriptions/status'),
  cancel: () => api.post('/subscriptions/cancel'),
};
