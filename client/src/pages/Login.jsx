import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const [showPwd, setShowPwd] = useState(false);
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const finalRedirect = from || (user.role === 'admin' ? '/admin/dashboard' : '/dashboard/overview');
      navigate(finalRedirect, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex">
      {/* Left — Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
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

          <h1 className="font-display text-3xl md:text-4xl text-warm-white font-bold mb-2">Welcome back</h1>
          <p className="text-warm-white/40 text-sm mb-8">Sign in to your GolfGives account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-warm-white/60 text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                {...register('email')}
                className={`input-glass ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
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
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-white/30 hover:text-warm-white/60 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full !justify-center">
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn size={16} /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-warm-white/35 text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right — Brand Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-obsidian to-obsidian border-l border-white/5">
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/8 blur-[100px] rounded-full" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative z-10 text-center px-12"
        >
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8 animate-float">
            <Trophy size={36} className="text-emerald-400" />
          </div>
          <h2 className="font-display text-4xl text-warm-white font-bold mb-4 leading-tight">
            Play golf.<br />
            <span className="text-emerald-400 italic">Make an impact.</span>
          </h2>
          <p className="text-warm-white/35 text-sm leading-relaxed max-w-xs mx-auto">
            Every subscription you make goes toward charity, your scores, and a chance to win monthly prizes.
          </p>

          {/* Floating number balls */}
          <div className="flex justify-center gap-3 mt-10">
            {[7, 14, 23, 38, 45].map((n, i) => (
              <motion.div
                key={n}
                className="number-ball"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2 + i * 0.3, ease: 'easeInOut' }}
              >
                {n}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
