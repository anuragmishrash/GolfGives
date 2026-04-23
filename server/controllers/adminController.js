const User = require('../models/User');
const Draw = require('../models/Draw');
const Charity = require('../models/Charity');
const Subscription = require('../models/Subscription');
const WinnerVerification = require('../models/WinnerVerification');
const SummaryCache = require('../models/SummaryCache');
const asyncHandler = require('../utils/asyncHandler');
const { runDraw, matchUserScores, calculatePrizes } = require('../services/drawEngine');
const emailService = require('../services/emailService');

// ── GET /api/admin/users ───────────────────────────────────────────────────────
exports.getUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  const { search, status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  if (status) filter.subscriptionStatus = status;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash -refreshToken')
      .populate('selectedCharityId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: users, total, page: parseInt(page), limit: parseInt(limit) });
});

// ── PUT /api/admin/users/:id ───────────────────────────────────────────────────
exports.updateUser = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  const { role, subscriptionStatus } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role, subscriptionStatus },
    { new: true, runValidators: true }
  ).select('-passwordHash -refreshToken').lean();

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
});

// ── GET /api/admin/draws ───────────────────────────────────────────────────────
exports.getDraws = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [draws, total] = await Promise.all([
    Draw.find().sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    Draw.countDocuments(),
  ]);

  res.json({ success: true, data: draws, total });
});

// ── POST /api/admin/draws/simulate ────────────────────────────────────────────
exports.simulateDraw = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  const { month, drawType = 'random' } = req.body;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ success: false, message: 'Valid month (YYYY-MM) is required' });
  }

  // Get or create the draw document for this month
  let draw = await Draw.findOne({ month });
  
  if (draw && draw.status === 'published') {
    return res.status(400).json({ 
      success: false, 
      message: 'The draw for this month has already been published and cannot be altered.' 
    });
  }

  if (!draw) {
    draw = await Draw.create({ month, drawType, status: 'pending' });
  }

  // Get prize pool snapshot from subscriptions
  const prizePoolAgg = await Subscription.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: null,
        total: { $sum: '$prizePoolContribution' },
      },
    },
  ]);
  const prizePoolTotal = ((prizePoolAgg[0]?.total || 0) / 100);
  const prizePoolSnapshot = {
    fiveMatch: (prizePoolTotal * 0.40) + (draw.jackpotAmount || 0),
    fourMatch: prizePoolTotal * 0.35,
    threeMatch: prizePoolTotal * 0.25,
  };

  // Run the draw simulation
  const winningNumbers = await runDraw(draw._id, drawType);

  // Get all eligible users (active subscription + exactly 5 scores)
  const allUsers = await User.find({ subscriptionStatus: 'active' }).select('scores').lean();
  const eligibleUsers = allUsers.filter((u) => u.scores && u.scores.length === 5);

  const matchResults = matchUserScores(winningNumbers, eligibleUsers);
  const prizes = calculatePrizes(matchResults, prizePoolSnapshot);
  const hasJackpotWinner = prizes.some((p) => p.matchType === '5-match');

  // Cache the simulation result
  await SummaryCache.findOneAndUpdate(
    { drawId: draw._id },
    {
      drawId: draw._id,
      simulationResult: { winningNumbers, matchResults, prizes, prizePoolSnapshot, hasJackpotWinner },
      cachedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // Update draw to simulated status
  draw = await Draw.findByIdAndUpdate(
    draw._id,
    {
      status: 'simulated',
      drawType,
      winningNumbers,
      prizePoolSnapshot,
      jackpotRolledOver: !hasJackpotWinner,
      simulationNote: `Simulated on ${new Date().toISOString()} — ${prizes.length} winner(s) found`,
    },
    { new: true }
  );

  res.json({
    success: true,
    data: {
      draw,
      simulation: { winningNumbers, prizes, prizePoolSnapshot, hasJackpotWinner, totalEligibleUsers: eligibleUsers.length },
    },
  });
});

