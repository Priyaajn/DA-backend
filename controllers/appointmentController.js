import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";

const bookAppointment = async (req, res) => {

  try {

    const { userId, docId, slotDate, slotTime } = req.body;

    // Check required fields
    if (!userId || !docId || !slotDate || !slotTime) {

      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Get doctor data
    const docData = await doctorModel
      .findById(docId)
      .select("-password");

    if (!docData) {

      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Get user data
    const userData = await userModel
      .findById(userId)
      .select("-password");

    if (!userData) {

      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check doctor availability
    if (!docData.available) {

      return res.status(400).json({
        success: false,
        message: "Doctor not available"
      });
    }

    // Doctor booked slots
    let slots_booked = docData.slots_booked || {};

    // Check slot already booked
    if (
      slots_booked[slotDate] &&
      slots_booked[slotDate].includes(slotTime)
    ) {

      return res.status(400).json({
        success: false,
        message: "Slot already booked"
      });
    }

    // Add slot
    if (slots_booked[slotDate]) {

      slots_booked[slotDate].push(slotTime);

    } else {

      slots_booked[slotDate] = [slotTime];
    }

    // Update doctor slots
    await doctorModel.findByIdAndUpdate(docId, {
      slots_booked
    });

    // Appointment data
    const appointmentData = {

      userId,
      docId,
      slotDate,
      slotTime,

      userData,
      docData,

      amount: docData.fees,

      date: Date.now(),

      email: userData.email || ""
    };

    // Save appointment
    const newAppointment = new appointmentModel(
      appointmentData
    );

    await newAppointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment Booked"
    });

  } catch (error) {

    console.log("BOOK ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export { bookAppointment };