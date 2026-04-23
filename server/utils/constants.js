/**
 * Application-wide constants
 */

const PRIZE_POOL_SPLIT = {
  FIVE_MATCH: 0.40,   // 40% of prize pool to 5-match winners
  FOUR_MATCH: 0.35,   // 35% of prize pool to 4-match winners
  THREE_MATCH: 0.25,  // 25% of prize pool to 3-match winners
};

const PRIZE_POOL_FROM_SUBSCRIPTION = 0.70; // 70% of post-charity amount goes to prize pool

const CHARITY_MIN_PERCENT = 10;
const CHARITY_MAX_PERCENT = 50;

const SCORE_MIN = 1;
const SCORE_MAX = 45;
const MAX_SCORES = 5;

const DRAW_NUMBERS_COUNT = 5;
const DRAW_NUMBER_MIN = 1;
const DRAW_NUMBER_MAX = 45;

const ROLES = {
  SUBSCRIBER: 'subscriber',
  ADMIN: 'admin',
};

const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CANCELLED: 'cancelled',
  LAPSED: 'lapsed',
};

const DRAW_STATUS = {
  PENDING: 'pending',
  SIMULATED: 'simulated',
  PUBLISHED: 'published',
};

module.exports = {
  PRIZE_POOL_SPLIT,
  PRIZE_POOL_FROM_SUBSCRIPTION,
  CHARITY_MIN_PERCENT,
  CHARITY_MAX_PERCENT,
  SCORE_MIN,
  SCORE_MAX,
  MAX_SCORES,
  DRAW_NUMBERS_COUNT,
  DRAW_NUMBER_MIN,
  DRAW_NUMBER_MAX,
  ROLES,
  SUBSCRIPTION_STATUS,
  DRAW_STATUS,
};
