import jwt from 'jsonwebtoken'

// ✅ Frontend sends header key 'token' — matches AppContext axios calls
const authUser = async (req, res, next) => {
  try {
    const { token } = req.headers

    if (!token) {
      return res.json({ success: false, message: 'Not Authorized. Login Again.' })
    }

    const token_decode = jwt.verify(token, process.env.JWT_SECRET)

    // token_decode payload: { id: "user_mongo_id" }
    req.userId = token_decode.id

    next()

  } catch (error) {
    console.log('authUser error:', error.message)
    res.json({ success: false, message: error.message })
  }
}

export default authUser