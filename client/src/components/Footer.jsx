import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ExternalLink } from 'lucide-react';

const Footer = () => (
  <footer className="border-t border-white/6 mt-auto py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Brand */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">G</div>
            <span className="font-display text-warm-white font-semibold text-lg">
              Golf<span className="text-emerald-500">Gives</span>
            </span>
          </div>
          <p className="text-warm-white/40 text-sm leading-relaxed max-w-xs">
            A premium platform where golf performance meets charitable giving. Play, track, and make an impact.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-warm-white/60 text-xs font-semibold uppercase tracking-widest mb-4">Platform</h4>
          <ul className="space-y-2">
            {[['Home', '/'], ['Charities', '/charities'], ['Subscribe', '/subscribe'], ['Dashboard', '/dashboard']].map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="text-warm-white/40 hover:text-warm-white text-sm transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-warm-white/60 text-xs font-semibold uppercase tracking-widest mb-4">Legal</h4>
          <ul className="space-y-2">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <li key={item}>
                <span className="text-warm-white/40 hover:text-warm-white text-sm transition-colors cursor-pointer">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="h-px bg-white/6 mb-6" />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-warm-white/30 text-sm">
          © {new Date().getFullYear()} GolfGives. All rights reserved.
        </p>
        <p className="text-warm-white/30 text-sm flex items-center gap-1.5">
          Made with <Heart size={12} className="text-emerald-500" fill="currentColor" /> for golfers who give back
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
