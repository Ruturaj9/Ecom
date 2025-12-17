const mongoose = require('mongoose');

const VideoSliderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: '',
    },

    subtitle: {
      type: String,
      trim: true,
      default: '',
    },

    // Cloudinary video URLs
    videoUrl: {
      desktop: {
        type: String,
        required: true,
      },
      mobile: {
        type: String,
        required: true,
      },
    },

    // ✅ NEW — Preview thumbnail (Cloudinary image URL)
    // Used for admin preview + <video poster="">
    thumbnail: {
      type: String,
      default: '',
    },

    order: {
      type: Number,
      default: 0,
      index: true,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VideoSlider', VideoSliderSchema);
