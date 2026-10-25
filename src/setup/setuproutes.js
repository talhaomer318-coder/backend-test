
import express from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { allowRoles } from "../../middleware/role.middleware.js";

import {
  getSetup,
  createSetup,
  updateSetup,
} from "./setup.controller.js";

const router = express.Router();

router.get("/", authenticate, allowRoles("admin"), getSetup);
router.post("/", authenticate, allowRoles("admin"), createSetup);
router.put("/:id", authenticate, allowRoles("admin"), updateSetup);

export default router;
