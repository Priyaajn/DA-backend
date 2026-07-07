// routes/paymentRoutes.js

import express from "express";
import path from "path";
import fs from "fs";

import PDFDocument from "pdfkit";

import appointmentModel from "../models/appointmentModel.js";

import {
  razorpayPayment,
  verifyRazorpay,
} from "../controllers/paymentController.js";

const router = express.Router();

// ============================
// PAYMENT ROUTES
// ============================

router.post("/razorpay", razorpayPayment);

router.post("/verify", verifyRazorpay);

// ============================
// DOWNLOAD INVOICE
// ============================

router.get("/invoice/:id", async (req, res) => {

  try {

    const appointmentId = req.params.id;

    const appointment =
      await appointmentModel.findById(appointmentId);

    if (!appointment) {

      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });

    }

    // ============================
    // CREATE DIRECTORY
    // ============================

    const invoiceDir = path.resolve("invoices");

    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir);
    }

    const invoicePath = path.join(
      invoiceDir,
      `invoice-${appointmentId}.pdf`
    );

    // ============================
    // GENERATE PDF
    // ============================

    if (!fs.existsSync(invoicePath)) {

      const doc = new PDFDocument({
        margin: 50,
      });

      doc.pipe(
        fs.createWriteStream(invoicePath)
      );

      // Header
      doc
        .fillColor("#2563EB")
        .fontSize(28)
        .text("PRESCRIPTO", {
          align: "center",
        });

      doc.moveDown();

      doc
        .fillColor("#111827")
        .fontSize(18)
        .text("PAYMENT INVOICE", {
          align: "center",
        });

      doc.moveDown(2);

      // Invoice Details
      doc
        .fontSize(13)
        .fillColor("#374151");

      doc.text(`Invoice ID: INV-${appointmentId}`);

      doc.text(
        `Date: ${new Date().toLocaleString()}`
      );

      doc.moveDown(2);

      // Patient
      doc
        .fontSize(16)
        .fillColor("#111827")
        .text("Patient Details");

      doc.moveDown(0.5);

      doc
        .fontSize(13)
        .fillColor("#4B5563");

      doc.text(
        `Name: ${appointment.userData?.name || "Patient"}`
      );

      doc.text(
        `Email: ${appointment.userData?.email || "N/A"}`
      );

      doc.moveDown(1.5);

      // Doctor
      doc
        .fontSize(16)
        .fillColor("#111827")
        .text("Doctor Details");

      doc.moveDown(0.5);

      doc
        .fontSize(13)
        .fillColor("#4B5563");

      doc.text(
        `Doctor: ${appointment.docData?.name || "Doctor"}`
      );

      doc.text(
        `Speciality: ${appointment.docData?.speciality || "N/A"}`
      );

      doc.moveDown(1.5);

      // Payment
      doc
        .fontSize(16)
        .fillColor("#111827")
        .text("Payment Summary");

      doc.moveDown(0.5);

      doc.text(
        `Amount Paid: ₹${appointment.amount}`
      );

      doc.moveDown(1.5);

      doc
        .fillColor("#16A34A")
        .fontSize(16)
        .text("Payment Status: SUCCESSFUL ✅");

      doc.moveDown(3);

      // Footer
      doc
        .fillColor("#6B7280")
        .fontSize(11)
        .text(
          "Thank you for choosing Prescripto.",
          {
            align: "center",
          }
        );

      doc.end();
    }

    // ============================
    // DOWNLOAD
    // ============================

    return res.download(
      invoicePath,
      `invoice-${appointmentId}.pdf`
    );

  } catch (error) {

    console.log("INVOICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});

export default router;