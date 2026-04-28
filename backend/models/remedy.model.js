const mongoose = require("mongoose");

const remedySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    health_problem: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    preparation_steps: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one preparation step is required.",
      },
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

remedySchema.index({ category_id: 1 });
remedySchema.index({ user_id: 1 });

const Remedy = mongoose.model("Remedy", remedySchema);

module.exports = Remedy;
