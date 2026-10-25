
import mongoose from "mongoose";
import Leave from "./leave.model.js";
import { createAuditLog } from "./services/auditLog.service.js";

const validObjectId = (id) => mongoose.isValidObjectId(id);

const calculateDays = (start, end) => {
  const startMs = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );

  const endMs = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate()
  );

  return Math.floor((endMs - startMs) / 86400000) + 1;
};

// Employee: apply for leave
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (
      !["annual", "sick", "casual", "unpaid"].includes(leaveType) ||
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid leave type and reason are required",
      });
    }

    if (
      typeof startDate !== "string" ||
      typeof endDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Dates must use YYYY-MM-DD format",
      });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start.toISOString().slice(0, 10) !== startDate ||
      end.toISOString().slice(0, 10) !== endDate ||
      end < start
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave date range",
      });
    }

    const totalDays = calculateDays(start, end);

    // Prevent overlapping pending or approved leave requests.
    const overlap = await Leave.findOne({
      employeeId: req.user._id,
      status: { $in: ["pending", "approved"] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    if (overlap) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending or approved leave in this date range",
      });
    }

    const leave = await Leave.create({
      employeeId: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason: reason.trim(),
    });

    try {
      await createAuditLog({
        actor: req.user._id,
        action: "CREATE",
        entity: "Leave",
        entityId: leave._id,
        after: {
          leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          totalDays,
          status: leave.status,
        },
      });
    } catch (auditError) {
      console.error("Leave audit log failed:", auditError);
    }

    return res.status(201).json({
      success: true,
      message: "Leave application submitted",
      data: leave,
    });
  } catch (error) {
    console.error("Apply leave error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit leave application",
    });
  }
};

// Employee: view their own leave requests
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      employeeId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (error) {
    console.error("Get my leaves error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leave history",
    });
  }
};

// Admin/HR: view all leave requests
const getAllLeaves = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      if (!["pending", "approved", "rejected"].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid leave status",
        });
      }

      filter.status = req.query.status;
    }

    const leaves = await Leave.find(filter)
      .populate("employeeId", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (error) {
    console.error("Get all leaves error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leave requests",
    });
  }
};

// Admin/HR: approve or reject a pending request
const reviewLeave = async (req, res) => {
  try {
    const { status, reviewComment = "" } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected",
      });
    }

    if (
      typeof reviewComment !== "string" ||
      reviewComment.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid review comment",
      });
    }

    if (!validObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID",
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (leave.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: "This leave request has already been reviewed",
      });
    }

    // Do not approve overlapping leave for the same employee.
    if (status === "approved") {
      const overlap = await Leave.findOne({
        _id: { $ne: leave._id },
        employeeId: leave.employeeId,
        status: "approved",
        startDate: { $lte: leave.endDate },
        endDate: { $gte: leave.startDate },
      });

      if (overlap) {
        return res.status(409).json({
          success: false,
          message: "Another approved leave overlaps these dates",
        });
      }
    }

    const before = { status: leave.status };

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewComment = reviewComment.trim();

    await leave.save();

    try {
      await createAuditLog({
        actor: req.user._id,
        action: status === "approved" ? "APPROVE" : "REJECT",
        entity: "Leave",
        entityId: leave._id,
        before,
        after: {
          status: leave.status,
          reviewedBy: leave.reviewedBy,
          reviewedAt: leave.reviewedAt,
          reviewComment: leave.reviewComment,
        },
      });
    } catch (auditError) {
      console.error("Leave audit log failed:", auditError);
    }

    return res.status(200).json({
      success: true,
      message: `Leave ${status} successfully`,
      data: leave,
    });
  } catch (error) {
    console.error("Review leave error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to review leave",
    });
  }
};

export default {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
};
