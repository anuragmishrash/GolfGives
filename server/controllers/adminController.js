const { supabase } = require('../lib/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { runDraw, matchUserScores, calculatePrizes } = require('../services/drawEngine');
const emailService = require('../services/emailService');

// ── GET /api/admin/users ───────────────────────────────────────────────────────
exports.getUsers = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  const from = (parseInt(page) - 1) * parseInt(limit);
  const to = from + parseInt(limit) - 1;

  let query = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      subscription_status,
      subscription_plan,
      subscription_renewal_date,
      stripe_customer_id,
      stripe_subscription_id,
      charity_percentage,
      total_winnings,
      created_at,
      charities ( id, name, slug )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('subscription_status', status);
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: users, error, count } = await query;
  if (error) throw new Error(error.message);

  const normalized = (users || []).map(u => ({
    _id: u.id,
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: u.role,
    subscriptionStatus: u.subscription_status,
    subscriptionPlan: u.subscription_plan,
    subscriptionRenewalDate: u.subscription_renewal_date,
    stripeCustomerId: u.stripe_customer_id,
    stripeSubscriptionId: u.stripe_subscription_id,
    charityContributionPercent: u.charity_percentage,
    totalWinnings: u.total_winnings,
    selectedCharityId: u.charities || null,
    createdAt: u.created_at,
  }));

  res.json({
    success: true,
    data: normalized,
    total: count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
  });
});

// ── PUT /api/admin/users/:id ───────────────────────────────────────────────────
exports.updateUser = asyncHandler(async (req, res) => {
  const { role, subscriptionStatus } = req.body;
  const update = {};
  if (role !== undefined) update.role = role;
  if (subscriptionStatus !== undefined) update.subscription_status = subscriptionStatus;

  const { data: user, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  res.json({ success: true, data: user });
});

// ── GET /api/admin/draws ───────────────────────────────────────────────────────
exports.getDraws = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const from = (parseInt(page) - 1) * parseInt(limit);
  const to = from + parseInt(limit) - 1;

  const { data: draws, error, count } = await supabase
    .from('draws')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  res.json({ success: true, data: normalizeDraws(draws), total: count || 0 });
});

// ── GET /api/admin/draws/:id ───────────────────────────────────────────────────
exports.getDrawById = asyncHandler(async (req, res) => {
  const { data: draw, error } = await supabase
    .from('draws')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !draw) {
    return res.status(404).json({ success: false, message: 'Draw not found' });
  }

  // Fetch draw results with user info
  const { data: results } = await supabase
    .from('draw_results')
    .select(`
      id,
      match_type,
      prize_amount,
      payment_status,
      verification_status,
      proof_url,
      created_at,
      profiles!inner ( id, full_name, email )
    `)
    .eq('draw_id', req.params.id);

  const normalized = normalizeDraw(draw);
  normalized.results = (results || []).map(r => ({
    _id: r.id,
    userId: { _id: r.profiles.id, name: r.profiles.full_name, email: r.profiles.email },
    matchType: r.match_type,
    prizeAmount: r.prize_amount,
    paymentStatus: r.payment_status,
    verificationStatus: r.verification_status,
    proofUrl: r.proof_url,
  }));

  res.json({ success: true, data: normalized });
});

