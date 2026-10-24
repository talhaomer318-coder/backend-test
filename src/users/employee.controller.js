import userservices from "./employee.services.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Contact from "./contact.model.js";
import sendEmail from "./config/transporter.js";
import { signupSchema } from "./validator.js";
import { accesstoken, refreshtoken } from "../../token.js";


const createuser = async (req, res) => {
  try {
    const result = signupSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const existingUser = await userservices.findByEmail(req.body.email.trim().toLowerCase());

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const password = await bcrypt.hash(req.body.password, 12);
    const user = await userservices.createuser({
      ...req.body,
      email: req.body.email.trim().toLowerCase(),
      password,
    });

    return res.status(201).send({ message: "User created successfully", data: user });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userservices.findByEmail(email);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Wrong password",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    user.loginOtp = otp;
    user.loginOtpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();
    await sendEmail(email, "Login OTP", `Your OTP is ${otp}`);

    return res.status(200).json({
      message: "OTP sent to your email",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim()
    ) {
      return res.status(400).json({
        message: "Name, email, and phone are required",
      });
    }

    // 1. Save contact details in MongoDB
  const contact = await Contact.create({
  name: name.trim(),
  email: email.trim().toLowerCase(),
  phone: phone.trim(),
});
    // 2. Send email notification
    let emailSent = true;

    try {
      await sendEmail(
        process.env.RECEIVER_EMAIL,
        "New Contact Form Submission",
        `Name: ${contact.name}
Email: ${contact.email}
Phone: ${contact.phone}`
      );
    } catch (emailError) {
      emailSent = false;
      console.error("Email error:", emailError);
    }

    // 3. Return the result
    return res.status(201).json({
      message: emailSent
        ? "Contact saved and email sent successfully"
        : "Contact saved, but email notification failed",
      contactId: contact._id,
      emailSent,
    });
  } catch (error) {
    console.error("Contact error:", error);

    return res.status(500).json({
      message: "Failed to save contact",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await userservices.findByEmail(email);

    if (!user || !user.loginOtp || !user.loginOtpExpires) {
      return res.status(400).json({
        message: "Please login again to get an OTP",
      });
    }

    if (user.loginOtp !== otp || user.loginOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    user.loginOtp = undefined;
    user.loginOtpExpires = undefined;
    user.verified = true;
    await user.save();

    const generateaccestoken = accesstoken(user);
    const generaterefreshtoken = refreshtoken(user);

    const userdata = user.toObject();
    delete userdata.password;
    delete userdata.loginOtp;
    delete userdata.loginOtpExpires;

    return res.status(200).json({
      message: "Login success",
      data: userdata,
      accessToken: generateaccestoken,
      refreshToken: generaterefreshtoken,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const findUser = async (req, res) => {
  try {
    const user = await userservices.findById(req.user._id);

    res.status(200).send({ message: "Successfully", data: user });
  } catch (err) {
    res.status(404).send({ messgae: err.message });
  }
};
const refreshTokenApi = async (req, res) => {
  try {
    const decode = jwt.verify(
      req.body.refreshToken,
      process.env.refreshtokenkey,
    );

    const user = await userservices.findById(decode._id);

    const generateAccessToken = await accesstoken(user);
    const generateRefreshToken = await refreshtoken(user);

    res.status(200).send({
      data: {
        user,
        accessToken: generateAccessToken,
        refreshToken: generateRefreshToken,
      },
    });
  } catch (err) {
    res.status(404).send({ messgae: err.message });
  }
};



export default {
  createuser,
  login,
  findUser,
  refreshTokenApi,
  verifyOtp,
  sendContactEmail,
};