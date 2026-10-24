import Notification from "../Model/notification.model.js";

export const sendNotification = async (userId, title, message) => {
  return Notification.create({
    userId,
    title,
    message,
  });
};