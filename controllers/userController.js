import jwt        from 'jsonwebtoken'
import bcrypt      from 'bcrypt'
import validator   from 'validator'
import { v2 as cloudinary } from 'cloudinary'
import Razorpay    from 'razorpay'
import crypto      from 'crypto'

import userModel        from '../models/userModel.js'
import doctorModel      from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import prescriptionModel from '../models/prescriptionModel.js'
import sendEmail, { buildInvoiceEmail } from '../utils/sendEmail.js'


// ─────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.json({ success: false, message: 'All fields required' })
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: 'Invalid email address' })
    }

    if (password.length < 8) {
      return res.json({ success: false, message: 'Password must be at least 8 characters' })
    }

    const existing = await userModel.findOne({ email })
    if (existing) {
      return res.json({ success: false, message: 'Email already registered' })
    }

    const salt     = await bcrypt.genSalt(10)
    const hashed   = await bcrypt.hash(password, salt)

    const newUser  = new userModel({ name, email, password: hashed })
    const user     = await newUser.save()

    const token    = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

    res.json({ success: true, token })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
      return res.json({ success: false, message: 'User not found' })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid credentials' })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

    res.json({ success: true, token })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const { userId } = req

    const userData = await userModel.findById(userId).select('-password')

    res.json({ success: true, userData })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { userId }                   = req
    const { name, phone, address, dob, gender } = req.body
    const imageFile                    = req.file

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: 'Data missing' })
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: typeof address === 'string' ? JSON.parse(address) : address,
      dob,
      gender
    })

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: 'image'
      })
      await userModel.findByIdAndUpdate(userId, { image: imageUpload.secure_url })
    }

    res.json({ success: true, message: 'Profile updated' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// BOOK APPOINTMENT
// ─────────────────────────────────────────────────────────────────
export const bookAppointment = async (req, res) => {
  try {
    const { userId }             = req
    const { docId, slotDate, slotTime } = req.body

    // Get doctor (exclude password)
    const docData = await doctorModel.findById(docId).select('-password')

    if (!docData) {
      return res.json({ success: false, message: 'Doctor not found' })
    }

    if (!docData.available) {
      return res.json({ success: false, message: 'Doctor not available' })
    }

    // Check slot not already booked
    let slots_booked = docData.slots_booked || {}
    const bookedSlots = slots_booked[slotDate] || []

    if (bookedSlots.includes(slotTime)) {
      return res.json({ success: false, message: 'Slot already booked' })
    }

    // Book the slot
    bookedSlots.push(slotTime)
    slots_booked[slotDate] = bookedSlots
    await doctorModel.findByIdAndUpdate(docId, { slots_booked })

    // Get user data
    const userData = await userModel.findById(userId).select('-password')

    // Save appointment
    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount:    docData.fees,
      slotDate,
      slotTime,
      date:      Date.now(),
      email:     userData?.email || '',
      payment:   false,
      cancelled: false,
      isCompleted: false
    }

    const newAppointment = new appointmentModel(appointmentData)
    await newAppointment.save()

    res.json({ success: true, message: 'Appointment booked successfully' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// MY APPOINTMENTS
// ─────────────────────────────────────────────────────────────────
export const listAppointment = async (req, res) => {
  try {
    const { userId } = req

    const appointments = await appointmentModel.find({ userId })

    res.json({ success: true, appointments })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// CANCEL APPOINTMENT (patient)
// ─────────────────────────────────────────────────────────────────
export const cancelAppointment = async (req, res) => {
  try {
    const { userId }       = req
    const { appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)

    if (!appointmentData) {
      return res.json({ success: false, message: 'Appointment not found' })
    }

    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: 'Unauthorized action' })
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

    // Free doctor slot
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
// RAZORPAY — CREATE ORDER
// ─────────────────────────────────────────────────────────────────
export const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body

    const appointment = await appointmentModel.findById(appointmentId)

    if (!appointment || appointment.cancelled) {
      return res.json({ success: false, message: 'Appointment not found or cancelled' })
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.json({ success: false, message: 'Razorpay keys not configured' })
    }

    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })

    const order = await razorpay.orders.create({
      amount:   appointment.amount * 100,  // paise
      currency: 'INR',
      receipt:  appointmentId
    })

    // Save order ID
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      razorpayOrderId: order.id
    })

    res.json({ success: true, order })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// RAZORPAY — VERIFY PAYMENT + SEND EMAIL
// ─────────────────────────────────────────────────────────────────
export const verifyRazorpay = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.json({ success: false, message: 'Payment verification failed' })
    }

    // Mark as paid (idempotent)
    const appointment = await appointmentModel.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, payment: false },
      { payment: true },
      { new: true }
    )

    if (!appointment) {
      return res.json({ success: true, message: 'Already processed' })
    }

    // Send invoice email
    const userEmail = appointment.email || appointment.userData?.email
    if (userEmail) {
      const subject = '✅ Appointment Confirmed — Payment Successful | Prescripto'
      const html    = buildInvoiceEmail(appointment)
      const text    = `Your appointment with Dr. ${appointment.docData?.name} on ${appointment.slotDate} at ${appointment.slotTime} is confirmed. Amount paid: ₹${appointment.amount}`
      await sendEmail(userEmail, subject, text, html)
    }

    res.json({ success: true, message: 'Payment verified. Confirmation email sent.' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export const getMyPrescriptions = async (req, res) => {
  try {

    const { userId } = req

    const prescriptions = await prescriptionModel
      .find({ userId })
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      prescriptions
    })

  } catch (error) {

    res.json({
      success: false,
      message: error.message
    })

  }
}