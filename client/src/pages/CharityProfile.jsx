import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ExternalLink, Calendar, ArrowLeft, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { charityAPI } from '../api/charity';

const CharityProfile = () => {
  const { slug } = useParams();
  const [charity, setCharity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    charityAPI.getCharityBySlug(slug)
      .then((res) => setCharity(res.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="pt-32 px-4 max-w-4xl mx-auto">
          <div className="skeleton h-64 rounded-2xl mb-8" />
          <div className="skeleton h-8 rounded w-1/2 mb-4" />
          <div className="skeleton h-4 rounded w-full mb-2" />
          <div className="skeleton h-4 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (notFound || !charity) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="pt-40 text-center px-4">
          <h2 className="font-display text-3xl text-warm-white mb-4">Charity Not Found</h2>
          <p className="text-warm-white/40 mb-8">The charity you're looking for doesn't exist or has been removed.</p>
          <Link to="/charities" className="btn-primary">Browse Charities</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative pt-16">
        <div className="h-64 md:h-80 w-full overflow-hidden relative">
          {charity.bannerUrl ? (
            <img src={charity.bannerUrl} alt="" className="w-full h-full object-cover opacity-40" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-500/10 to-obsidian" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/50 to-transparent" />
        </div>
      </div>

      <section className="px-4 pb-32">
        <div className="max-w-4xl mx-auto -mt-24 relative z-10">
          <Link to="/charities" className="inline-flex items-center gap-2 text-warm-white/40 hover:text-warm-white text-sm mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to Charities
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 md:p-10 mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
              {charity.logoUrl && (
                <img src={charity.logoUrl} alt={charity.name} className="h-16 object-contain opacity-90 shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="font-display text-3xl md:text-4xl text-warm-white font-bold">{charity.name}</h1>
                  {charity.isFeatured && <span className="badge-gold">Featured</span>}
                </div>
                <div className="flex items-center gap-4 text-warm-white/35 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Heart size={12} className="text-emerald-400" fill="currentColor" />
                    £{(charity.totalContributed || 0).toLocaleString()} contributed by GolfGives members
                  </span>
                </div>
              </div>
            </div>

            <p className="text-warm-white/55 leading-relaxed text-base mb-8">{charity.description}</p>

            <div className="flex flex-wrap gap-3">
              {charity.website && (
                <a href={charity.website} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-2.5 !px-5 !text-sm">
                  <ExternalLink size={14} />
                  Visit Website
                </a>
              )}
              <Link to="/subscribe" className="btn-primary !py-2.5 !px-5 !text-sm">
                <Heart size={14} />
                Support via GolfGives
              </Link>
            </div>
          </motion.div>

          {/* Upcoming Events */}
          {charity.upcomingEvents?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8"
            >
              <h2 className="font-display text-2xl text-warm-white font-semibold mb-6 flex items-center gap-3">
                <Calendar size={20} className="text-emerald-400" />
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {charity.upcomingEvents.map((event, i) => (
                  <div key={i} className="border-l-2 border-emerald-500/30 pl-5 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-warm-white font-medium">{event.title}</h3>
                    </div>
                    <div className="text-warm-white/35 text-sm flex items-center gap-1.5 mb-2">
                      <Calendar size={11} />
                      {event.date ? format(new Date(event.date), 'MMMM d, yyyy') : 'Date TBA'}
                    </div>
                    {event.description && (
                      <p className="text-warm-white/45 text-sm">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CharityProfile;
