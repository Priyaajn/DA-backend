import jwt from 'jsonwebtoken'

// ✅ Frontend sends header key 'dtoken' (lowercase) — matches DoctorContext axios calls
const authDoctor = async (req, res, next) => {
  try {
    const { dtoken } = req.headers

    if (!dtoken) {
      return res.json({ success: false, message: 'Not Authorized. Login Again.' })
    }

    const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)

    // token_decode is the decoded payload object  { id: "doctor_mongo_id" }
    req.docId = token_decode.id

    next()

  } catch (error) {
    console.log('authDoctor error:', error.message)
    res.json({ success: false, message: error.message })
  }
}

export default authDoctor