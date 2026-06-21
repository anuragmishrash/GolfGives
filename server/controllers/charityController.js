const { supabase } = require('../lib/supabase');
const asyncHandler = require('../utils/asyncHandler');

// ── GET /api/charities ─────────────────────────────────────────────────────────
exports.getCharities = asyncHandler(async (req, res) => {
  const { search, featured, page = 1, limit = 12 } = req.query;
  const from = (parseInt(page) - 1) * parseInt(limit);
  const to = from + parseInt(limit) - 1;

  let query = supabase
    .from('charities')
    .select('id, name, slug, description, image_url, banner_url, is_featured, total_contributed', { count: 'exact' })
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) query = query.ilike('name', `%${search}%`);
  if (featured === 'true') query = query.eq('is_featured', true);

  const { data: charities, error, count } = await query;
  if (error) throw new Error(error.message);

  // Normalize for frontend (logoUrl alias)
  const normalized = (charities || []).map(normalizeCharity);

  res.json({
    success: true,
    data: normalized,
    total: count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
  });
});

// ── GET /api/charities/:slug ───────────────────────────────────────────────────
exports.getCharityBySlug = asyncHandler(async (req, res) => {
  const { data: charity, error } = await supabase
    .from('charities')
    .select('*')
    .eq('slug', req.params.slug)
    .eq('is_active', true)
    .single();

  if (error || !charity) {
    return res.status(404).json({ success: false, message: 'Charity not found' });
  }

  res.json({ success: true, data: normalizeCharity(charity) });
});

// ── POST /api/admin/charities ──────────────────────────────────────────────────
exports.createCharity = asyncHandler(async (req, res) => {
  const { name, slug, description, image_url, logoUrl, banner_url, bannerUrl, website, events, is_featured, isFeatured } = req.body;

  const { data: charity, error } = await supabase
    .from('charities')
    .insert({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      image_url: image_url || logoUrl || null,
      banner_url: banner_url || bannerUrl || null,
      website: website || null,
      events: events || [],
      is_featured: is_featured ?? isFeatured ?? false,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'A charity with this slug already exists' });
    }
    throw new Error(error.message);
  }

  res.status(201).json({ success: true, data: normalizeCharity(charity) });
});

// ── PUT /api/admin/charities/:id ───────────────────────────────────────────────
exports.updateCharity = asyncHandler(async (req, res) => {
  const { name, slug, description, image_url, logoUrl, banner_url, bannerUrl, website, events, is_featured, isFeatured, is_active } = req.body;

  const update = {};
  if (name !== undefined) update.name = name;
  if (slug !== undefined) update.slug = slug;
  if (description !== undefined) update.description = description;
  if (image_url !== undefined || logoUrl !== undefined) update.image_url = image_url || logoUrl;
  if (banner_url !== undefined || bannerUrl !== undefined) update.banner_url = banner_url || bannerUrl;
  if (website !== undefined) update.website = website;
  if (events !== undefined) update.events = events;
  if (is_featured !== undefined || isFeatured !== undefined) update.is_featured = is_featured ?? isFeatured;
  if (is_active !== undefined) update.is_active = is_active;

  const { data: charity, error } = await supabase
    .from('charities')
    .update(update)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!charity) return res.status(404).json({ success: false, message: 'Charity not found' });

  res.json({ success: true, data: normalizeCharity(charity) });
});

// ── DELETE /api/admin/charities/:id ───────────────────────────────────────────
exports.deleteCharity = asyncHandler(async (req, res) => {
  // Soft-delete (set is_active = false)
  const { data: charity, error } = await supabase
    .from('charities')
    .update({ is_active: false })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!charity) return res.status(404).json({ success: false, message: 'Charity not found' });

  res.json({ success: true, message: 'Charity deactivated successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize charity DB row → camelCase for frontend (preserves logoUrl alias)
 */
function normalizeCharity(c) {
  if (!c) return null;
  return {
    _id: c.id,
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    logoUrl: c.image_url,
    image_url: c.image_url,
    bannerUrl: c.banner_url,
    banner_url: c.banner_url,
    website: c.website,
    upcomingEvents: c.events || [],
    events: c.events || [],
    isFeatured: c.is_featured,
    is_featured: c.is_featured,
    isActive: c.is_active,
    is_active: c.is_active,
    totalContributed: c.total_contributed,
    createdAt: c.created_at,
  };
}
