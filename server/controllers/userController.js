const { supabase } = require('../lib/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { SCORE_MIN, SCORE_MAX, MAX_SCORES } = require('../utils/constants');

// ── GET /api/user/me ───────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      charities (
        id,
        name,
        slug,
        image_url
      )
    `)
    .eq('id', userId)
    .single();

  if (error) throw new Error(error.message);

  // Normalize field names to camelCase for frontend
  res.json({
    success: true,
    data: normalizeProfile(profile),
  });
});

// ── PUT /api/user/profile ──────────────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ full_name: name })
    .eq('id', userId)
    .select(`*, charities(id, name, slug, image_url)`)
    .single();

  if (error) throw new Error(error.message);
  res.json({ success: true, data: normalizeProfile(profile) });
});

// ── PUT /api/user/charity ──────────────────────────────────────────────────────
exports.updateCharity = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { charityId, charityContributionPercent } = req.body;

  const update = {};
  if (charityId !== undefined) update.charity_id = charityId;
  if (charityContributionPercent !== undefined) update.charity_percentage = charityContributionPercent;

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', userId)
    .select(`*, charities(id, name, slug, image_url)`)
    .single();

  if (error) throw new Error(error.message);
  res.json({ success: true, data: normalizeProfile(profile) });
});

// ── GET /api/user/scores ───────────────────────────────────────────────────────
exports.getScores = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data: scores, error } = await supabase
    .from('scores')
    .select('id, score, score_date, created_at')
    .eq('user_id', userId)
    .order('score_date', { ascending: false });

  if (error) throw new Error(error.message);

  res.json({ success: true, data: normalizeScores(scores) });
});

// ── POST /api/user/scores ──────────────────────────────────────────────────────
exports.addScore = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { score, date } = req.body;

  // 1. Validate score range
  if (score < SCORE_MIN || score > SCORE_MAX) {
    return res.status(400).json({
      success: false,
      message: `Score must be between ${SCORE_MIN} and ${SCORE_MAX}`,
    });
  }

  // 2. Validate date provided
  if (!date) {
    return res.status(400).json({ success: false, message: 'score_date is required' });
  }

  const scoreDate = new Date(date).toISOString().split('T')[0]; // normalize to YYYY-MM-DD

  // 3. Check unique constraint — duplicate date for this user
  const { data: existing } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', userId)
    .eq('score_date', scoreDate)
    .single();

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'A score already exists for this date. Please edit or delete the existing entry.',
    });
  }

  // 4. Count existing scores
  const { count } = await supabase
    .from('scores')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // 5. Rolling window: if >= 5 scores, delete oldest before inserting
  if (count >= MAX_SCORES) {
    const { data: oldest } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', userId)
      .order('score_date', { ascending: true })
      .limit(1)
      .single();

    if (oldest) {
      await supabase.from('scores').delete().eq('id', oldest.id);
    }
  }

  // 6. Insert new score
  const { error: insertError } = await supabase
    .from('scores')
    .insert({ user_id: userId, score: parseInt(score), score_date: scoreDate });

  if (insertError) {
    if (insertError.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'A score for this date already exists. Edit or delete it instead.',
      });
    }
    throw new Error(insertError.message);
  }

  // 7. Return all scores ordered newest first
  const { data: allScores, error: fetchError } = await supabase
    .from('scores')
    .select('id, score, score_date, created_at')
    .eq('user_id', userId)
    .order('score_date', { ascending: false });

  if (fetchError) throw new Error(fetchError.message);

  res.status(201).json({ success: true, data: normalizeScores(allScores) });
});

// ── PUT /api/user/scores/:id ───────────────────────────────────────────────────
exports.updateScore = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { score, date } = req.body;
  const scoreId = req.params.id;

  // Validate ownership
  const { data: existing } = await supabase
    .from('scores')
    .select('id, user_id')
    .eq('id', scoreId)
    .single();

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Score not found' });
  }
  if (existing.user_id !== userId) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  // Validate range
  if (score < SCORE_MIN || score > SCORE_MAX) {
    return res.status(400).json({
      success: false,
      message: `Score must be between ${SCORE_MIN} and ${SCORE_MAX}`,
    });
  }

  const scoreDate = new Date(date).toISOString().split('T')[0];

  // Check duplicate date (excluding current entry)
  const { data: duplicate } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', userId)
    .eq('score_date', scoreDate)
    .neq('id', scoreId)
    .single();

  if (duplicate) {
    return res.status(400).json({
      success: false,
      message: 'A score for this date already exists',
    });
  }

  // Update
  const { error: updateError } = await supabase
    .from('scores')
    .update({ score: parseInt(score), score_date: scoreDate })
    .eq('id', scoreId);

  if (updateError) throw new Error(updateError.message);

  // Return all scores
  const { data: allScores } = await supabase
    .from('scores')
    .select('id, score, score_date, created_at')
    .eq('user_id', userId)
    .order('score_date', { ascending: false });

  res.json({ success: true, data: normalizeScores(allScores) });
});

// ── DELETE /api/user/scores/:id ───────────────────────────────────────────────
exports.deleteScore = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const scoreId = req.params.id;

  // Validate ownership
  const { data: existing } = await supabase
    .from('scores')
    .select('id, user_id')
    .eq('id', scoreId)
    .single();

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Score not found' });
  }
  if (existing.user_id !== userId) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const { error } = await supabase.from('scores').delete().eq('id', scoreId);
  if (error) throw new Error(error.message);

  // Return remaining scores
  const { data: allScores } = await supabase
    .from('scores')
    .select('id, score, score_date, created_at')
    .eq('user_id', userId)
    .order('score_date', { ascending: false });

  res.json({ success: true, data: normalizeScores(allScores) });
});

// ── GET /api/user/draws ────────────────────────────────────────────────────────
exports.getUserDraws = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: results, error, count } = await supabase
    .from('draw_results')
    .select(`
      id,
      match_type,
      prize_amount,
      payment_status,
      verification_status,
      proof_url,
      created_at,
      draws!inner (
        id,
        draw_month,
        status,
        winning_numbers,
        prize_pool_five,
        prize_pool_four,
        prize_pool_three
      )
    `, { count: 'exact' })
    .eq('user_id', userId)
    .eq('draws.status', 'published')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const userDraws = (results || []).map(r => ({
    _id: r.draws.id,
    month: r.draws.draw_month,
    status: r.draws.status,
    winningNumbers: r.draws.winning_numbers,
    prizePoolSnapshot: {
      fiveMatch: r.draws.prize_pool_five,
      fourMatch: r.draws.prize_pool_four,
      threeMatch: r.draws.prize_pool_three,
    },
    myResult: {
      _id: r.id,
      matchType: r.match_type,
      prizeAmount: r.prize_amount,
      paymentStatus: r.payment_status,
      verificationStatus: r.verification_status,
      proofUrl: r.proof_url,
    },
    createdAt: r.draws.created_at,
  }));

  res.json({ success: true, data: userDraws, page, limit, total: count || 0 });
});

// ── GET /api/user/winnings ─────────────────────────────────────────────────────
exports.getWinnings = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_winnings')
    .eq('id', userId)
    .single();

  const { data: verifications, error } = await supabase
    .from('draw_results')
    .select(`
      id,
      match_type,
      prize_amount,
      payment_status,
      verification_status,
      proof_url,
      admin_note,
      created_at,
      draws!inner (
        id,
        draw_month
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const normalizedVerifications = (verifications || []).map(v => ({
    _id: v.id,
    matchType: v.match_type,
    prizeAmount: v.prize_amount,
    paymentStatus: v.payment_status,
    status: v.verification_status,
    proofUrl: v.proof_url,
    adminNote: v.admin_note,
    drawId: { _id: v.draws.id, month: v.draws.draw_month },
    createdAt: v.created_at,
  }));

  res.json({
    success: true,
    data: {
      totalWinnings: profile?.total_winnings || 0,
      verifications: normalizedVerifications,
    },
  });
});

