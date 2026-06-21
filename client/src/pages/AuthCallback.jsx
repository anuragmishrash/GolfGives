import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithSession } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. Get the session established by Supabase's automatic OAuth redirect handling
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error(sessionError?.message || 'No session found. Please try logging in again.');
        }

        const user = session.user;

        // 2. Check if the user already has a row in our 'profiles' table
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', user.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 means zero rows returned, which is fine (first time login)
          // Any other error is a real DB error
          throw new Error('Database error while verifying profile');
        }

        // 3. If no profile exists, this is a brand new user signing up via Google
        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              role: 'subscriber',
              subscription_status: 'inactive',
              charity_percentage: 10
            });

          if (profileError) {
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }
        }

        // 4. Pass the session to AuthContext to store tokens and fetch full user state
        const userData = await loginWithSession(session);

        // 5. Redirect based on role
        if (userData?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }

      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.message);
        // Wait 3 seconds so the user can read the error, then bounce to login
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [navigate, loginWithSession]);

  return (
    <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 flex flex-col items-center max-w-sm w-full text-center"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 animate-pulse">
          <Trophy size={28} className="text-emerald-400" />
        </div>
        
        {error ? (
          <>
            <h2 className="text-xl font-bold text-red-400 mb-2 font-display">Login Error</h2>
            <p className="text-warm-white/60 text-sm">{error}</p>
            <p className="text-warm-white/40 text-xs mt-4">Redirecting back to login...</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-warm-white mb-2 font-display">Authenticating</h2>
            <p className="text-warm-white/60 text-sm">Please wait while we log you in...</p>
            <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
