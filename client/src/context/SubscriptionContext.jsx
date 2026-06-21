import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    // Only fetch if we have a token — avoids wasted calls on logged-out state
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      // Use the Express backend which reads from profiles table with the real JWT
      const res = await api.get('/user/me');
      const profile = res.data?.data;
      if (profile) {
        setSubscription({
          subscription_status: profile.subscriptionStatus,
          subscription_plan: profile.subscriptionPlan,
          subscription_renewal_date: profile.subscriptionRenewalDate,
          stripe_customer_id: profile.stripeCustomerId,
          stripe_subscription_id: profile.stripeSubscriptionId,
        });
      } else {
        setSubscription(null);
      }
    } catch (err) {
      // 401 = logged out, any other error = treat as no subscription
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isActive = subscription?.subscription_status === 'active';

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, isActive, refetch: fetchSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
  return context;
};

export default SubscriptionContext;