// ── POST /api/admin/draws/simulate ────────────────────────────────────────────
exports.simulateDraw = asyncHandler(async (req, res) => {
  const { month, drawType = 'random' } = req.body;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ success: false, message: 'Valid month (YYYY-MM) is required' });
  }

  // Get or create draw for this month
  let { data: draw } = await supabase
    .from('draws')
    .select('*')
    .eq('draw_month', month)
    .single();

  if (draw && draw.status === 'published') {
    return res.status(400).json({
      success: false,
      message: 'The draw for this month has already been published and cannot be altered.',
    });
  }

  if (!draw) {
    const { data: newDraw, error: createError } = await supabase
      .from('draws')
      .insert({ draw_month: month, draw_type: drawType, status: 'pending', winning_numbers: [] })
      .select()
      .single();
    if (createError) throw new Error(createError.message);
    draw = newDraw;
  }

  // Calculate prize pool from active subscription records
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('prize_pool_contribution')
    .eq('status', 'active');

  const prizePoolTotal = ((activeSubs || []).reduce((sum, s) => sum + (s.prize_pool_contribution || 0), 0)) / 100;
  const prizePoolSnapshot = {
    fiveMatch: (prizePoolTotal * 0.40) + (draw.jackpot_amount || 0),
    fourMatch: prizePoolTotal * 0.35,
    threeMatch: prizePoolTotal * 0.25,
  };

  // Run draw algorithm
  const winningNumbers = await runDraw(draw.id, drawType);

  // Get all eligible users: active subscription + exactly 5 scores
  const { data: activeProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('subscription_status', 'active');

  const eligibleUsers = [];
  for (const profile of (activeProfiles || [])) {
    const { data: userScores } = await supabase
      .from('scores')
      .select('id, score, score_date')
      .eq('user_id', profile.id)
      .order('score_date', { ascending: false });

    if (userScores && userScores.length === 5) {
      eligibleUsers.push({
        _id: profile.id,
        scores: userScores.map(s => ({ score: s.score, date: s.score_date })),
      });
    }
  }

  const matchResults = matchUserScores(winningNumbers, eligibleUsers);
  const prizes = calculatePrizes(matchResults, prizePoolSnapshot);
  const hasJackpotWinner = prizes.some(p => p.matchType === '5-match');

  // Store in simulation_cache (upsert)
  await supabase
    .from('simulation_cache')
    .upsert({
      draw_id: draw.id,
      simulation_result: { winningNumbers, matchResults, prizes, prizePoolSnapshot, hasJackpotWinner },
      cached_at: new Date().toISOString(),
    });

  // Update draw to simulated status
  const { data: updatedDraw, error: updateError } = await supabase
    .from('draws')
    .update({
      status: 'simulated',
      draw_type: drawType,
      winning_numbers: winningNumbers,
      prize_pool_five: prizePoolSnapshot.fiveMatch,
      prize_pool_four: prizePoolSnapshot.fourMatch,
      prize_pool_three: prizePoolSnapshot.threeMatch,
      jackpot_rolled_over: !hasJackpotWinner,
      simulation_note: `Simulated on ${new Date().toISOString()} — ${prizes.length} winner(s) found`,
    })
    .eq('id', draw.id)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  res.json({
    success: true,
    data: {
      draw: normalizeDraw(updatedDraw),
      simulation: {
        winningNumbers,
        prizes,
        prizePoolSnapshot,
        hasJackpotWinner,
        totalEligibleUsers: eligibleUsers.length,
      },
    },
  });
});

