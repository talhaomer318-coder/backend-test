
import mongoose from "mongoose";

const setupSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    companyEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    companyPhone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    departments: [
      {
        type: String,
        trim: true,
      },
    ],

    designations: [
      {
        type: String,
        trim: true,
      },
    ],

    workStartTime: {
      type: String,
      default: "09:00",
    },

    workEndTime: {
      type: String,
      default: "17:00",
    },

    timezone: {
      type: String,
      default: "Asia/Karachi",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Setup", setupSchema);
