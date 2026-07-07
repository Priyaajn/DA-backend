import mongoose from 'mongoose'

const prescriptionSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },
  userId:        { type: String, required: true },
  docId:         { type: String, required: true },
  medicines: [
    {
      name:      { type: String, required: true },
      dosage:    { type: String, required: true },
      frequency: { type: String, required: true },
      duration:  { type: String, required: true }
    }
  ],
  notes:     { type: String, default: '' },
  nextVisit: { type: String, default: '' },
  issuedAt:  { type: Date, default: Date.now }
}, { timestamps: true })

export default mongoose.models.prescription ||
  mongoose.model('prescription', prescriptionSchema)