
import mongoose from "mongoose";

const avatarSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    image: {
      type: Buffer,
      required: true,
    },
  },
  { timestamps: true }
);

const Avatar = mongoose.model("Avatar", avatarSchema);

export default Avatar;