// ── POST /api/winners/:id/upload-proof ─────────────────────────────────────────
exports.uploadProof = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const resultId = req.params.id;
  const { proofUrl } = req.body;

  if (!proofUrl) {
    return res.status(400).json({ success: false, message: 'Proof URL is required' });
  }

  // Validate ownership
  const { data: result } = await supabase
    .from('draw_results')
    .select('id, user_id')
    .eq('id', resultId)
    .single();

  if (!result) {
    return res.status(404).json({ success: false, message: 'Verification record not found or does not belong to you' });
  }
  if (result.user_id !== userId) {
    return res.status(403).json({ success: false, message: 'Verification record not found or does not belong to you' });
  }

  const { data: updated, error } = await supabase
    .from('draw_results')
    .update({ proof_url: proofUrl, verification_status: 'pending' })
    .eq('id', resultId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  res.json({ success: true, data: updated, message: 'Proof uploaded successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize profile row to camelCase for frontend compatibility
 */
function normalizeProfile(profile) {
  if (!profile) return null;
  return {
    _id: profile.id,
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    subscriptionStatus: profile.subscription_status,
    subscriptionPlan: profile.subscription_plan,
    subscriptionRenewalDate: profile.subscription_renewal_date,
    stripeCustomerId: profile.stripe_customer_id,
    stripeSubscriptionId: profile.stripe_subscription_id,
    selectedCharityId: profile.charities || profile.charity_id,
    charityContributionPercent: profile.charity_percentage,
    totalWinnings: profile.total_winnings,
    createdAt: profile.created_at,
  };
}

/**
 * Normalize score rows from snake_case DB columns to camelCase
 */
function normalizeScores(scores) {
  if (!scores) return [];
  return scores.map(s => ({
    _id: s.id,
    id: s.id,
    score: s.score,
    date: s.score_date,
    createdAt: s.created_at,
  }));
}