// ── POST /api/admin/draws/publish ─────────────────────────────────────────────
exports.publishDraw = asyncHandler(async (req, res) => {
  const { drawId } = req.body;

  const { data: draw, error: drawError } = await supabase
    .from('draws')
    .select('*')
    .eq('id', drawId)
    .single();

  if (drawError || !draw) {
    return res.status(404).json({ success: false, message: 'Draw not found' });
  }
  if (draw.status !== 'simulated') {
    return res.status(400).json({
      success: false,
      message: 'Draw must be simulated before publishing. Please simulate first.',
    });
  }

  // Retrieve cached simulation
  const { data: cache } = await supabase
    .from('simulation_cache')
    .select('simulation_result')
    .eq('draw_id', drawId)
    .single();

  if (!cache) {
    return res.status(400).json({ success: false, message: 'Simulation cache expired. Please re-simulate.' });
  }

  const { prizes, prizePoolSnapshot } = cache.simulation_result;
  const hasJackpotWinner = prizes.some(p => p.matchType === '5-match');

  // Insert winner records into draw_results
  if (prizes.length > 0) {
    const resultsToInsert = prizes.map(p => ({
      draw_id: drawId,
      user_id: p.userId,
      match_type: p.matchType,
      prize_amount: p.prizeAmount,
      payment_status: 'pending',
      verification_status: 'pending',
    }));

    const { error: insertError } = await supabase
      .from('draw_results')
      .insert(resultsToInsert);

    if (insertError) throw new Error(insertError.message);
  }

  // Handle jackpot rollover — carry forward to next month's draw
  if (!hasJackpotWinner && prizePoolSnapshot.fiveMatch > 0) {
    const [year, mon] = draw.draw_month.split('-').map(Number);
    const nextMon = mon === 12 ? 1 : mon + 1;
    const nextYear = mon === 12 ? year + 1 : year;
    const nextMonth = `${nextYear}-${String(nextMon).padStart(2, '0')}`;

    // Upsert next month's draw with jackpot amount added
    const { data: nextDraw } = await supabase
      .from('draws')
      .select('jackpot_amount')
      .eq('draw_month', nextMonth)
      .single();

    if (nextDraw) {
      await supabase
        .from('draws')
        .update({ jackpot_amount: (nextDraw.jackpot_amount || 0) + prizePoolSnapshot.fiveMatch })
        .eq('draw_month', nextMonth);
    } else {
      await supabase
        .from('draws')
        .insert({
          draw_month: nextMonth,
          status: 'pending',
          winning_numbers: [],
          jackpot_amount: prizePoolSnapshot.fiveMatch,
        });
    }
  }

  // Update total winnings for each winner's profile
  for (const prize of prizes) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_winnings')
      .eq('id', prize.userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ total_winnings: (profile.total_winnings || 0) + prize.prizeAmount })
        .eq('id', prize.userId);
    }
  }

  // Publish the draw
  const { data: publishedDraw, error: pubError } = await supabase
    .from('draws')
    .update({
      status: 'published',
      jackpot_rolled_over: !hasJackpotWinner,
    })
    .eq('id', drawId)
    .select()
    .single();

  if (pubError) throw new Error(pubError.message);

  // Send emails to all active subscribers
  const { data: allActiveProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, charities(name)')
    .eq('subscription_status', 'active');

  for (const profile of (allActiveProfiles || [])) {
    const userResult = prizes.find(p => p.userId === profile.id);

    // Check participation (5 scores)
    const { count: scoreCount } = await supabase
      .from('scores')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    const participated = scoreCount === 5;
    const matchType = userResult?.matchType || null;
    const prizeAmount = userResult?.prizeAmount || 0;

    emailService.sendDrawPublishedEmail({
      name: profile.full_name,
      email: profile.email,
      month: draw.draw_month,
      participated,
      matchType,
      prizeAmount,
    }).catch(console.error);

    if (matchType) {
      emailService.sendWinnerVerificationRequestEmail({
        name: profile.full_name,
        email: profile.email,
        matchType,
        prizeAmount,
      }).catch(console.error);
    }
  }

  res.json({ success: true, data: normalizeDraw(publishedDraw) });
});

// ── GET /api/admin/winners ────────────────────────────────────────────────────
exports.getWinners = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const from = (parseInt(page) - 1) * parseInt(limit);
  const to = from + parseInt(limit) - 1;

  let query = supabase
    .from('draw_results')
    .select(`
      id,
      match_type,
      prize_amount,
      payment_status,
      verification_status,
      proof_url,
      admin_note,
      reviewed_at,
      created_at,
      profiles!inner ( id, full_name, email ),
      draws!inner ( id, draw_month )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('verification_status', status);

  const { data: winners, error, count } = await query;
  if (error) throw new Error(error.message);

  const normalized = (winners || []).map(w => ({
    _id: w.id,
    matchType: w.match_type,
    prizeAmount: w.prize_amount,
    paymentStatus: w.payment_status,
    status: w.verification_status,
    proofUrl: w.proof_url,
    adminNote: w.admin_note,
    reviewedAt: w.reviewed_at,
    createdAt: w.created_at,
    userId: { _id: w.profiles.id, name: w.profiles.full_name, email: w.profiles.email },
    drawId: { _id: w.draws.id, month: w.draws.draw_month },
  }));

  res.json({ success: true, data: normalized, total: count || 0 });
});

// ── PUT /api/admin/winners/:id/verify ─────────────────────────────────────────
exports.verifyWinner = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
  }

  const { data: winner, error } = await supabase
    .from('draw_results')
    .update({
      verification_status: status,
      admin_note: adminNote || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select(`
      id, match_type, prize_amount, verification_status, admin_note, reviewed_at,
      profiles!inner ( id, full_name, email )
    `)
    .single();

  if (error) throw new Error(error.message);
  if (!winner) return res.status(404).json({ success: false, message: 'Winner not found' });

  if (status === 'approved') {
    emailService.sendWinnerApprovedEmail({
      name: winner.profiles.full_name,
      email: winner.profiles.email,
      prizeAmount: winner.prize_amount,
      paymentMethod: 'Bank Transfer',
    }).catch(console.error);
  }

  if (status === 'rejected') {
    emailService.sendWinnerRejectedEmail({
      name: winner.profiles.full_name,
      email: winner.profiles.email,
      prizeAmount: winner.prize_amount,
      adminNote: adminNote || null,
    }).catch(console.error);
  }

  res.json({ success: true, data: winner });
});

// ── PUT /api/admin/winners/:id/payout ─────────────────────────────────────────
exports.markPayout = asyncHandler(async (req, res) => {
  const { data: winner, error } = await supabase
    .from('draw_results')
    .select(`
      id, prize_amount, verification_status,
      profiles!inner ( id, full_name, email )
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !winner) {
    return res.status(404).json({ success: false, message: 'Winner not found' });
  }
  if (winner.verification_status !== 'approved') {
    return res.status(400).json({ success: false, message: 'Winner must be approved before payout' });
  }

  // Mark payment as paid
  await supabase
    .from('draw_results')
    .update({ payment_status: 'paid' })
    .eq('id', req.params.id);

  emailService.sendPayoutCompletedEmail({
    name: winner.profiles.full_name,
    email: winner.profiles.email,
    prizeAmount: winner.prize_amount,
    paymentReference: req.body.paymentReference || `GG-${Date.now()}`,
  }).catch(console.error);

  res.json({ success: true, message: 'Payout marked successfully' });
});

