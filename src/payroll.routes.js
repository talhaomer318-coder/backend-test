import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { allowRoles } from "../middleware/role.middleware.js";
import payrollController from "./payrollcontroller.js";

const router = express.Router();

router.get("/mine", authenticate, payrollController.getMyPayrolls);
router.post(
  "/",
  authenticate,
  allowRoles("admin", "hr"),
  payrollController.createPayroll
);
router.get(
  "/",
  authenticate,
  allowRoles("admin", "hr"),
  payrollController.getAllPayrolls
);
router.patch(
  "/:id/approve",
  authenticate,
  allowRoles("admin", "hr"),
  payrollController.approvePayroll
);
router.patch(
  "/:id/pay",
  authenticate,
  allowRoles("admin", "hr"),
  payrollController.markPayrollPaid
);

export default router;