
import express from "express";
import dashboardController from "./dashboard.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { allowRoles } from "../../middleware/role.middleware.js";

const router = express.Router();

router.get(
  "/admin",
  authenticate,
  allowRoles("admin"),
  dashboardController.adminDashboard
);

router.get(
  "/employee",
  authenticate,
  dashboardController.employeeDashboard
);

export default router;
