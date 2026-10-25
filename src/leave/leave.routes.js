
import express from "express";
import leaveController from "./leave.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { allowRoles } from "../../middleware/role.middleware.js";

const router = express.Router();

// Employee: submit a leave request
router.post("/", authenticate, leaveController.applyLeave);

// Employee: view own leave history
router.get("/my", authenticate, leaveController.getMyLeaves);

// Admin/HR: view all requests, optionally filter by status
router.get(
  "/",
  authenticate,
  allowRoles("admin", "hr"),
  leaveController.getAllLeaves
);

// Admin/HR: approve or reject a request
router.patch(
  "/:id/review",
  authenticate,
  allowRoles("admin", "hr"),
  leaveController.reviewLeave
);

export default router;
