import api from './axios';
export const subscriptionAPI = {
  createCheckoutSession: (data) => api.post('/subscriptions/create-checkout-session', data),
  getStatus: () => api.get('/subscriptions/status'),
  cancel: () => api.post('/subscriptions/cancel'),
};
