import express from 'express'
import {
  loginAdmin,
  appointmentsAdmin,
  appointmentCancel,
  addDoctor,
  allDoctors,
  allPatients,
  adminDashboard
} from '../controllers/adminController.js'

import { changeAvailability } from '../controllers/doctorController.js'
import authAdmin from '../middleware/authAdmin.js'
import upload    from '../middleware/multer.js'

const adminRouter = express.Router()

// ── Public ────────────────────────────────────────────
adminRouter.post('/login', loginAdmin)

// ── Protected ─────────────────────────────────────────
adminRouter.post('/add-doctor',          authAdmin, upload.single('image'), addDoctor)
adminRouter.get ('/all-doctors',         authAdmin, allDoctors)
adminRouter.get ('/all-patients',        authAdmin, allPatients)
adminRouter.get ('/appointments',        authAdmin, appointmentsAdmin)
adminRouter.post('/cancel-appointment',  authAdmin, appointmentCancel)
adminRouter.post('/change-availability', authAdmin, changeAvailability)
adminRouter.get ('/dashboard',           authAdmin, adminDashboard)

export default adminRouter