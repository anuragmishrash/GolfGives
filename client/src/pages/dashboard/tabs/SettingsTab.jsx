import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Heart, AlertTriangle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { userAPI } from '../../../api/user';
import { charityAPI } from '../../../api/charity';
import { subscriptionAPI } from '../../../api/subscription';

const profileSchema = z.object({ name: z.string().min(2, 'Name must be at least 2 characters') });

const SettingsTab = () => {
  const { user, refreshUser } = useAuth();
  const [charities, setCharities] = useState([]);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '' },
  });

  const [selectedCharity, setSelectedCharity] = useState(user?.selectedCharityId?._id || user?.selectedCharityId || '');
  const [charityPercent, setCharityPercent] = useState(user?.charityContributionPercent || 10);
  const [savingCharity, setSavingCharity] = useState(false);

  useEffect(() => {
    charityAPI.getCharities({ limit: 50 }).then((res) => setCharities(res.data.data || [])).catch(() => {});
  }, []);

  const onProfileSave = async (data) => {
    try {
      await userAPI.updateProfile(data);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
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
      toast.error(err.response?.data?.message || 'Failed to update charity');
    } finally {
      setSavingCharity(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      await subscriptionAPI.cancel();
      toast.success('Subscription will cancel at end of current period');
      setCancelConfirm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel subscription');
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
              <input value={user?.email} disabled className="input-glass opacity-50 cursor-not-allowed" />
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
                  <option key={c._id} value={c._id}>{c.name}</option>
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
        {user?.subscriptionStatus === 'active' && (
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
