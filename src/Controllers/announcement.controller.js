import Announcement from "../Model/announcement.model.js";

export const createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({
        message: "Title and message are required",
      });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Announcement created successfully",
      announcement,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create announcement",
    });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch announcements",
    });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (
      (title !== undefined &&
        (typeof title !== "string" || !title.trim())) ||
      (message !== undefined &&
        (typeof message !== "string" || !message.trim()))
    ) {
      return res.status(400).json({
        message: "Title and message must be non-empty strings",
      });
    }

    const updates = {};

    if (title !== undefined) updates.title = title.trim();
    if (message !== undefined) updates.message = message.trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide title or message to update",
      });
    }

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $set: { ...updates, updatedBy: req.user._id } },
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    return res.status(200).json({
      message: "Announcement updated successfully",
      announcement,
    });
  } catch (error) {
    const status = error.name === "CastError" ? 400 : 500;

    return res.status(status).json({
      message: status === 400 ? "Invalid announcement ID" : "Update failed",
    });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(
      req.params.id
    );

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    return res.status(200).json({
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    const status = error.name === "CastError" ? 400 : 500;

    return res.status(status).json({
      message: status === 400 ? "Invalid announcement ID" : "Delete failed",
    });
  }
};