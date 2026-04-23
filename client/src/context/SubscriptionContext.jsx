import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscriptionAPI } from '../api/subscription';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState(null);
  const [prizePool, setPrizePool] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await subscriptionAPI.getStatus();
      setStatus(res.data.data);
      setPrizePool(res.data.data.prizePool);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.subscriptionStatus]);

  return (
    <SubscriptionContext.Provider value={{ status, prizePool, loading, refetch: fetchStatus }}>
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
