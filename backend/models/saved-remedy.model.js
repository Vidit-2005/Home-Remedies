const mongoose = require("mongoose");

const savedRemedySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    remedy_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Remedy",
      required: true,
    },
    saved_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

savedRemedySchema.index({ user_id: 1, remedy_id: 1 }, { unique: true });
savedRemedySchema.index({ user_id: 1 });

const SavedRemedy = mongoose.model("SavedRemedy", savedRemedySchema);

module.exports = SavedRemedy;