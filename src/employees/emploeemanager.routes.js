
import express from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { allowRoles } from "../../middleware/role.middleware.js";

import {
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deactivateEmployee,
} from "./employeemanager.controller.js";

const router = express.Router();

router.get("/", authenticate, allowRoles("admin", "hr"), getEmployees);
router.get("/:id", authenticate, allowRoles("admin", "hr"), getEmployeeById);
router.patch("/:id", authenticate, allowRoles("admin", "hr"), updateEmployee);
router.patch(
  "/:id/deactivate",
  authenticate,
  allowRoles("admin", "hr"),
  deactivateEmployee
);

export default router;
