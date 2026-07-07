import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import nodemailer from 'nodemailer'

import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import prescriptionModel from '../models/prescriptionModel.js'

// ─────────────────────────────────────────────────────────────────
// DOCTOR LOGIN
// ─────────────────────────────────────────────────────────────────
export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body

    const doctor = await doctorModel.findOne({ email })

    if (!doctor) {
      return res.json({
        success: false,
        message: 'Doctor not found'
      })
    }

    const isMatch = await bcrypt.compare(password, doctor.password)

    if (!isMatch) {
      return res.json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    const token = jwt.sign(
      { id: doctor._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token
    })

  } catch (error) {
    console.log(error)

    res.json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────────────────────────
// ADD DOCTOR
// ─────────────────────────────────────────────────────────────────
export const addDoctor = async (req, res) => {
  res.json({
    success: false,
    message: 'Use /api/admin/add-doctor instead'
  })
}

// ─────────────────────────────────────────────────────────────────
// DOCTOR LIST
// ─────────────────────────────────────────────────────────────────
export const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel
      .find({ available: true })
      .select('-password -email')

    res.json({
      success: true,
      doctors
    })

  } catch (error) {
    console.log(error)

    res.json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────────────────────────
// CHANGE AVAILABILITY
// ─────────────────────────────────────────────────────────────────
export const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body

    const doctor = await doctorModel.findById(docId)

    if (!doctor) {
      return res.json({
        success: false,
        message: 'Doctor not found'
      })
    }

    await doctorModel.findByIdAndUpdate(docId, {
      available: !doctor.available
    })

    res.json({
      success: true,
      message: 'Availability changed'
    })

  } catch (error) {
    console.log(error)

    res.json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────────────────────────
// DOCTOR APPOINTMENTS
// ─────────────────────────────────────────────────────────────────
export const appointmentsDoctor = async (req, res) => {
  try {
    const { docId } = req

    const appointments = await appointmentModel.find({ docId })

    res.json({
      success: true,
      appointments
    })

  } catch (error) {
    console.log(error)

    res.json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────────────────────────
// COMPLETE APPOINTMENT
// ─────────────────────────────────────────────────────────────────
export const appointmentComplete = async (req, res) => {
  try {
    const { docId } = req
    const { appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)

    if (!appointmentData) {
      return res.json({
        success: false,
        message: 'Appointment not found'
      })
    }

    if (appointmentData.docId.toString() !== docId.toString()) {
      return res.json({
        success: false,
        message: 'Unauthorized action'
      })
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      isCompleted: true
    })

    res.json({
      success: true,
      message: 'Appointment completed'
    })

  } catch (error) {
    console.log(error)

    res.json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────────────────────────
// CANCEL APPOINTMENT
// ─────────────────────────────────────────────────────────────────
export const appointmentCancel = async (req, res) => {
  try {
    const { docId } = req
    const { appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)

    if (!appointmentData) {
      return res.json({
        success: false,
        message: 'Appointment not found'
      })
    }

    if (appointmentData.docId.toString() !== docId.toString()) {
      return res.json({
        success: false,
        message: 'Unauthorized action'
      })
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true
    })

    const doctor = await doctorModel.findById(docId)

    let slots_booked = doctor.slots_booked || {}

    const { slotDate, slotTime } = appointmentData

    slots_booked[slotDate] = (slots_booked[slotDate] || []).filter(
      (time) => time !== slotTime
    )

    await doctorModel.findByIdAndUpdate(docId, {
      slots_booked
    })

    res.json({
      success: true,
      message: 'Appointment cancelled'
    })

  } catch (error) {
    console.log(error)

    res.json({
      success: false,
      message: error.message
    })
  }
}

export const completeAppointment = async (req, res) => {
  try {
    const { appointmentId, medicines, notes } = req.body

    // Fetch appointment with full userData + docData
    const appointment = await appointmentModel.findById(appointmentId)
    if (!appointment)
      return res.json({ success: false, message: 'Appointment not found' })

    if (appointment.isCompleted)
      return res.json({ success: false, message: 'Already completed' })

    // 1. Save prescription to DB
    await prescriptionModel.create({
      appointmentId,
      userId:    appointment.userId,
      docId:     appointment.docId,
      medicines,
      notes
    })

    // 2. Mark appointment as completed
    await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })

    // 3. Send email to patient
    const patientEmail = appointment.userData?.email
    const patientName  = appointment.userData?.name
    const doctorName   = appointment.docData?.name
    const apptDate     = new Date(appointment.date).toDateString()
    const fees         = appointment.amount

    const medRows = medicines.map(m => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;color:#111827;font-weight:500">${m.name} <span style="color:#6b7280;font-weight:400">${m.dosage}</span></td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;color:#374151">${m.frequency}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;color:#374151">${m.duration}</td>
      </tr>`).join('')

    const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:620px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">

      <!-- Header -->
      <div style="background:#0C447C;padding:28px 32px">
        <h1 style="color:#fff;font-size:20px;margin:0;font-weight:600">
          🏥 Prescripto — Prescription Ready
        </h1>
        <p style="color:#93c5fd;margin:6px 0 0;font-size:13px">Your appointment is now complete</p>
      </div>

      <!-- Greeting -->
      <div style="padding:24px 32px 0">
        <p style="color:#374151;font-size:15px;margin:0">
          Dear <strong>${patientName}</strong>,
        </p>
        <p style="color:#6b7280;font-size:14px;margin:10px 0 0;line-height:1.6">
          Dr. <strong>${doctorName}</strong> has completed your appointment on <strong>${apptDate}</strong>
          and sent you the prescription below.
        </p>
      </div>

      <!-- Prescription -->
      <div style="padding:20px 32px">
        <div style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden">
          <div style="padding:12px 14px;background:#EFF6FF;border-bottom:1px solid #BFDBFE">
            <p style="margin:0;font-size:13px;font-weight:600;color:#1D4ED8">📋 Prescription</p>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="background:#f9fafb">
                <th style="padding:10px 14px;text-align:left;color:#6b7280;font-weight:500;font-size:12px">Medicine</th>
                <th style="padding:10px 14px;text-align:left;color:#6b7280;font-weight:500;font-size:12px">Frequency</th>
                <th style="padding:10px 14px;text-align:left;color:#6b7280;font-weight:500;font-size:12px">Duration</th>
              </tr>
            </thead>
            <tbody>${medRows}</tbody>
          </table>
          ${notes ? `
          <div style="padding:12px 14px;border-top:1px solid #f3f4f6;font-size:13px;color:#374151;line-height:1.6">
            <strong>Doctor's notes:</strong> ${notes}
          </div>` : ''}
        </div>
      </div>

      <!-- Invoice summary -->
      <div style="padding:0 32px 20px">
        <div style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;padding:14px 16px">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#15803d">💳 Payment Summary</p>
          <table style="width:100%;font-size:13px;color:#374151">
            <tr>
              <td style="padding:4px 0">Consultation fee</td>
              <td style="text-align:right;font-weight:600">₹${fees}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#16a34a">Payment status</td>
              <td style="text-align:right;color:#16a34a;font-weight:600">✔ Paid</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 32px;text-align:center">
        <p style="margin:0;font-size:12px;color:#9ca3af">
          Prescripto Healthcare Platform · Keep this email for your records
        </p>
      </div>
    </div>`

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // Gmail App Password
      }
    })

    await transporter.sendMail({
      from:    `"Prescripto Health" <${process.env.EMAIL_USER}>`,
      to:      patientEmail,
      subject: `Your Prescription from Dr. ${doctorName} · ${apptDate}`,
      html
    })

    res.json({ success: true, message: 'Prescription saved and emailed to patient' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────
// DOCTOR DASHBOARD
// ─────────────────────────────────────────────────────────────────
export const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req

    const appointments = await appointmentModel.find({ docId })

    let earnings = 0

    appointments.forEach((item) => {
      if (item.isCompleted && item.payment) {
        earnings += item.amount
      }
    })

    const patients = [
      ...new Set(appointments.map((item) => item.userId.toString()))
    ]

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: [...appointments].reverse().slice(0, 5)
    }

    res.json({
      success: true,
      dashData
    })

  } catch (error) {
    console.log(error)

    res.json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────────────────────────
// DOCTOR PROFILE
// ─────────────────────────────────────────────────────────────────
export const doctorProfile = async (req, res) => {
  try {
    const { docId } = req

    const profileData = await doctorModel
      .findById(docId)
      .select('-password')

    if (!profileData) {
      return res.json({
        success: false,
        message: 'Doctor not found'
      })
    }

    res.json({
      success: true,
      profileData
    })

  } catch (error) {
    console.log(error)

    res.json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────────────────────────
// UPDATE DOCTOR PROFILE
// ─────────────────────────────────────────────────────────────────
export const updateDoctorProfile = async (req, res) => {
  try {
    const { docId } = req
    const { fees, address, available } = req.body

    await doctorModel.findByIdAndUpdate(docId, {
      fees,
      address,
      available
    })

    res.json({
      success: true,
      message: 'Profile updated'
    })

  } catch (error) {
    console.log(error)

    res.json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────────────────────────
// ADD PRESCRIPTION
// ─────────────────────────────────────────────────────────────────
export const addPrescription = async (req, res) => {
  try {
    const { docId } = req
    const { appointmentId, medicines, notes, nextVisit } = req.body

    const appointment = await appointmentModel.findById(appointmentId)
    if (!appointment)
      return res.json({ success: false, message: 'Appointment not found' })

    if (appointment.docId.toString() !== docId.toString())
      return res.json({ success: false, message: 'Unauthorized action' })

    // Save or update prescription
    const existing = await prescriptionModel.findOne({ appointmentId })
    let prescription
    if (existing) {
      prescription = await prescriptionModel.findOneAndUpdate(
        { appointmentId },
        { medicines, notes, nextVisit },
        { new: true }
      )
    } else {
      prescription = await prescriptionModel.create({
        appointmentId,
        userId:    appointment.userId,
        docId:     appointment.docId,
        medicines,
        notes,
        nextVisit
      })
    }

    // Mark appointment completed
    await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })

    // ── Build variables ───────────────────────────────────────
    const patientName = appointment.userData?.name     || 'Patient'
    const doctorName  = appointment.docData?.name      || 'Doctor'
    const specialty   = appointment.docData?.speciality || ''
    const degree      = appointment.docData?.degree     || ''
    const apptDate    = new Date(appointment.date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
    const fees        = appointment.amount
    const platformFee = 20
    const gst         = ((fees + platformFee) * 0.18).toFixed(2)
    const total       = (fees + platformFee + parseFloat(gst)).toFixed(2)
    const invoiceNum  = `INV-${new Date(appointment.date).getFullYear()}-${String(appointment._id).slice(-5).toUpperCase()}`

    const nextVisitFormatted = nextVisit
      ? new Date(nextVisit).toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })
      : null

    // ── Medicine rows ─────────────────────────────────────────
    const medRows = medicines.map((m, i) => `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'}">
        <td style="padding:11px 16px;border-bottom:1px solid #f0f0f0">
          <span style="font-weight:600;color:#111827">${m.name}</span>
          <span style="color:#6b7280;font-size:12px;margin-left:6px">${m.dosage}</span>
        </td>
        <td style="padding:11px 16px;border-bottom:1px solid #f0f0f0;color:#374151;font-size:13px">${m.frequency}</td>
        <td style="padding:11px 16px;border-bottom:1px solid #f0f0f0;color:#374151;font-size:13px">${m.duration}</td>
      </tr>`).join('')

    // ── Next visit row ────────────────────────────────────────
    const nextVisitRow = nextVisitFormatted ? `
      <tr>
        <td colspan="3" style="padding:13px 16px;background:#FFF7ED;border-top:2px solid #FED7AA">
          <span style="font-size:13px;color:#92400E;font-weight:600">📅 Next Visit: </span>
          <span style="font-size:13px;color:#92400E">${nextVisitFormatted}</span>
        </td>
      </tr>` : ''

    // ── Full email HTML ───────────────────────────────────────
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:24px 0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">

<div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">

  <!-- HEADER -->
  <div style="background:#0C447C;padding:30px 36px">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="vertical-align:top">
          <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px">🏥 Prescripto</div>
          <div style="color:#93c5fd;font-size:12px;margin-top:3px">Healthcare Platform · prescripto.health</div>
        </td>
        <td style="text-align:right;vertical-align:top">
          <div style="color:#bfdbfe;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Invoice</div>
          <div style="color:#ffffff;font-size:20px;font-weight:700">#${invoiceNum}</div>
          <div style="color:#93c5fd;font-size:12px;margin-top:3px">${apptDate}</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- STATUS BAR -->
  <div style="background:#E6F1FB;border-bottom:1px solid #BFDBFE;padding:10px 36px">
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#1D9E75;margin-right:8px;vertical-align:middle"></span>
    <span style="font-size:13px;color:#0C447C;font-weight:500;vertical-align:middle">
      Payment confirmed &nbsp;·&nbsp; Appointment completed on ${apptDate}
    </span>
  </div>

  <!-- GREETING -->
  <div style="padding:28px 36px 0">
    <p style="margin:0;font-size:15px;color:#111827">
      Dear <strong>${patientName}</strong>,
    </p>
    <p style="margin:10px 0 0;font-size:14px;color:#6b7280;line-height:1.7">
      Your appointment with <strong>Dr. ${doctorName}</strong> on <strong>${apptDate}</strong> is now complete.
      Please find your prescription and invoice details below.
    </p>
  </div>

  <!-- PARTIES -->
  <div style="padding:20px 36px 0">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:10px">
          <div style="background:#f9fafb;border-radius:10px;padding:16px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;margin-bottom:8px">Billed to</div>
            <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:4px">${patientName}</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.65">${appointment.userData?.email || ''}</div>
          </div>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:10px">
          <div style="background:#f9fafb;border-radius:10px;padding:16px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;margin-bottom:8px">Consulting doctor</div>
            <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:4px">Dr. ${doctorName}</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.65">${degree} · ${specialty}<br>Prescripto Clinic</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- INVOICE TABLE -->
  <div style="padding:24px 36px 0">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;margin-bottom:10px">Charges breakdown</div>
    <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #f0f0f0">
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:10px 16px;text-align:left;color:#6b7280;font-weight:500;font-size:11px;letter-spacing:.5px;border-bottom:1px solid #f0f0f0">Description</th>
          <th style="padding:10px 16px;text-align:right;color:#6b7280;font-weight:500;font-size:11px;letter-spacing:.5px;border-bottom:1px solid #f0f0f0">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f9fafb;color:#374151;font-size:13px">Consultation fee — ${specialty}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f9fafb;text-align:right;font-weight:600;color:#111827;font-size:13px">₹${fees}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f9fafb;color:#374151;font-size:13px">Platform convenience fee</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f9fafb;text-align:right;font-weight:600;color:#111827;font-size:13px">₹${platformFee}</td>
        </tr>
        <tr style="background:#f9fafb">
          <td style="padding:9px 16px;color:#9ca3af;font-size:12px">GST (18%)</td>
          <td style="padding:9px 16px;text-align:right;color:#9ca3af;font-size:12px">₹${gst}</td>
        </tr>
        <tr style="background:#EFF6FF">
          <td style="padding:14px 16px;font-weight:700;color:#1D4ED8;font-size:14px;border-top:2px solid #BFDBFE">Total Paid</td>
          <td style="padding:14px 16px;text-align:right;font-weight:700;color:#1D4ED8;font-size:16px;border-top:2px solid #BFDBFE">₹${total}</td>
        </tr>
      </tbody>
    </table>
    <div style="margin-top:10px;text-align:right">
      <span style="background:#dcfce7;color:#15803d;font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px">✔ Payment Confirmed</span>
    </div>
  </div>

  <!-- PRESCRIPTION -->
  <div style="padding:24px 36px 0">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;margin-bottom:10px">Prescription</div>
    <div style="border-radius:10px;overflow:hidden;border:1px solid #BFDBFE">

      <div style="background:#EFF6FF;padding:13px 16px;border-bottom:1px solid #BFDBFE">
        <span style="font-size:13px;font-weight:700;color:#1D4ED8">📋 Prescribed by Dr. ${doctorName}</span>
        <span style="font-size:12px;color:#60a5fa;margin-left:8px">${apptDate}</span>
      </div>

      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:9px 16px;text-align:left;color:#6b7280;font-weight:500;font-size:11px;border-bottom:1px solid #f0f0f0;letter-spacing:.5px">Medicine</th>
            <th style="padding:9px 16px;text-align:left;color:#6b7280;font-weight:500;font-size:11px;border-bottom:1px solid #f0f0f0;letter-spacing:.5px">Frequency</th>
            <th style="padding:9px 16px;text-align:left;color:#6b7280;font-weight:500;font-size:11px;border-bottom:1px solid #f0f0f0;letter-spacing:.5px">Duration</th>
          </tr>
        </thead>
        <tbody>
          ${medRows}
          ${nextVisitRow}
        </tbody>
      </table>

      ${notes ? `
      <div style="padding:13px 16px;background:#fffbeb;border-top:1px solid #fde68a">
        <span style="font-size:13px;color:#92400E"><strong>Doctor's notes:</strong> ${notes}</span>
      </div>` : ''}

    </div>
  </div>

  <!-- FOOTER -->
  <div style="padding:28px 36px;margin-top:8px;border-top:1px solid #f3f4f6;text-align:center">
    <p style="margin:0 0 4px;font-size:13px;color:#374151;font-weight:600">Prescripto Healthcare Platform</p>
    <p style="margin:0;font-size:12px;color:#9ca3af">Keep this email for your records · prescripto.health</p>
  </div>

</div>
</body>
</html>`

    // ── Send email ────────────────────────────────────────────
    if (appointment.userData?.email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      })

      await transporter.sendMail({
        from:    `"Prescripto Health" <${process.env.EMAIL_USER}>`,
        to:      appointment.userData.email,
        subject: `Your Prescription & Invoice — Dr. ${doctorName} · ${apptDate}`,
        html
      })
    }

    res.json({
      success: true,
      message: 'Prescription saved and emailed to patient',
      prescription
    })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}