import express from "express";
import usersController from "./users.controller.js";

import { authenticate } from "../../middleware/authenticate.js";

import upload from "../../middleware/upload.js";
import Avatar from "../../avatar/avatarmodel.js";
import { user } from "./users.model.js";

const router = express.Router();


router.post("/avatar", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Image required",
      });
    }

    const avatar = await Avatar.create({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      image: req.file.buffer,
    });

    return res.status(201).json({
      message: "Avatar saved in MongoDB successfully",
      avatarId: avatar._id,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);

    return res.status(500).json({
      message: "Failed to save avatar",
    });
  }
});

router.get("/avatar/:id", async (req, res) => {
  try {
    const avatar = await Avatar.findById(req.params.id);

    if (!avatar) {
      return res.status(404).json({
        message: "Avatar not found",
      });
    }

    res.set("Content-Type", avatar.contentType);
    res.send(avatar.image);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve avatar",
    });
  }
});



router.post("/users", usersController.createuser);
router.post("/login", usersController.login);
router.post("/contact", usersController.sendContactEmail);
router.post("/verify-otp", usersController.verifyOtp);
router.post("/refreshToken", usersController.refreshTokenApi);
router.get("/me", authenticate, usersController.findUser);
router.get("/pagination", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);

    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const skip = (page - 1) * limit;

    const users = await user.find()
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await user.countDocuments();

    res.status(200).json({
      success: true,
      page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      users,
    });
  } catch (error) {
    next(error);
  }
});


export default router;