const {
  DRAW_NUMBER_MIN,
  DRAW_NUMBER_MAX,
  DRAW_NUMBERS_COUNT,
} = require('../utils/constants');
const User = require('../models/User');

/**
 * Generate 5 unique random numbers from 1–45.
 */
const randomDraw = () => {
  const numbers = [];
  while (numbers.length < DRAW_NUMBERS_COUNT) {
    const n = Math.floor(Math.random() * (DRAW_NUMBER_MAX - DRAW_NUMBER_MIN + 1)) + DRAW_NUMBER_MIN;
    if (!numbers.includes(n)) numbers.push(n);
  }
  return numbers.sort((a, b) => a - b);
};

/**
 * Algorithmic draw — weight numbers by LEAST frequently entered across all active users' scores.
 * This encourages users to enter low-frequency scores (engagement mechanism).
 */
const algorithmicDraw = async () => {
  // Tally how many times each number 1–45 appears across active users' scores
  const activeUsers = await User.find({ subscriptionStatus: 'active' }).select('scores').lean();

  const frequency = {};
  for (let i = DRAW_NUMBER_MIN; i <= DRAW_NUMBER_MAX; i++) frequency[i] = 0;

  for (const user of activeUsers) {
    for (const entry of user.scores || []) {
      if (entry.score >= DRAW_NUMBER_MIN && entry.score <= DRAW_NUMBER_MAX) {
        frequency[entry.score]++;
      }
    }
  }

  // Sort by frequency ascending (least used first)
  const sorted = Object.entries(frequency).sort((a, b) => a[1] - b[1] || Math.random() - 0.5);

  // Pick the 5 least-used numbers (with a bit of randomisation for ties)
  const numbers = sorted.slice(0, DRAW_NUMBERS_COUNT).map(([n]) => parseInt(n));
  return numbers.sort((a, b) => a - b);
};

/**
 * runDraw — main entry point.
 * @param {string} drawId  — The Draw document _id (unused currently but useful for hooks)
 * @param {'random'|'algorithmic'} type
 * @returns {number[]} — Array of 5 winning numbers
 */
const runDraw = async (drawId, type = 'random') => {
  if (type === 'algorithmic') return algorithmicDraw();
  return randomDraw();
};

/**
 * matchUserScores — compares each eligible user's 5 score VALUES against the winning numbers.
 * Only users with exactly 5 scores are included.
 * 
 * @param {number[]} winningNumbers — 5 drawn numbers
 * @param {Object[]} eligibleUsers  — users with active subs + 5 scores
 * @returns {{ userId, matchType }[]}
 */
const matchUserScores = (winningNumbers, eligibleUsers) => {
  const winningSet = new Set(winningNumbers);
  const results = [];

  for (const user of eligibleUsers) {
    if (!user.scores || user.scores.length !== 5) continue;

    const userValues = [...new Set(user.scores.map((s) => s.score))]; // unique values
    const matches = userValues.filter((v) => winningSet.has(v)).length;

    if (matches === 5) results.push({ userId: user._id, matchType: '5-match' });
    else if (matches === 4) results.push({ userId: user._id, matchType: '4-match' });
    else if (matches === 3) results.push({ userId: user._id, matchType: '3-match' });
  }

  return results;
};

/**
 * calculatePrizes — splits prize pool tiers equally among tier winners.
 * If no 5-match winners, flags jackpot for rollover.
 * 
 * @param {{ userId, matchType }[]} matchResults
 * @param {{ fiveMatch, fourMatch, threeMatch }} prizePoolSnapshot — amounts in dollars
 * @returns {{ userId, matchType, prizeAmount }[]}
 */
const calculatePrizes = (matchResults, prizePoolSnapshot) => {
  const fiveMatchWinners = matchResults.filter((r) => r.matchType === '5-match');
  const fourMatchWinners = matchResults.filter((r) => r.matchType === '4-match');
  const threeMatchWinners = matchResults.filter((r) => r.matchType === '3-match');

  const prizes = [];

  // 5-match: split fiveMatch pool equally (jackpot rollover if no winners)
  for (const w of fiveMatchWinners) {
    prizes.push({
      userId: w.userId,
      matchType: '5-match',
      prizeAmount: fiveMatchWinners.length > 0
        ? parseFloat((prizePoolSnapshot.fiveMatch / fiveMatchWinners.length).toFixed(2))
        : 0,
    });
  }

  // 4-match: split fourMatch pool equally
  for (const w of fourMatchWinners) {
    prizes.push({
      userId: w.userId,
      matchType: '4-match',
      prizeAmount: fourMatchWinners.length > 0
        ? parseFloat((prizePoolSnapshot.fourMatch / fourMatchWinners.length).toFixed(2))
        : 0,
    });
  }

  // 3-match: split threeMatch pool equally
  for (const w of threeMatchWinners) {
    prizes.push({
      userId: w.userId,
      matchType: '3-match',
      prizeAmount: threeMatchWinners.length > 0
        ? parseFloat((prizePoolSnapshot.threeMatch / threeMatchWinners.length).toFixed(2))
        : 0,
    });
  }

  return prizes;
};

module.exports = { runDraw, matchUserScores, calculatePrizes };
