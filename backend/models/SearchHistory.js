const mongoose = require('mongoose');

const SearchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['products', 'articles', 'experts', 'all'],
      default: 'all',
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
    filters: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true }
);

// Create index for faster searches
SearchHistorySchema.index({ user: 1, createdAt: -1 });
SearchHistorySchema.index({ query: 'text' });

module.exports = mongoose.model('SearchHistory', SearchHistorySchema);
