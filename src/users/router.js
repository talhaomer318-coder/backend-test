
import express from "express";
import usersController from "./employee.controller.js";
import avatarRoutes from "./avatar/avatar.route.js";
import { user } from "./employee.model.js";
import announcementRoutes from "../routes/announcement.routes.js";
import notificationRoutes from "../routes/notification.routes.js";
import auditLogRoutes from "../routes/auditLog.routes.js";
import { authenticate } from "../../middleware/authenticate.js";
import { allowRoles } from "../../middleware/role.middleware.js";

// In controllers ko apni actual file location ke mutabiq import karein.
// Example:
// import {
//   adminController,
//   employeesController,
//   profileController,
// } from "./users.controller.js";

const router = express.Router();

// Only Admin
router.get(
  "/admin",
  authenticate,
  allowRoles("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
    });
  }
);

// Admin and HR
router.get(
  "/employees",
  authenticate,
  allowRoles("admin", "hr"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Employee records access granted",
    });
  }
);

// Admin, HR and Employee
router.get(
  "/profile",
  authenticate,
  allowRoles("admin", "hr", "employee"),
  (req, res) => {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  }
);

// Avatar routes
router.use("/avatar", avatarRoutes);
router.use("/announcements", announcementRoutes);
router.use("/notifications", notificationRoutes);
router.use("/audit-logs", auditLogRoutes);
// User routes
router.post("/signup", usersController.createuser);
router.post("/login", usersController.login);
router.post("/contact", usersController.sendContactEmail);
router.post("/verify-otp", usersController.verifyOtp);
router.post("/refreshToken", usersController.refreshTokenApi);

// Logged-in user
router.get("/me", authenticate, usersController.findUser);

// Pagination
router.get("/pagination", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const skip = (page - 1) * limit;

    const users = await user
      .find()
      .select("-password -loginOtp")
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await user.countDocuments();

    return res.status(200).json({
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
