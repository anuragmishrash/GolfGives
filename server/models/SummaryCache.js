const mongoose = require('mongoose');

const summaryCacheSchema = new mongoose.Schema({
  drawId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Draw',
    required: true,
    unique: true,
  },
  simulationResult: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  cachedAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index: auto-delete documents after 1 hour
summaryCacheSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 3600 });

const SummaryCache = mongoose.model('SummaryCache', summaryCacheSchema);
module.exports = SummaryCache;
