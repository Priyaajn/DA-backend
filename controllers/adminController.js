import jwt        from 'jsonwebtoken'
import bcrypt      from 'bcrypt'
import validator   from 'validator'
import { v2 as cloudinary } from 'cloudinary'

import doctorModel      from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import userModel        from '../models/userModel.js'

// ─────────────────────────────────────────────────────────────────
// ADMIN LOGIN
// ─────────────────────────────────────────────────────────────────
// ✅ THE FIX: token MUST be signed as  jwt.sign(email + password, secret)
//    because authAdmin.js verifies with:
//      if (token_decode !== ADMIN_EMAIL + ADMIN_PASSWORD) → reject
//    So the payload must be the raw concatenated string — NOT an object.
// ─────────────────────────────────────────────────────────────────
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body

    // Compare against .env values directly (admin has no DB record)
    if (
      email    === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      // ✅ Sign the plain concatenated string — matches authAdmin check
      const token = jwt.sign(
        email + password,
        process.env.JWT_SECRET
      )
      return res.json({ success: true, token })
    }

    res.json({ success: false, message: 'Invalid Credentials' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// ADD DOCTOR
// ─────────────────────────────────────────────────────────────────
export const addDoctor = async (req, res) => {
  try {
    const {
      name, email, password, speciality,
      degree, experience, about, fees, address
    } = req.body

    const imageFile = req.file

    // Basic validation
    if (!name || !email || !password || !speciality || !degree ||
        !experience || !about || !fees || !address) {
      return res.json({ success: false, message: 'All fields are required' })
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: 'Please enter a valid email' })
    }

    if (password.length < 8) {
      return res.json({ success: false, message: 'Password must be at least 8 characters' })
    }

    // Hash password
    const salt           = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Upload image to Cloudinary
    let imageUrl = ''
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: 'image'
      })
      imageUrl = imageUpload.secure_url
    }

    const doctorData = {
      name,
      email,
      image:      imageUrl,
      password:   hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees:       Number(fees),
      address:    typeof address === 'string' ? JSON.parse(address) : address,
      date:       Date.now(),
      available:  true,
      slots_booked: {}
    }

    const newDoctor = new doctorModel(doctorData)
    await newDoctor.save()

    res.json({ success: true, message: 'Doctor added successfully' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// ALL DOCTORS
// ─────────────────────────────────────────────────────────────────
export const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select('-password')
    res.json({ success: true, doctors })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// ALL PATIENTS
// ─────────────────────────────────────────────────────────────────
export const allPatients = async (req, res) => {
  try {
    const patients = await userModel.find({}).select('-password')
    res.json({ success: true, patients })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// ALL APPOINTMENTS (admin view)
// ─────────────────────────────────────────────────────────────────
export const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({})
    res.json({ success: true, appointments })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// CANCEL APPOINTMENT (admin)
// ─────────────────────────────────────────────────────────────────
export const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)
    if (!appointmentData) {
      return res.json({ success: false, message: 'Appointment not found' })
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

    // Free the doctor's slot
    const { docId, slotDate, slotTime } = appointmentData
    const doctorData = await doctorModel.findById(docId)
    let slots_booked = doctorData.slots_booked || {}
    slots_booked[slotDate] = (slots_booked[slotDate] || []).filter(e => e !== slotTime)
    await doctorModel.findByIdAndUpdate(docId, { slots_booked })

    res.json({ success: true, message: 'Appointment cancelled' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────
export const adminDashboard = async (req, res) => {
  try {
    const doctors      = await doctorModel.find({})
    const users        = await userModel.find({})
    const appointments = await appointmentModel.find({})

    const dashData = {
      doctors:      doctors.length,
      patients:     users.length,
      appointments: appointments.length,
      latestAppointments: appointments.reverse().slice(0, 5)
    }

    res.json({ success: true, dashData })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}