import express from 'express'
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay
} from '../controllers/userController.js'

import authUser from '../middleware/authUser.js'
import upload   from '../middleware/multer.js'
import { getMyPrescriptions } from '../controllers/userController.js'

const userRouter = express.Router()

// ── Auth ──────────────────────────────────────────────
userRouter.post('/register', registerUser)
userRouter.post('/login',    loginUser)

// ── Profile ───────────────────────────────────────────
userRouter.get ('/get-profile',    authUser, getProfile)
userRouter.post('/update-profile', authUser, upload.single('image'), updateProfile)

// ── Appointments ──────────────────────────────────────
userRouter.post('/book-appointment',   authUser, bookAppointment)
userRouter.get ('/appointments',       authUser, listAppointment)
userRouter.post('/cancel-appointment', authUser, cancelAppointment)

// ── Payments ──────────────────────────────────────────
userRouter.post('/payment-razorpay', authUser, paymentRazorpay)
userRouter.post('/verify-razorpay',  authUser, verifyRazorpay)
userRouter.get('/prescriptions', authUser, getMyPrescriptions)
export default userRouter