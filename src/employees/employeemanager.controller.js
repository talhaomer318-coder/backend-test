
import mongoose from "mongoose";
import { user as Employee } from "../users/employee.model.js";
import { createAuditLog } from "../services/auditLog.service.js";

// Get all employees with pagination and optional search
export const getEmployees = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const filter = {};

    if (req.query.search) {
      const search = String(req.query.search).trim();

      if (search.length > 100) {
        return res.status(400).json({
          message: "Search must be 100 characters or fewer",
        });
      }

      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { department: { $regex: escaped, $options: "i" } },
        { designation: { $regex: escaped, $options: "i" } },
      ];
    }

    if (req.query.status) {
      if (!["active", "inactive"].includes(req.query.status)) {
        return res.status(400).json({
          message: "Status must be active or inactive",
        });
      }

      filter.employmentStatus = req.query.status;
    }

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .select(
          "-password -loginOtp -loginOtpExpires -refreshToken"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Employee.countDocuments(filter),
    ]);

    return res.status(200).json({
      employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch employees",
      error: error.message,
    });
  }
};

// Get one employee
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findById(id).select(
      "-password -loginOtp -loginOtpExpires -refreshToken"
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    return res.status(200).json({ employee });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch employee",
      error: error.message,
    });
  }
};

// Update permitted employee profile fields
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const allowedFields = [
      "name",
      "phone",
      "department",
      "designation",
      "joiningDate",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide at least one permitted field to update",
      });
    }

    if (
      updates.name !== undefined &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      return res.status(400).json({
        message: "Name must be a non-empty string",
      });
    }

    for (const field of ["phone", "department", "designation"]) {
      if (
        updates[field] !== undefined &&
        typeof updates[field] !== "string"
      ) {
        return res.status(400).json({
          message: `${field} must be a string`,
        });
      }
    }

    if (updates.joiningDate !== undefined) {
      const date = new Date(updates.joiningDate);

      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
          message: "Invalid joiningDate",
        });
      }

      updates.joiningDate = date;
    }

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const before = employee.toObject();

    for (const [field, value] of Object.entries(updates)) {
      employee[field] =
        typeof value === "string" ? value.trim() : value;
    }

    await employee.save();

    try {
      await createAuditLog({
        actor: req.user._id,
        action: "UPDATE",
        entity: "Employee",
        entityId: employee._id,
        before,
        after: employee.toObject(),
      });
    } catch (auditError) {
      console.error("Employee audit log error:", auditError.message);
    }

    const safeEmployee = await Employee.findById(employee._id).select(
      "-password -loginOtp -loginOtpExpires -refreshToken"
    );

    return res.status(200).json({
      message: "Employee updated successfully",
      employee: safeEmployee,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not update employee",
      error: error.message,
    });
  }
};

// Deactivate an employee without deleting their history
export const deactivateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (String(employee._id) === String(req.user._id)) {
      return res.status(400).json({
        message: "You cannot deactivate your own account here",
      });
    }

    if (employee.employmentStatus === "inactive") {
      return res.status(409).json({
        message: "Employee is already inactive",
      });
    }

    const before = employee.toObject();

    employee.employmentStatus = "inactive";
    await employee.save();

    try {
      await createAuditLog({
        actor: req.user._id,
        action: "DEACTIVATE",
        entity: "Employee",
        entityId: employee._id,
        before,
        after: employee.toObject(),
      });
    } catch (auditError) {
      console.error("Employee audit log error:", auditError.message);
    }

    return res.status(200).json({
      message: "Employee deactivated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not deactivate employee",
      error: error.message,
    });
  }
};
