import express from "express";

import { getAuditLogs } from "../Controllers/auditLog.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { allowRoles } from "../../middleware/role.middleware.js";

const router = express.Router();

// Admin only; no edit or delete endpoints
router.get("/", authenticate, allowRoles("admin"), getAuditLogs);

export default router;