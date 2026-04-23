const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, default: '' },
}, { _id: true });

const charitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Charity name is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  logoUrl: {
    type: String,
    default: null,
  },
  bannerUrl: {
    type: String,
    default: null,
  },
  website: {
    type: String,
    default: null,
  },
  upcomingEvents: {
    type: [eventSchema],
    default: [],
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  totalContributed: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// ── Indexes ────────────────────────────────────────────────────────────────────
// Note: slug unique index declared at field level.
charitySchema.index({ isFeatured: 1, isActive: 1 });

const Charity = mongoose.model('Charity', charitySchema);
module.exports = Charity;
