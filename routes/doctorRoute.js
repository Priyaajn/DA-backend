import express from 'express'
import {
  loginDoctor,
  doctorList,
  appointmentsDoctor,
  appointmentCancel,
  appointmentComplete,
  changeAvailability,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile
} from '../controllers/doctorController.js'

import authDoctor from '../middleware/authDoctor.js'
import { addPrescription } from '../controllers/doctorController.js'
import { completeAppointment } from '../controllers/doctorController.js'


const doctorRouter = express.Router()

// ── Public ────────────────────────────────────────────
doctorRouter.post('/login', loginDoctor)
doctorRouter.get ('/list',  doctorList)

// ── Protected ─────────────────────────────────────────
doctorRouter.get ('/appointments',         authDoctor, appointmentsDoctor)
doctorRouter.post('/cancel-appointment',   authDoctor, appointmentCancel)
doctorRouter.post('/complete-appointment', authDoctor, appointmentComplete)
doctorRouter.post('/change-availability',  authDoctor, changeAvailability)
doctorRouter.get ('/dashboard',            authDoctor, doctorDashboard)
doctorRouter.get ('/profile',              authDoctor, doctorProfile)
doctorRouter.post('/update-profile',       authDoctor, updateDoctorProfile)
doctorRouter.post('/add-prescription', authDoctor, addPrescription)
doctorRouter.post('/complete-appointment', authDoctor, completeAppointment)

export default doctorRouter