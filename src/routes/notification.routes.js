import express from "express";

import { authenticate } from "../../middleware/authenticate.js";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../Controllers/notification.controller.js";

const router = express.Router();

router.get("/", authenticate, getMyNotifications);

router.patch("/read-all", authenticate, markAllNotificationsRead);

router.patch("/:id/read", authenticate, markNotificationRead);

export default router;