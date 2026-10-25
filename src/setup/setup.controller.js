
import mongoose from "mongoose";
import Setup from "./setup.model.js";
import { createAuditLog } from "../services/auditLog.service.js";

// Get company setup
export const getSetup = async (req, res) => {
  try {
    const setup = await Setup.findOne();

    if (!setup) {
      return res.status(404).json({
        message: "Company setup has not been created yet",
      });
    }

    return res.status(200).json({ setup });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch company setup",
      error: error.message,
    });
  }
};

// Create company setup (initial setup)
export const createSetup = async (req, res) => {
  try {
    const existing = await Setup.findOne();

    if (existing) {
      return res.status(409).json({
        message: "Company setup already exists. Use PUT to update it.",
      });
    }

    const {
      companyName,
      companyEmail,
      companyPhone,
      address,
      departments,
      designations,
      workStartTime,
      workEndTime,
      timezone,
    } = req.body;

    if (
      typeof companyName !== "string" ||
      !companyName.trim()
    ) {
      return res.status(400).json({
        message: "companyName is required",
      });
    }

    const setup = await Setup.create({
      companyName: companyName.trim(),
      companyEmail,
      companyPhone,
      address,
      departments,
      designations,
      workStartTime,
      workEndTime,
      timezone,
      updatedBy: req.user._id,
    });

    try {
      await createAuditLog({
        actor: req.user._id,
        action: "CREATE",
        entity: "Setup",
        entityId: setup._id,
        after: setup.toObject(),
      });
    } catch (auditError) {
      console.error("Setup audit log error:", auditError.message);
    }

    return res.status(201).json({
      message: "Company setup created successfully",
      setup,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not create company setup",
      error: error.message,
    });
  }
};

// Update company setup
export const updateSetup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid setup ID",
      });
    }

    const allowedFields = [
      "companyName",
      "companyEmail",
      "companyPhone",
      "address",
      "departments",
      "designations",
      "workStartTime",
      "workEndTime",
      "timezone",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (
      updates.companyName !== undefined &&
      (typeof updates.companyName !== "string" ||
        !updates.companyName.trim())
    ) {
      return res.status(400).json({
        message: "companyName cannot be empty",
      });
    }

    for (const field of ["departments", "designations"]) {
      if (
        updates[field] !== undefined &&
        (!Array.isArray(updates[field]) ||
          !updates[field].every(
            (item) => typeof item === "string" && item.trim()
          ))
      ) {
        return res.status(400).json({
          message: `${field} must be an array of non-empty strings`,
        });
      }

      if (Array.isArray(updates[field])) {
        updates[field] = updates[field].map((item) => item.trim());
      }
    }

    const setup = await Setup.findById(id);

    if (!setup) {
      return res.status(404).json({
        message: "Setup record not found",
      });
    }

    const before = setup.toObject();

    Object.assign(setup, updates);
    setup.updatedBy = req.user._id;

    await setup.save();

    try {
      await createAuditLog({
        actor: req.user._id,
        action: "UPDATE",
        entity: "Setup",
        entityId: setup._id,
        before,
        after: setup.toObject(),
      });
    } catch (auditError) {
      console.error("Setup audit log error:", auditError.message);
    }

    return res.status(200).json({
      message: "Company setup updated successfully",
      setup,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not update company setup",
      error: error.message,
    });
  }
};
