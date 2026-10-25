
import { user as Employee } from "../users/employee.model.js";
import Announcement from "../Model/announcement.model.js";
import AuditLog from "../Model/auditLog.model.js";
import Notification from "../Model/notification.model.js";
const adminDashboard = async (req, res) => {
  try {
    const [
      totalEmployees,
      verifiedEmployees,
      adminEmployees,
      unreadNotifications,
      recentAnnouncements,
      recentAuditLogs,
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ verified: true }),
      Employee.countDocuments({ role: "admin" }),
      Notification.countDocuments({ isRead: false }),
      Announcement.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          verified: verifiedEmployees,
          unverified: totalEmployees - verifiedEmployees,
          admins: adminEmployees,
        },
        unreadNotifications,
        recentAnnouncements,
        recentAuditLogs,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
};

const employeeDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      employee,
      unreadNotifications,
      recentNotifications,
      recentAnnouncements,
    ] = await Promise.all([
      Employee.findById(userId)
        .select("-password -loginOtp -loginOtpExpires -refreshToken")
        .lean(),
      Notification.countDocuments({
        recipient: userId,
        isRead: false,
      }),
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Announcement.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        employee,
        unreadNotifications,
        recentNotifications,
        recentAnnouncements,
      },
    });
  } catch (error) {
    console.error("Employee dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load employee dashboard",
    });
  }
};

export default {
  adminDashboard,
  employeeDashboard,
};
