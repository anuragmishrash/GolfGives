import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  'Confirming your payment...',
  'Activating your subscription...',
  'Setting everything up...',
  'Almost there...',
  'Redirecting to your dashboard...',
];

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [statusText, setStatusText] = useState(STEPS[0]);
  const [stepIndex, setStepIndex] = useState(0);
  const [success, setSuccess] = useState(false);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const run = async () => {
      // Step 1: check if we have a token in localStorage (our auth system)
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // No token at all — user genuinely not logged in
        navigate('/login');
        return;
      }

      // Step 2: initial 2-second wait for webhook to fire
      await delay(2000);
      setStatusText(STEPS[1]);
      setStepIndex(1);

      // Step 3: call the sync endpoint — this is the primary activation path.
      // It retrieves the Stripe session by session_id and activates directly.
      setStatusText(STEPS[2]);
      setStepIndex(2);
      try {
        const res = await api.post('/subscriptions/sync', { session_id: sessionId });
        if (res.data?.data?.subscription_status === 'active') {
          await handleSuccess();
          return;
        }
      } catch (err) {
        console.error('[PaymentSuccess] Sync failed:', err.message);
      }

      // Step 4: poll via backend /user/me for subscription_status update
      // This will reflect whatever the webhook or sync already wrote to DB
      setStatusText(STEPS[3]);
      setStepIndex(3);
      for (let i = 0; i < 5; i++) {
        await delay(2000);
        const active = await checkBackendStatus();
        if (active) {
          await handleSuccess();
          return;
        }
      }

      // Step 5: give up waiting — redirect anyway.
      // User may need to refresh dashboard to see updated status.
      setStatusText(STEPS[4]);
      setStepIndex(4);
      await delay(1000);
      await refreshUser();
      navigate('/dashboard', { replace: true });
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check subscription status via Express backend (reads the profiles table)
  async function checkBackendStatus() {
    try {
      const res = await api.get('/user/me');
      return res.data?.data?.subscriptionStatus === 'active';
    } catch {
      return false;
    }
  }

  async function handleSuccess() {
    setSuccess(true);
    setStatusText('All set! Taking you to your dashboard...');
    await refreshUser(); // update AuthContext with fresh profile
    await delay(1200);
    navigate('/dashboard', { replace: true });
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: success ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)',
          border: `2px solid ${success ? '#22c55e' : 'rgba(34,197,94,0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          transition: 'all 0.4s ease',
        }}
      >
        {success ? '✅' : '⛳'}
      </motion.div>

      {/* Spinner */}
      {!success && (
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid #1f1f1f',
            borderTop: '3px solid #22c55e',
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
          }}
        />
      )}

      {/* Text */}
      <motion.div
        key={statusText}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ textAlign: 'center', maxWidth: 360, padding: '0 20px' }}
      >
        <h2 style={{ color: '#ffffff', fontSize: 24, fontWeight: 700, marginBottom: 10 }}>
          {success ? 'Payment Confirmed 🎉' : 'Payment Successful 🎉'}
        </h2>
        <p style={{ color: '#71717a', fontSize: 15, lineHeight: 1.6 }}>
          {statusText}
        </p>
      </motion.div>

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 8 }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: i <= stepIndex ? '#22c55e' : '#2a2a2a',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>

      <p style={{ color: '#3f3f46', fontSize: 12, textAlign: 'center', padding: '0 20px' }}>
        Do not close this page. You will be redirected automatically.
      </p>
    </div>
  );
}
