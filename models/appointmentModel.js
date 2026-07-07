import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true
    },

    docId: {
      type: String,
      required: true,
      trim: true
    },

    slotDate: {
      type: String,
      required: true,
      trim: true
    },

    slotTime: {
      type: String,
      required: true,
      trim: true
    },

    userData: {
      type: Object,
      required: true,
      default: {}
    },

    docData: {
      type: Object,
      required: true,
      default: {}
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    date: {
      type: Number,
      required: true,
      default: Date.now
    },

    cancelled: {
      type: Boolean,
      default: false
    },

    payment: {
      type: Boolean,
      default: false
    },

    isCompleted: {
      type: Boolean,
      default: false
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true
    },

    confirmationSent: {
      type: Boolean,
      default: false
    },

    reminderSent: {
      type: Boolean,
      default: false
    }
  },

  {
    timestamps: true,
    minimize: false
  }
);

const appointmentModel =
  mongoose.models.appointment ||
  mongoose.model("appointment", appointmentSchema);

export default appointmentModel;