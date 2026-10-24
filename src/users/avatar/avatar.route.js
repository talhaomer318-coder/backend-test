
import { Router } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import Avatar from "./avatarmodel.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post("/", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image received",
      });
    }

    // 1. Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "avatars",
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    // 2. Save image URL and public ID in MongoDB
    const avatar = await Avatar.create({
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });

    // 3. Return saved document
    return res.status(201).json({
      success: true,
      message: "Image uploaded and saved to MongoDB",
      avatar,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Image upload or database save failed",
      error: error.message,
    });
  }
});

export default router;
