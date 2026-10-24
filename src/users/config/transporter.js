import transporter from "./nodemailer.js";

const sendEmail = async (to, subject, message) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: message,
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email error:", error.message);
    throw error;
  }
};

export default sendEmail;