// controllers/paymentController.js

import Razorpay from "razorpay";
import crypto from "crypto";

import appointmentModel from "../models/appointmentModel.js";

import {
  transporter,
  buildInvoiceEmail,
} from "../utils/sendEmail.js";

// ============================
// INITIALIZE RAZORPAY
// ============================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================
// CREATE ORDER
// ============================

export const razorpayPayment = async (req, res) => {
  try {

    const { amount, appointmentId } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const options = {
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: appointmentId || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {

    console.log("RAZORPAY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ============================
// VERIFY PAYMENT
// ============================

export const verifyRazorpay = async (req, res) => {

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appointmentId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !appointmentId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details",
      });
    }

    // ============================
    // VERIFY SIGNATURE
    // ============================

    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body.toString())
      .digest("hex");

    // ============================
    // INVALID SIGNATURE
    // ============================

    if (expectedSignature !== razorpay_signature) {

      return res.status(400).json({
        success: false,
        message: "Payment Verification Failed",
      });

    }

    // ============================
    // UPDATE APPOINTMENT
    // ============================

    const appointment =
      await appointmentModel.findByIdAndUpdate(
        appointmentId,
        {
          payment: true,
        },
        {
          new: true,
        }
      );

    if (!appointment) {

      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });

    }

    // ============================
    // SEND EMAIL
    // ============================

    if (appointment?.userData?.email) {

      const html =
        buildInvoiceEmail(appointment);

      await transporter.sendMail({
        from: `"Prescripto Health" <${process.env.EMAIL_USER}>`,
        to: appointment.userData.email,
        subject:
          `✅ Appointment Confirmed – Receipt #RCP-${appointment._id
            .toString()
            .slice(-8)
            .toUpperCase()}`,
        html,
      });

      console.log(
        "✅ Invoice email sent to:",
        appointment.userData.email
      );
    }

    return res.json({
      success: true,
      message: "Payment Verified Successfully",
    });

  } catch (error) {

    console.log("VERIFY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};