// ── GET /api/admin/analytics ──────────────────────────────────────────────────
exports.getAnalytics = asyncHandler(async (req, res) => {
  const [
    { count: totalUsers },
    { count: activeSubscribers },
    { data: charityData },
    { data: draws },
    { data: subsData },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    supabase.from('charities').select('name, total_contributed').eq('is_active', true),
    supabase.from('draws').select('status'),
    supabase.from('subscriptions').select('prize_pool_contribution, charity_contribution, amount, created_at'),
  ]);

  // Aggregate prize pool + charity totals
  const poolTotals = (subsData || []).reduce((acc, s) => {
    acc.total += s.prize_pool_contribution || 0;
    acc.charity += s.charity_contribution || 0;
    return acc;
  }, { total: 0, charity: 0 });

  // Draw stats by status
  const drawStats = (draws || []).reduce((acc, d) => {
    const key = d.status;
    const existing = acc.find(x => x._id === key);
    if (existing) existing.count++;
    else acc.push({ _id: key, count: 1 });
    return acc;
  }, []);

  // Subscriptions over time (last 12 months)
  const subsOverTime = {};
  (subsData || []).forEach(s => {
    const month = new Date(s.created_at).toISOString().slice(0, 7);
    if (!subsOverTime[month]) subsOverTime[month] = { _id: month, count: 0, revenue: 0 };
    subsOverTime[month].count++;
    subsOverTime[month].revenue += s.amount || 0;
  });
  const subsOverTimeArr = Object.values(subsOverTime)
    .sort((a, b) => a._id.localeCompare(b._id))
    .slice(-12);

  res.json({
    success: true,
    data: {
      totalUsers: totalUsers || 0,
      activeSubscribers: activeSubscribers || 0,
      totalPrizePool: poolTotals.total / 100,
      totalCharityContributed: poolTotals.charity / 100,
      charityBreakdown: charityData || [],
      drawStats,
      subsOverTime: subsOverTimeArr,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function normalizeDraw(d) {
  if (!d) return null;
  return {
    _id: d.id,
    id: d.id,
    month: d.draw_month,
    drawType: d.draw_type,
    winningNumbers: d.winning_numbers,
    status: d.status,
    jackpotAmount: d.jackpot_amount,
    jackpotRolledOver: d.jackpot_rolled_over,
    prizePoolSnapshot: {
      fiveMatch: d.prize_pool_five,
      fourMatch: d.prize_pool_four,
      threeMatch: d.prize_pool_three,
    },
    simulationNote: d.simulation_note,
    createdAt: d.created_at,
  };
}

function normalizeDraws(draws) {
  return (draws || []).map(normalizeDraw);
}
