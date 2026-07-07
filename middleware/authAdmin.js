import jwt from 'jsonwebtoken'

// ✅ authAdmin verifies that the token payload equals ADMIN_EMAIL + ADMIN_PASSWORD
//    This works because loginAdmin signs:  jwt.sign(email + password, JWT_SECRET)
const authAdmin = async (req, res, next) => {
  try {
    const { atoken } = req.headers   // frontend sends lowercase 'atoken'

    if (!atoken) {
      return res.json({ success: false, message: 'Not Authorized. Login Again.' })
    }

    const token_decode = jwt.verify(atoken, process.env.JWT_SECRET)

    // token_decode is the plain string  "admin@prescripto.comAdmin@12345"
    if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      return res.json({ success: false, message: 'Not Authorized. Invalid Token.' })
    }

    next()

  } catch (error) {
    console.log('authAdmin error:', error.message)
    res.json({ success: false, message: error.message })
  }
}

export default authAdmin