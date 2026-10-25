
import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2020,
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    grossSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "approved", "paid"],
      default: "draft",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Employee",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

payrollSchema.index(
  { employeeId: 1, month: 1, year: 1 },
  { unique: true }
);

export default mongoose.model("Payroll", payrollSchema);
