import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Heart, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { charityAPI } from '../api/charity';

const CharityCard = ({ charity, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, duration: 0.4 }}
    className="glass-card p-6 flex flex-col"
  >
    {charity.logoUrl ? (
      <img src={charity.logoUrl} alt={charity.name} className="h-12 object-contain mb-5 opacity-80 self-start" />
    ) : (
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5">
        <Heart size={20} className="text-emerald-400" />
      </div>
    )}

    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-display text-warm-white font-semibold text-lg">{charity.name}</h3>
        {charity.isFeatured && <span className="badge-gold text-xs">Featured</span>}
      </div>
      <p className="text-warm-white/45 text-sm leading-relaxed line-clamp-3">{charity.description}</p>
    </div>

    <div className="mt-5 pt-5 border-t border-white/6 flex items-center justify-between">
      <div>
        <div className="text-xs text-warm-white/30 mb-0.5">Total Contributed</div>
        <div className="text-emerald-400 font-semibold text-sm">
          £{(charity.totalContributed || 0).toLocaleString()}
        </div>
      </div>
      <Link to={`/charities/${charity.slug}`} className="btn-secondary !py-2 !px-4 !text-xs">
        View Profile <ChevronRight size={12} />
      </Link>
    </div>
  </motion.div>
);

const Charities = () => {
  const [charities, setCharities] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [page, setPage] = useState(1);

  const fetchCharities = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (searchTerm) params.search = searchTerm;
      if (filterFeatured) params.featured = 'true';
      const res = await charityAPI.getCharities(params);
      setCharities(res.data.data);
      setTotal(res.data.total);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const debounce = setTimeout(fetchCharities, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, filterFeatured, page]);

  return (
    <div className="page-container">
      <Navbar />
      <div className="pt-24 pb-32 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="badge-emerald mb-4 inline-flex">
              <Heart size={10} fill="currentColor" />
              Our Charity Partners
            </span>
            <h1 className="font-display text-5xl md:text-6xl text-warm-white font-bold mt-4 mb-4">
              Give Back Through Golf
            </h1>
            <p className="text-warm-white/45 text-lg max-w-xl mx-auto">
              Choose the cause your subscription supports. Every pound you contribute goes directly to making an impact.
            </p>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-white/30" />
              <input
                type="text"
                placeholder="Search charities..."
                className="input-glass pl-10"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
            <button
              onClick={() => { setFilterFeatured(!filterFeatured); setPage(1); }}
              className={`btn-secondary !px-5 !text-sm whitespace-nowrap ${filterFeatured ? '!bg-emerald-500/15 !border-emerald-500/30 !text-emerald-400' : ''}`}
            >
              {filterFeatured ? '✓ Featured Only' : 'Featured Only'}
            </button>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card p-6 h-56 skeleton" />
              ))}
            </div>
          ) : charities.length === 0 ? (
            <div className="text-center py-20 text-warm-white/30 text-sm">
              No charities found. Try adjusting your search.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {charities.map((charity, i) => (
                  <CharityCard key={charity._id} charity={charity} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {total > 12 && (
                <div className="flex items-center justify-center gap-3 mt-10">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="btn-secondary !py-2 !px-5 !text-sm disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <span className="text-warm-white/40 text-sm">Page {page} of {Math.ceil(total / 12)}</span>
                  <button
                    disabled={page >= Math.ceil(total / 12)}
                    onClick={() => setPage(page + 1)}
                    className="btn-secondary !py-2 !px-5 !text-sm disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Charities;
