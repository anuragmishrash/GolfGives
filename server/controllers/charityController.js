const Charity = require('../models/Charity');
const asyncHandler = require('../utils/asyncHandler');

// ── GET /api/charities ─────────────────────────────────────────────────────────
exports.getCharities = asyncHandler(async (req, res) => {
  const { search, featured, page = 1, limit = 12 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { isActive: true };
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (featured === 'true') filter.isFeatured = true;

  const [charities, total] = await Promise.all([
    Charity.find(filter)
      .select('name slug description logoUrl bannerUrl isFeatured totalContributed')
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Charity.countDocuments(filter),
  ]);

  res.json({ success: true, data: charities, total, page: parseInt(page), limit: parseInt(limit) });
});

// ── GET /api/charities/:slug ───────────────────────────────────────────────────
exports.getCharityBySlug = asyncHandler(async (req, res) => {
  const charity = await Charity.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!charity) {
    return res.status(404).json({ success: false, message: 'Charity not found' });
  }
  res.json({ success: true, data: charity });
});

// ── POST /api/admin/charities ──────────────────────────────────────────────────
exports.createCharity = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  const charity = await Charity.create(req.body);
  res.status(201).json({ success: true, data: charity });
});

// ── PUT /api/admin/charities/:id ───────────────────────────────────────────────
exports.updateCharity = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  const charity = await Charity.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).lean();
  if (!charity) {
    return res.status(404).json({ success: false, message: 'Charity not found' });
  }
  res.json({ success: true, data: charity });
});

// ── DELETE /api/admin/charities/:id ───────────────────────────────────────────
exports.deleteCharity = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  const charity = await Charity.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).lean();
  if (!charity) {
    return res.status(404).json({ success: false, message: 'Charity not found' });
  }
  res.json({ success: true, message: 'Charity deactivated successfully' });
});
