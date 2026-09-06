const MovieSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true, sparse: true, index: true },
  name: { type: String, required: true, index: true },
  // ... rest
}, { timestamps: true });

MovieSchema.index({ code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Movie', MovieSchema);
