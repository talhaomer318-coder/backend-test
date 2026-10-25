
import mongoose from "mongoose";
import Payroll from "./payroll.model.js";
import { createAuditLog } from "../services/auditLog.service.js";

// Admin/HR: Create monthly payroll
const createPayroll = async (req, res) => {
  try {
    const {
      employeeId,
      month,
      year,
      basicSalary,
      allowances = 0,
      deductions = 0,
      notes = "",
    } = req.body;

    if (
      !mongoose.isValidObjectId(employeeId) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2020 ||
      !Number.isFinite(basicSalary) ||
      !Number.isFinite(allowances) ||
      !Number.isFinite(deductions) ||
      basicSalary < 0 ||
      allowances < 0 ||
      deductions < 0 ||
      deductions > basicSalary + allowances
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll details",
      });
    }

    const grossSalary = basicSalary + allowances;
    const netSalary = grossSalary - deductions;

    const payroll = await Payroll.create({
      employeeId,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      grossSalary,
      netSalary,
      notes,
      createdBy: req.user._id,
    });

    try {
      await createAuditLog({
        actor: req.user._id,
        action: "CREATE",
        entity: "Payroll",
        entityId: payroll._id,
        after: {
          employeeId: payroll.employeeId,
          month,
          year,
          grossSalary,
          netSalary,
          status: payroll.status,
        },
      });
    } catch (auditError) {
      console.error("Payroll audit log failed:", auditError);
    }

    return res.status(201).json({
      success: true,
      message: "Payroll created successfully",
      data: payroll,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Payroll already exists for this employee and month",
      });
    }

    console.error("Create payroll error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payroll",
    });
  }
};

// Admin/HR: View all payroll records
const getAllPayrolls = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const filter = {};

    if (req.query.month) {
      const month = Number(req.query.month);
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: "Month must be between 1 and 12",
        });
      }
      filter.month = month;
    }

    if (req.query.year) {
      const year = Number(req.query.year);
      if (!Number.isInteger(year) || year < 2020) {
        return res.status(400).json({
          success: false,
          message: "Invalid year",
        });
      }
      filter.year = year;
    }

    const [payrolls, total] = await Promise.all([
      Payroll.find(filter)
        .populate("employeeId", "name email")
        .sort({ year: -1, month: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Payroll.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: payrolls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get payrolls error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payrolls",
    });
  }
};

// Employee: View only their own salary slips
const getMyPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find({
      employeeId: req.user._id,
    })
      .sort({ year: -1, month: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    console.error("My payrolls error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your payrolls",
    });
  }
};

// Admin/HR: Approve a draft payroll
const approvePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    if (payroll.status !== "draft") {
      return res.status(409).json({
        success: false,
        message: "Only draft payroll can be approved",
      });
    }

    payroll.status = "approved";
    payroll.approvedBy = req.user._id;
    payroll.approvedAt = new Date();

    await payroll.save();

    try {
      await createAuditLog({
        actor: req.user._id,
        action: "APPROVE",
        entity: "Payroll",
        entityId: payroll._id,
        after: {
          status: payroll.status,
          approvedBy: payroll.approvedBy,
          approvedAt: payroll.approvedAt,
        },
      });
    } catch (auditError) {
      console.error("Payroll audit log failed:", auditError);
    }

    return res.status(200).json({
      success: true,
      message: "Payroll approved successfully",
      data: payroll,
    });
  } catch (error) {
    console.error("Approve payroll error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve payroll",
    });
  }
};

// Admin/HR: Mark approved payroll as paid
const markPayrollPaid = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    if (payroll.status !== "approved") {
      return res.status(409).json({
        success: false,
        message: "Only approved payroll can be marked as paid",
      });
    }

    payroll.status = "paid";
    payroll.paidAt = new Date();

    await payroll.save();

    try {
      await createAuditLog({
        actor: req.user._id,
        action: "MARK_PAID",
        entity: "Payroll",
        entityId: payroll._id,
        after: {
          status: payroll.status,
          paidAt: payroll.paidAt,
        },
      });
    } catch (auditError) {
      console.error("Payroll audit log failed:", auditError);
    }

    return res.status(200).json({
      success: true,
      message: "Payroll marked as paid",
      data: payroll,
    });
  } catch (error) {
    console.error("Mark paid error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payroll status",
    });
  }
};

export default {
  createPayroll,
  getAllPayrolls,
  getMyPayrolls,
  approvePayroll,
  markPayrollPaid,
};
