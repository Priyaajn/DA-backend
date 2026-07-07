import nodemailer from "nodemailer"

// ============================
// TRANSPORTER (named export)
// ============================

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

transporter.verify((error) => {
  if (error) {
    console.log("SMTP ERROR:", error);
  } else {
    console.log("SMTP SERVER READY");
  }
});
// ============================
// SIMPLE SEND HELPER (default export)
// ============================

const sendEmail = async (to, subject, text) => {
  try {
    console.log("📧 Sending email to:", to)

    if (!to) { console.log("❌ No recipient"); return }
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("❌ EMAIL_USER or EMAIL_PASS missing"); return
    }

    const info = await transporter.sendMail({
      from: `"Prescripto Health" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    })

    console.log("✅ Email sent:", info.messageId)
    return info

  } catch (error) {
    console.log("❌ Email error:", error.message)
    throw error
  }
}

// ============================
// BUILD INVOICE HTML (named export)
// ============================

export const buildInvoiceEmail = (appointment) => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

  const formatDate = (slotDate) => {
    if (!slotDate) return ""
    const d = slotDate.split("_")
    return `${d[0]} ${months[Number(d[1]) - 1]} ${d[2]}`
  }

  const receiptNo     = "RCP-" + appointment._id?.toString().slice(-8).toUpperCase()
  const bookingId     = appointment._id?.toString().slice(-10).toUpperCase()
  const formattedDate = formatDate(appointment.slotDate)
  const bookedOn      = new Date(appointment.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
  const bookedTime    = new Date(appointment.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

  const patientName  = appointment.userData?.name  || "Patient"
  const patientEmail = appointment.userData?.email || ""
  const patientPhone = appointment.userData?.phone || "—"
  const doctorName   = appointment.docData?.name       || "Doctor"
  const speciality   = appointment.docData?.speciality || ""
  const degree       = appointment.docData?.degree     || ""
  const experience   = appointment.docData?.experience || ""
  const amount       = appointment.amount || 0

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Invoice - Prescripto</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;">
<div style="max-width:640px;margin:32px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.12);">

  <div style="height:5px;background:linear-gradient(90deg,#1d4ed8,#06b6d4,#10b981);"></div>

  <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#1d4ed8 100%);padding:40px 48px 36px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="font-size:28px;font-weight:800;color:#fff;">🏥 Prescripto</div>
        <div style="color:#93c5fd;font-size:12px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Healthcare · Appointments · Care</div>
      </td>
      <td align="right">
        <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:12px 20px;">
          <div style="color:#93c5fd;font-size:9px;letter-spacing:3px;text-transform:uppercase;">Receipt No.</div>
          <div style="color:#fff;font-size:18px;font-weight:700;margin-top:3px;">${receiptNo}</div>
        </div>
      </td>
    </tr></table>
    <div style="margin-top:28px;">
      <span style="background:#10b981;color:#fff;font-size:11px;font-weight:700;padding:5px 14px;border-radius:20px;">✓ PAYMENT CONFIRMED</span>
      <span style="color:#93c5fd;font-size:12px;margin-left:12px;">${bookedOn} at ${bookedTime}</span>
    </div>
  </div>

  <div style="padding:32px 48px 0;">
    <p style="font-size:16px;color:#374151;margin:0;">Dear <strong style="color:#1e3a8a;">${patientName}</strong>,</p>
    <p style="font-size:14px;color:#6b7280;margin:8px 0 0;line-height:1.6;">Your appointment has been confirmed and payment received. Please find your invoice below.</p>
  </div>

  <div style="margin:28px 48px;height:1px;background:linear-gradient(90deg,#e0e7ff,#e0f2fe,#d1fae5);"></div>

  <div style="padding:0 48px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="50%" style="padding-right:20px;vertical-align:top;">
        <div style="background:#f8fafc;border-radius:12px;padding:18px 20px;border-left:3px solid #1d4ed8;">
          <div style="font-size:9px;color:#94a3b8;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;">Bill To</div>
          <div style="font-size:16px;font-weight:700;color:#0f172a;">${patientName}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">${patientEmail}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">📞 ${patientPhone}</div>
        </div>
      </td>
      <td width="50%" style="vertical-align:top;">
        <div style="background:#f8fafc;border-radius:12px;padding:18px 20px;border-left:3px solid #06b6d4;">
          <div style="font-size:9px;color:#94a3b8;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;">Appointment</div>
          <div style="font-size:15px;font-weight:700;color:#0f172a;">📅 ${formattedDate}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">🕐 ${appointment.slotTime}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px;">ID: #${bookingId}</div>
        </div>
      </td>
    </tr></table>
  </div>

  <div style="margin:24px 48px 0;">
    <div style="background:linear-gradient(135deg,#eff6ff,#f0f9ff);border-radius:14px;padding:22px 24px;border:1px solid #dbeafe;">
      <div style="font-size:9px;color:#94a3b8;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">👨‍⚕️ Consulting Doctor</div>
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <div style="font-size:18px;font-weight:800;color:#1e3a8a;">${doctorName}</div>
          <div style="font-size:13px;color:#3b82f6;margin-top:3px;font-weight:600;">${speciality}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:3px;">${degree} · ${experience} experience</div>
        </td>
        <td align="right"><div style="background:#1d4ed8;color:#fff;font-size:11px;font-weight:600;padding:6px 14px;border-radius:8px;">Verified ✓</div></td>
      </tr></table>
    </div>
  </div>

  <div style="margin:28px 48px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead><tr style="background:#f1f5f9;">
        <th style="text-align:left;font-size:10px;color:#64748b;letter-spacing:2px;text-transform:uppercase;padding:12px 16px;">Description</th>
        <th style="text-align:center;font-size:10px;color:#64748b;letter-spacing:2px;text-transform:uppercase;padding:12px 8px;">Qty</th>
        <th style="text-align:right;font-size:10px;color:#64748b;letter-spacing:2px;text-transform:uppercase;padding:12px 16px;">Amount</th>
      </tr></thead>
      <tbody>
        <tr>
          <td style="padding:16px;border-bottom:1px solid #f1f5f9;">
            <div style="font-size:14px;font-weight:600;color:#0f172a;">Medical Consultation Fee</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">${speciality} · ${formattedDate} · ${appointment.slotTime}</div>
          </td>
          <td style="text-align:center;padding:16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#374151;">1</td>
          <td style="text-align:right;padding:16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#0f172a;">₹${amount}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:#64748b;">GST @ 18%</td>
          <td style="text-align:center;padding:12px 8px;font-size:13px;color:#64748b;">—</td>
          <td style="text-align:right;padding:12px 16px;font-size:13px;color:#64748b;">Included</td>
        </tr>
      </tbody>
      <tfoot><tr style="background:linear-gradient(135deg,#eff6ff,#f0f9ff);">
        <td colspan="2" style="padding:18px 16px;font-size:15px;font-weight:700;color:#0f172a;">Total Amount Paid</td>
        <td style="text-align:right;padding:18px 16px;"><span style="font-size:24px;font-weight:800;color:#1d4ed8;">₹${amount}</span></td>
      </tr></tfoot>
    </table>
  </div>

  <div style="margin:24px 48px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:16px 20px;"><tr>
      <td>
        <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Payment Method</div>
        <div style="font-size:14px;font-weight:600;color:#374151;margin-top:4px;">💳 Razorpay · Secure Online Payment</div>
      </td>
      <td align="right"><div style="background:#10b981;color:#fff;font-size:12px;font-weight:800;padding:8px 18px;border-radius:24px;">PAID ✓</div></td>
    </tr></table>
  </div>

  <div style="margin:20px 48px 0;">
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">⏰ <strong>Reminder:</strong> Please arrive <strong>10 minutes early</strong>. Carry a valid ID and any previous medical records.</p>
    </div>
  </div>

  <div style="margin:32px 48px 0;padding:24px 0;border-top:1px solid #e2e8f0;text-align:center;">
    <div style="font-size:20px;font-weight:800;color:#1e3a8a;margin-bottom:6px;">🏥 Prescripto</div>
    <div style="font-size:11px;color:#94a3b8;">This is a computer-generated receipt. No signature required.</div>
  </div>

  <div style="height:5px;background:linear-gradient(90deg,#1d4ed8,#06b6d4,#10b981);margin-top:24px;"></div>
</div>
</body>
</html>`
}

export default sendEmail