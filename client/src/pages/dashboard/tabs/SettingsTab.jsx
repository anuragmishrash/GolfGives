import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Heart, AlertTriangle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useSubscription } from '../../../context/SubscriptionContext';
import { userAPI } from '../../../api/user';
import { formatError } from '../../../utils/errorFormatter';
import { supabase } from '../../../lib/supabase';

const profileSchema = z.object({ name: z.string().min(2, 'Name must be at least 2 characters') });

const SettingsTab = () => {
  const { user, refreshUser } = useAuth();
  const { subscription, isActive, refetch: refetchSubscription } = useSubscription();
  const [charities, setCharities] = useState([]);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '' },
  });

  const [selectedCharity, setSelectedCharity] = useState('');
  const [charityPercent, setCharityPercent] = useState(10);
  const [savingCharity, setSavingCharity] = useState(false);

  useEffect(() => {
    const fetchCharityData = async () => {
      if (!user?.id) return;
      
      // Fetch charities list
      const { data: charitiesList } = await supabase
        .from('charities')
        .select('id, name')
        .order('name');
        
      setCharities(charitiesList || []);

      // Fetch user's current charity preferences directly
      const { data: profile } = await supabase
        .from('profiles')
        .select('charity_id, charity_percentage')
        .eq('id', user.id)
        .single();

      if (profile) {
        setSelectedCharity(profile.charity_id || '');
        setCharityPercent(profile.charity_percentage || 10);
      }
    };

    fetchCharityData();
  }, [user?.id]);

  const onProfileSave = async (data) => {
    try {
      await userAPI.updateProfile(data);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(formatError(err));
    }
  };

  const onCharitySave = async () => {
    setSavingCharity(true);
    try {
      await userAPI.updateCharity({
        charityId: selectedCharity || null,
        charityContributionPercent: parseInt(charityPercent),
      });
      await refreshUser();
      toast.success('Charity preferences updated!');
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setSavingCharity(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      if (subscription?.stripe_subscription_id) {
        const response = await fetch('/api/subscriptions/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ 
            subscriptionId: subscription.stripe_subscription_id 
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message);
        }
      }

      // Optimistic update for both Stripe and manual subscriptions
      await supabase
        .from('profiles')
        .update({ subscription_status: 'cancelled' })
        .eq('id', user.id);

      await refetchSubscription();
      toast.success('Subscription will cancel at end of current period');
      setCancelConfirm(false);
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-white font-bold">Settings</h1>
        <p className="text-warm-white/40 text-sm mt-1">Manage your profile and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-emerald-400" />
            <h2 className="text-warm-white font-semibold">Profile</h2>
          </div>
          <form onSubmit={handleSubmit(onProfileSave)} className="space-y-4">
            <div>
              <label className="text-warm-white/50 text-xs font-medium block mb-1.5">Full Name</label>
              <input {...register('name')} className={`input-glass ${errors.name ? 'error' : ''}`} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-warm-white/50 text-xs font-medium block mb-1.5">Email Address</label>
              <input value={user?.email || ''} disabled className="input-glass opacity-50 cursor-not-allowed" />
              <p className="text-warm-white/25 text-xs mt-1">Email cannot be changed</p>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary !py-2.5 !px-5 !text-sm">
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Save Profile</>}
            </button>
          </form>
        </div>

        {/* Charity */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Heart size={16} className="text-emerald-400" />
            <h2 className="text-warm-white font-semibold">Charity Preferences</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-warm-white/50 text-xs font-medium block mb-1.5">Select Charity</label>
              <select
                value={selectedCharity}
                onChange={(e) => setSelectedCharity(e.target.value)}
                className="input-glass"
                style={{ colorScheme: 'dark' }}
              >
                <option value="">No charity selected</option>
                {charities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-warm-white/50 text-xs font-medium block mb-1.5">
                Contribution Percentage: <span className="text-emerald-400">{charityPercent}%</span>
              </label>
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={charityPercent}
                onChange={(e) => setCharityPercent(e.target.value)}
                className="w-full accent-emerald-500 h-1.5 rounded-full"
              />
              <div className="flex justify-between text-warm-white/25 text-xs mt-1">
                <span>10% (min)</span>
                <span>50% (max)</span>
              </div>
            </div>
            <button
              onClick={onCharitySave}
              disabled={savingCharity}
              className="btn-primary !py-2.5 !px-5 !text-sm"
            >
              {savingCharity ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Save Preferences</>}
            </button>
          </div>
        </div>

        {/* Cancel Subscription */}
        {isActive && (
          <div className="glass-card p-6 border-red-500/15">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-red-400" />
              <h2 className="text-warm-white font-semibold">Cancel Subscription</h2>
            </div>
            <p className="text-warm-white/45 text-sm mb-4">
              Cancelling will stop future charges. You'll retain access until the end of your current billing period.
            </p>
            {!cancelConfirm ? (
              <button onClick={() => setCancelConfirm(true)} className="btn-secondary !border-red-500/30 !text-red-400 hover:!bg-red-500/10 !py-2.5 !px-5 !text-sm">
                Cancel Subscription
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={handleCancelSubscription} disabled={cancelling} className="btn-secondary !border-red-500/50 !bg-red-500/10 !text-red-400 !py-2.5 !px-5 !text-sm">
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
                </button>
                <button onClick={() => setCancelConfirm(false)} className="btn-secondary !py-2.5 !px-5 !text-sm">
                  Keep Subscription
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SettingsTab;
