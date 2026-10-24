
import mongoose from "mongoose";

const avatarSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Avatar = mongoose.model("Avatar", avatarSchema);

export default Avatar;
