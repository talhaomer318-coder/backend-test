
import mongoose from "mongoose";
import Attendance from "./attendance.model.js";
import { createAuditLog } from "../services/auditLog.service.js";

// Helper: normalize date to UTC midnight
const getToday = () => {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
};

// Employee check-in
export const checkIn = async (req, res) => {
  try {
    const employeeId = req.user?._id;

    if (!employeeId) {
      return res.status(401).json({
        message: "Please log in first",
      });
    }

    const today = getToday();

    const existing = await Attendance.findOne({
      employeeId,
      date: today,
    });

    if (existing) {
      return res.status(409).json({
        message: "Attendance already exists for today",
        attendance: existing,
      });
    }

    const attendance = await Attendance.create({
      employeeId,
      date: today,
      checkIn: new Date(),
      status: "present",
    });

    try {
      await createAuditLog({
        actor: employeeId,
        action: "CHECK_IN",
        entity: "Attendance",
        entityId: attendance._id,
        after: attendance.toObject(),
      });
    } catch (auditError) {
      console.error("Check-in audit log error:", auditError.message);
    }

    return res.status(201).json({
      message: "Checked in successfully",
      attendance,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Attendance already exists for today",
      });
    }

    return res.status(500).json({
      message: "Check-in failed",
      error: error.message,
    });
  }
};

// Employee check-out
export const checkOut = async (req, res) => {
  try {
    const employeeId = req.user?._id;
    const today = getToday();

    const attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    if (!attendance) {
      return res.status(404).json({
        message: "Please check in before checking out",
      });
    }

    if (attendance.checkOut) {
      return res.status(409).json({
        message: "You have already checked out",
      });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    try {
      await createAuditLog({
        actor: employeeId,
        action: "CHECK_OUT",
        entity: "Attendance",
        entityId: attendance._id,
        after: attendance.toObject(),
      });
    } catch (auditError) {
      console.error("Check-out audit log error:", auditError.message);
    }

    return res.status(200).json({
      message: "Checked out successfully",
      attendance,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Check-out failed",
      error: error.message,
    });
  }
};

// Employee views their own attendance
export const getMyAttendance = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const filter = {
      employeeId: req.user._id,
    };

    if (req.query.from || req.query.to) {
      filter.date = {};

      if (req.query.from) {
        const from = new Date(req.query.from);

        if (Number.isNaN(from.getTime())) {
          return res.status(400).json({
            message: "Invalid from date",
          });
        }

        filter.date.$gte = new Date(
          Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
        );
      }

      if (req.query.to) {
        const to = new Date(req.query.to);

        if (Number.isNaN(to.getTime())) {
          return res.status(400).json({
            message: "Invalid to date",
          });
        }

        filter.date.$lte = new Date(
          Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
        );
      }
    }

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Attendance.countDocuments(filter),
    ]);

    return res.status(200).json({
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch attendance",
      error: error.message,
    });
  }
};

// Admin/HR views all employees' attendance
export const getAllAttendance = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const filter = {};

    if (req.query.employeeId) {
      if (!mongoose.isValidObjectId(req.query.employeeId)) {
        return res.status(400).json({
          message: "Invalid employeeId",
        });
      }

      filter.employeeId = req.query.employeeId;
    }

    if (req.query.status) {
      const allowedStatuses = [
        "present",
        "late",
        "absent",
        "half-day",
        "on-leave",
      ];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          message: "Invalid attendance status",
        });
      }

      filter.status = req.query.status;
    }

    if (req.query.date) {
      const date = new Date(req.query.date);

      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
          message: "Invalid date",
        });
      }

      filter.date = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
      );
    }

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate("employeeId", "name email")
        .populate("markedBy", "name email")
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Attendance.countDocuments(filter),
    ]);

    return res.status(200).json({
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch attendance records",
      error: error.message,
    });
  }
};

// Admin/HR manually updates attendance status
export const updateAttendanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid attendance ID",
      });
    }

    const allowedStatuses = [
      "present",
      "late",
      "absent",
      "half-day",
      "on-leave",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid attendance status",
      });
    }

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        message: "Attendance record not found",
      });
    }

    const before = attendance.toObject();

    attendance.status = status;

    if (notes !== undefined) {
      if (typeof notes !== "string" || notes.length > 500) {
        return res.status(400).json({
          message: "Notes must be a string of at most 500 characters",
        });
      }

      attendance.notes = notes;
    }

    attendance.markedBy = req.user._id;

    await attendance.save();

    try {
      await createAuditLog({
        actor: req.user._id,
        action: "UPDATE",
        entity: "Attendance",
        entityId: attendance._id,
        before,
        after: attendance.toObject(),
      });
    } catch (auditError) {
      console.error("Attendance audit log error:", auditError.message);
    }

    return res.status(200).json({
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not update attendance",
      error: error.message,
    });
  }
};
