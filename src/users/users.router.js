import express from "express";
import usersController from "./users.controller.js";
import avatarRoutes from "./avatar/avatar.route.js";

import { authenticate } from "../../middleware/authenticate.js";
import { user } from "./users.model.js";

const router = express.Router();

router.use("/avatar", avatarRoutes);

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