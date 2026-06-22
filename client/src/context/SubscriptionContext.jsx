import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (user) {
      setSubscription({
        subscription_status: user.subscriptionStatus,
        subscription_plan: user.subscriptionPlan,
        subscription_renewal_date: user.subscriptionRenewalDate,
        stripe_customer_id: user.stripeCustomerId,
        stripe_subscription_id: user.stripeSubscriptionId,
      });
    } else {
      setSubscription(null);
    }
    setLoading(false);
  }, [user, authLoading]);

  const isActive = subscription?.subscription_status === 'active';

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, isActive, refetch: refreshUser }}>
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
