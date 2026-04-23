import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-obsidian z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 animate-ping absolute inset-0" />
        <div className="w-16 h-16 rounded-full border-2 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent animate-spin" />
      </div>
      <p className="font-display text-warm-white/60 text-sm tracking-widest uppercase">
        GolfGives
      </p>
    </motion.div>
  </div>
);

export default LoadingScreen;
