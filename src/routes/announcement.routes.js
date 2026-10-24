import express from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { allowRoles } from "../../middleware/role.middleware.js";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from "../Controllers/announcement.controller.js";

const router = express.Router();

// All logged-in users can see announcements
router.get("/", authenticate, getAnnouncements);

// Admin and HR can create announcements
router.post(
  "/",
  authenticate,
  allowRoles("admin", "hr"),
  createAnnouncement
);

// Only Admin can update or delete announcements
router.patch(
  "/:id",
  authenticate,
  allowRoles("admin"),
  updateAnnouncement
);

router.delete(
  "/:id",
  authenticate,
  allowRoles("admin"),
  deleteAnnouncement
);

export default router;