// ── POST /api/admin/draws/publish ─────────────────────────────────────────────
exports.publishDraw = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  const { drawId } = req.body;
  const draw = await Draw.findById(drawId);

  if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });
  if (draw.status !== 'simulated') {
    return res.status(400).json({
      success: false,
      message: 'Draw must be simulated before publishing. Please simulate first.',
    });
  }
  if (draw.status === 'published') {
    return res.status(400).json({ success: false, message: 'Draw already published' });
  }

  // Retrieve cached simulation
  const cache = await SummaryCache.findOne({ drawId });
  if (!cache) {
    return res.status(400).json({ success: false, message: 'Simulation cache expired. Please re-simulate.' });
  }

  const { prizes, prizePoolSnapshot } = cache.simulationResult;

  // Save results into draw
  draw.results = prizes.map((p) => ({
    userId: p.userId,
    matchType: p.matchType,
    prizeAmount: p.prizeAmount,
    paymentStatus: 'pending',
  }));
  draw.status = 'published';

  // Handle jackpot rollover — if no 5-match winners, carry forward to next month
  const hasJackpotWinner = prizes.some((p) => p.matchType === '5-match');
  if (!hasJackpotWinner && prizePoolSnapshot.fiveMatch > 0) {
    draw.jackpotRolledOver = true;
    draw.jackpotAmount = prizePoolSnapshot.fiveMatch;
    // Find next month's draw (or create it) and add jackpot
    const [year, mon] = draw.month.split('-').map(Number);
    const nextMon = mon === 12 ? 1 : mon + 1;
    const nextYear = mon === 12 ? year + 1 : year;
    const nextMonth = `${nextYear}-${String(nextMon).padStart(2, '0')}`;

    await Draw.findOneAndUpdate(
      { month: nextMonth },
      {
        $inc: { jackpotAmount: prizePoolSnapshot.fiveMatch },
        $setOnInsert: { month: nextMonth, status: 'pending' },
      },
      { upsert: true }
    );
  }

  await draw.save();

  // Create winner verification records + notify winners
  for (const prize of prizes) {
    await WinnerVerification.create({
      userId: prize.userId,
      drawId: draw._id,
      matchType: prize.matchType,
      prizeAmount: prize.prizeAmount,
    });
    // Update user's total winnings
    await User.findByIdAndUpdate(prize.userId, { $inc: { totalWinnings: prize.prizeAmount } });
  }

  const allActiveUsers = await User.find({ subscriptionStatus: 'active' }).populate('selectedCharityId');
  
  for (const user of allActiveUsers) {
    const userResult = draw.results.find(r => r.userId.toString() === user._id.toString());
    const participated = user.scores && user.scores.length === 5;
    const matchType = userResult?.matchType || null;
    const prizeAmount = userResult?.prizeAmount || 0;

    // Send draw result email to every active subscriber
    emailService.sendDrawPublishedEmail({
      name: user.name,
      email: user.email,
      month: draw.month,
      participated,
      matchType,
      prizeAmount
    });

    // Send additional verification request to winners
    if (matchType) {
      emailService.sendWinnerVerificationRequestEmail({
        name: user.name,
        email: user.email,
        matchType,
        prizeAmount
      });
    }
  }

  res.json({ success: true, data: draw });
});

// ── GET /api/admin/draws/:id ───────────────────────────────────────────────────
exports.getDrawById = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  const draw = await Draw.findById(req.params.id)
    .populate('results.userId', 'name email')
    .lean();
  if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });
  res.json({ success: true, data: draw });
});

// ── GET /api/admin/winners ────────────────────────────────────────────────────
exports.getWinners = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = {};
  if (status) filter.status = status;

  const [winners, total] = await Promise.all([
    WinnerVerification.find(filter)
      .populate('userId', 'name email')
      .populate('drawId', 'month')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    WinnerVerification.countDocuments(filter),
  ]);

  res.json({ success: true, data: winners, total });
});

// ── PUT /api/admin/winners/:id/verify ─────────────────────────────────────────
exports.verifyWinner = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  const { status, adminNote } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
  }

  const winner = await WinnerVerification.findByIdAndUpdate(
    req.params.id,
    { status, adminNote, reviewedAt: new Date() },
    { new: true }
  ).populate('userId', 'name email').lean();

  if (!winner) return res.status(404).json({ success: false, message: 'Winner not found' });
  
  if (status === 'approved') {
    await emailService.sendWinnerApprovedEmail({
      name: winner.userId.name,
      email: winner.userId.email,
      prizeAmount: winner.prizeAmount,
      paymentMethod: 'Bank Transfer'
    });
  }

  if (status === 'rejected') {
    await emailService.sendWinnerRejectedEmail({
      name: winner.userId.name,
      email: winner.userId.email,
      prizeAmount: winner.prizeAmount,
      adminNote: adminNote || null
    });
  }

  res.json({ success: true, data: winner });
});

// ── PUT /api/admin/winners/:id/payout ─────────────────────────────────────────
exports.markPayout = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  const winner = await WinnerVerification.findById(req.params.id).populate('userId', 'name email');
  if (!winner) return res.status(404).json({ success: false, message: 'Winner not found' });
  if (winner.status !== 'approved') {
    return res.status(400).json({ success: false, message: 'Winner must be approved before payout' });
  }

  // Mark the draw result as paid
  await Draw.updateOne(
    { _id: winner.drawId, 'results.userId': winner.userId._id },
    { $set: { 'results.$.paymentStatus': 'paid' } }
  );
  
  await emailService.sendPayoutCompletedEmail({
    name: winner.userId.name,
    email: winner.userId.email,
    prizeAmount: winner.prizeAmount,
    paymentReference: req.body.paymentReference || `GG-${Date.now()}`
  });

  res.json({ success: true, message: 'Payout marked successfully' });
});

// ── GET /api/admin/analytics ──────────────────────────────────────────────────
exports.getAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  const [
    totalUsers,
    activeSubscribers,
    prizePoolData,
    charityData,
    drawStats,
    subsOverTime,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ subscriptionStatus: 'active' }),
    Subscription.aggregate([
      { $group: { _id: null, total: { $sum: '$prizePoolContribution' }, charity: { $sum: '$charityContribution' } } },
    ]),
    Charity.find({ isActive: true }).select('name totalContributed').lean(),
    Draw.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Subscription.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      activeSubscribers,
      totalPrizePool: (prizePoolData[0]?.total || 0) / 100,
      totalCharityContributed: (prizePoolData[0]?.charity || 0) / 100,
      charityBreakdown: charityData,
      drawStats,
      subsOverTime,
    },
  });
});
