const User = require('../models/User');
const Draw = require('../models/Draw');
const WinnerVerification = require('../models/WinnerVerification');
const asyncHandler = require('../utils/asyncHandler');
const { SCORE_MIN, SCORE_MAX, MAX_SCORES } = require('../utils/constants');

// ── GET /api/user/me ───────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('selectedCharityId', 'name slug logoUrl')
    .lean();
  res.json({ success: true, data: user });
});

// ── PUT /api/user/profile ──────────────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name },
    { new: true, runValidators: true }
  ).populate('selectedCharityId', 'name slug logoUrl').lean();
  res.json({ success: true, data: user });
});

// ── PUT /api/user/charity ──────────────────────────────────────────────────────
exports.updateCharity = asyncHandler(async (req, res) => {
  const { charityId, charityContributionPercent } = req.body;
  const update = {};
  if (charityId !== undefined) update.selectedCharityId = charityId;
  if (charityContributionPercent !== undefined) update.charityContributionPercent = charityContributionPercent;

  const user = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
    runValidators: true,
  }).populate('selectedCharityId', 'name slug logoUrl').lean();

  res.json({ success: true, data: user });
});

// ── GET /api/user/scores ───────────────────────────────────────────────────────
exports.getScores = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('scores').lean();
  const sorted = [...user.scores].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ success: true, data: sorted });
});

// ── POST /api/user/scores ──────────────────────────────────────────────────────
exports.addScore = asyncHandler(async (req, res) => {
  const { score, date } = req.body;

  // Range validation
  if (score < SCORE_MIN || score > SCORE_MAX) {
    return res.status(400).json({
      success: false,
      message: `Score must be between ${SCORE_MIN} and ${SCORE_MAX}`,
    });
  }

  const user = await User.findById(req.user._id);

  // Duplicate date check
  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);

  const duplicateDate = user.scores.some((s) => {
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === inputDate.getTime();
  });

  if (duplicateDate) {
    return res.status(400).json({
      success: false,
      message: 'A score for this date already exists',
    });
  }

  // Add score and enforce rolling window of 5
  user.scores.push({ score, date: inputDate });
  user.scores.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (user.scores.length > MAX_SCORES) {
    user.scores = user.scores.slice(0, MAX_SCORES);
  }

  await user.save();
  res.status(201).json({ success: true, data: user.scores });
});

// ── PUT /api/user/scores/:id ───────────────────────────────────────────────────
exports.updateScore = asyncHandler(async (req, res) => {
  const { score, date } = req.body;
  const user = await User.findById(req.user._id);

  const scoreEntry = user.scores.id(req.params.id);
  if (!scoreEntry) {
    return res.status(404).json({ success: false, message: 'Score not found' });
  }

  // Validate range
  if (score < SCORE_MIN || score > SCORE_MAX) {
    return res.status(400).json({
      success: false,
      message: `Score must be between ${SCORE_MIN} and ${SCORE_MAX}`,
    });
  }

  // Check duplicate date (excluding current entry)
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  const duplicateDate = user.scores.some((s) => {
    if (s._id.toString() === req.params.id) return false;
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === newDate.getTime();
  });

  if (duplicateDate) {
    return res.status(400).json({
      success: false,
      message: 'A score for this date already exists',
    });
  }

  scoreEntry.score = score;
  scoreEntry.date = newDate;
  await user.save();

  res.json({ success: true, data: user.scores });
});

// ── DELETE /api/user/scores/:id ───────────────────────────────────────────────
exports.deleteScore = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const scoreEntry = user.scores.id(req.params.id);
  if (!scoreEntry) {
    return res.status(404).json({ success: false, message: 'Score not found' });
  }
  user.scores.pull(req.params.id);
  await user.save();
  res.json({ success: true, data: user.scores });
});

// ── GET /api/user/draws ────────────────────────────────────────────────────────
exports.getUserDraws = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const draws = await Draw.find({ 'results.userId': req.user._id })
    .select('month status winningNumbers results prizePoolSnapshot createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Filter results to only this user's result
  const userDraws = draws.map((draw) => ({
    ...draw,
    myResult: draw.results.find((r) => r.userId.toString() === req.user._id.toString()) || null,
    results: undefined,
  }));

  res.json({ success: true, data: userDraws, page, limit });
});

// ── GET /api/user/winnings ─────────────────────────────────────────────────────
exports.getWinnings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('totalWinnings').lean();

  const verifications = await WinnerVerification.find({ userId: req.user._id })
    .populate('drawId', 'month')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: {
      totalWinnings: user.totalWinnings,
      verifications,
    },
  });
});

// ── POST /api/winners/:id/upload-proof ─────────────────────────────────────────
exports.uploadProof = asyncHandler(async (req, res) => {
  const { proofUrl } = req.body;
  if (!proofUrl) return res.status(400).json({ success: false, message: 'Proof URL is required' });

  const verification = await WinnerVerification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { proofUrl, status: 'pending' },
    { new: true }
  );

  if (!verification) {
    return res.status(404).json({ success: false, message: 'Verification record not found or does not belong to you' });
  }

  res.json({ success: true, data: verification, message: 'Proof uploaded successfully' });
});
