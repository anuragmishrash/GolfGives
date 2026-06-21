import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../lib/supabase';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const Register = () => {
  const [showPwd, setShowPwd] = useState(false);
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const [googleError, setGoogleError] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleError(null);
      await signInWithGoogle();
    } catch (error) {
      setGoogleError(error.message);
      toast.error(error.message);
    }
  };

  const onSubmit = async (data) => {
    try {
      await authRegister(data.name, data.email, data.password);
      toast.success('Account created! Welcome to GolfGives 🎉');
      navigate('/subscribe');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex">
      {/* Left — Brand Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-gradient-to-br from-obsidian to-obsidian border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-radial from-emerald-500/8 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative z-10 text-center px-12"
        >
          <div className="w-20 h-20 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-8 animate-float">
            <Heart size={36} className="text-gold-400" fill="currentColor" />
          </div>
          <h2 className="font-display text-4xl text-warm-white font-bold mb-4">
            Join the movement.<br />
            <span className="text-gold-400 italic">Golf for good.</span>
          </h2>
          <p className="text-warm-white/35 text-sm leading-relaxed max-w-xs mx-auto">
            Create your account to start tracking scores, supporting charities, and competing in monthly draws.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {['£48K raised', '2,400+ members', '12 charities'].map((s) => (
              <div key={s} className="glass-card p-3 text-center">
                <span className="text-warm-white/50 text-xs font-medium block">{s}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full mx-auto"
        >
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">G</div>
            <span className="font-display text-warm-white font-semibold text-lg">
              Golf<span className="text-emerald-500">Gives</span>
            </span>
          </Link>

          <h1 className="font-display text-3xl md:text-4xl text-warm-white font-bold mb-2">Create your account</h1>
          <p className="text-warm-white/40 text-sm mb-8">Join GolfGives for free — subscribe when you're ready</p>

          {googleError && <p className="text-red-400 text-xs text-center mb-4">{googleError}</p>}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 border border-white/10 rounded-lg px-4 py-3 hover:bg-white/5 transition-colors text-warm-white font-medium"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-5 h-5" 
            />
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 my-6">
            <hr className="flex-1 border-white/10" />
            <span className="text-sm text-warm-white/40">or</span>
            <hr className="flex-1 border-white/10" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-warm-white/60 text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                {...register('name')}
                className={`input-glass ${errors.name ? 'error' : ''}`}
                placeholder="John Smith"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-warm-white/60 text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                {...register('email')}
                className={`input-glass ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-warm-white/60 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  {...register('password')}
                  className={`input-glass pr-12 ${errors.password ? 'error' : ''}`}
                  placeholder="At least 8 characters"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-white/30 hover:text-warm-white/60 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-warm-white/60 text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                {...register('confirmPassword')}
                className={`input-glass ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Repeat your password"
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full !justify-center">
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </button>
          </form>

          <p className="text-warm-white/35 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
