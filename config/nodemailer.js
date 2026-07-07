import nodemailer from "nodemailer";

// ✅ Export transporter so paymentController can use it
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});