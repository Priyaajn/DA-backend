import cron from "node-cron";
import sendEmail from "../utils/sendEmail.js";
import appointmentModel from "../models/appointmentModel.js";

// ⏰ Runs every day at 8:00 AM
// Sends a day-before reminder ONLY for PAID appointments
cron.schedule("0 8 * * *", async () => {
    console.log("⏰ Running daily reminder cron...");

    try {
        const now = new Date();

        // Tomorrow's date range
        const tomorrowStart = new Date(now);
        tomorrowStart.setDate(now.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(now);
        tomorrowEnd.setDate(now.getDate() + 1);
        tomorrowEnd.setHours(23, 59, 59, 999);

        // ✅ Only PAID, not cancelled, reminderSent:false, scheduled tomorrow
        // ✅ confirmationSent is NOT checked here — that's only for payment emails
        const appointments = await appointmentModel.find({
            payment: true,
            cancelled: false,
            reminderSent: false,   // ✅ only this flag for cron
            date: {
                $gte: tomorrowStart.getTime(),
                $lte: tomorrowEnd.getTime(),
            },
        });

        console.log(`📋 Found ${appointments.length} appointments for tomorrow`);

        for (const appt of appointments) {
            const userEmail = appt.email || appt.userData?.email;
            if (!userEmail) {
                console.log(`⚠️ No email for ${appt._id}, skipping`);
                continue;
            }

            const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            const dateArray = appt.slotDate.split("_");
            const formattedDate = `${dateArray[0]} ${months[Number(dateArray[1]) - 1]} ${dateArray[2]}`;

            const subject = "🔔 Appointment Reminder - Tomorrow | Prescripto";
            const text = `Dear ${appt.userData?.name || "Patient"}, reminder: your appointment with ${appt.docData?.name} is tomorrow ${formattedDate} at ${appt.slotTime}.`;

            const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.12);">

  <div style="height:5px;background:linear-gradient(90deg,#1d4ed8,#06b6d4,#10b981);"></div>

  <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a,#1d4ed8);padding:36px 40px;">
    <div style="font-size:26px;font-weight:800;color:#fff;">🏥 Prescripto</div>
    <div style="color:#93c5fd;font-size:11px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Appointment Reminder</div>
    <div style="margin-top:20px;">
      <span style="background:#f59e0b;color:#fff;font-size:11px;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:1px;">
        🔔 TOMORROW'S APPOINTMENT
      </span>
    </div>
  </div>

  <div style="padding:32px 40px;">
    <p style="font-size:16px;color:#374151;margin:0 0 8px;">
      Dear <strong style="color:#1e3a8a;">${appt.userData?.name || "Patient"}</strong>,
    </p>
    <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 24px;">
      This is a friendly reminder that you have a medical appointment scheduled for <strong>tomorrow</strong>. Please make sure to be on time.
    </p>

    <div style="background:linear-gradient(135deg,#eff6ff,#f0f9ff);border-radius:14px;padding:24px;border:1px solid #dbeafe;margin-bottom:20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e0e7ff;">
            <span style="font-size:12px;color:#64748b;display:block;">👨‍⚕️ Doctor</span>
            <span style="font-size:15px;font-weight:700;color:#1e3a8a;">${appt.docData?.name || "Doctor"}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e0e7ff;">
            <span style="font-size:12px;color:#64748b;display:block;">🏥 Speciality</span>
            <span style="font-size:14px;font-weight:600;color:#374151;">${appt.docData?.speciality || ""}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e0e7ff;">
            <span style="font-size:12px;color:#64748b;display:block;">📅 Date</span>
            <span style="font-size:14px;font-weight:600;color:#374151;">${formattedDate}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;">
            <span style="font-size:12px;color:#64748b;display:block;">🕐 Time</span>
            <span style="font-size:14px;font-weight:600;color:#374151;">${appt.slotTime}</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
        ⏰ Please arrive <strong>10 minutes early</strong>. Carry a valid ID and any previous medical records.
      </p>
    </div>
  </div>

  <div style="padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
    <div style="font-size:18px;font-weight:800;color:#1e3a8a;">🏥 Prescripto</div>
    <div style="font-size:11px;color:#94a3b8;margin-top:4px;">© 2026 Prescripto Health Platform. All rights reserved.</div>
  </div>

  <div style="height:5px;background:linear-gradient(90deg,#1d4ed8,#06b6d4,#10b981);"></div>
</div>
</body>
</html>`;

            await sendEmail(userEmail, subject, text, html);

            // ✅ Mark ONLY reminderSent — never touch confirmationSent here
            appt.reminderSent = true;
            await appt.save();

            console.log(`✅ Reminder sent to ${userEmail}`);
        }

        console.log(`✅ Cron done. ${appointments.length} reminders sent.`);

    } catch (error) {
        console.log("❌ Cron error:", error.message);
    }
});