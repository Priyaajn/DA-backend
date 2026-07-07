import express from "express";
import appointmentModel from "../models/appointmentModel.js";

const router = express.Router();


// ✅ CREATE APPOINTMENT
router.post("/book", async (req, res) => {
  try {
    const {
      userId,
      docId,
      slotDate,
      slotTime,
      userData,
      docData,
      amount
    } = req.body;

    const appointmentData = {
      userId,
      docId,
      slotDate,
      slotTime,
      userData,
      docData,
      amount,
      date: Date.now(),

      // ✅ email for reminder
      email: userData?.email || ""
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    res.json({ success: true, message: "Appointment booked successfully" });

  } catch (error) {
    console.log("BOOK ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// ✅ GET ALL APPOINTMENTS
router.get("/", async (req, res) => {
  try {
    const appointments = await appointmentModel.find();
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
});

export default router;