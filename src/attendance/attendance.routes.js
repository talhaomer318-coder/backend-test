
import express from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { allowRoles } from "../../middleware/role.middleware.js";

import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  updateAttendanceStatus,
} from "./attendancecontroller.js";

const router = express.Router();

// Employee routes
router.post("/check-in", authenticate, checkIn);
router.post("/check-out", authenticate, checkOut);
router.get("/my", authenticate, getMyAttendance);

// Admin/HR routes
router.get("/", authenticate, allowRoles("admin", "hr"), getAllAttendance);
router.patch(
  "/:id/status",
  authenticate,
  allowRoles("admin", "hr"),
  updateAttendanceStatus
);

export default router;
