import express from "express";
import cors from "cors";
import "dotenv/config";
import morgan from "morgan";

// Database & Cloudinary
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

// Routes
import userRouter from "./routes/userRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import adminRouter from "./routes/adminRoute.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import appointmentRoute from "./routes/appointmentRoute.js";

// Cron Job
import "./cron/reminderCron.js";

const app = express();
const PORT = process.env.PORT || 4000;

/* ================= MIDDLEWARE ================= */

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://da-frontend-l39p.onrender.com",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Request Logger
app.use((req, res, next) => {
  console.log("🌐 Request:", req.method, req.url);
  next();
});

/* ================= ROUTES ================= */

app.use("/api/ai", aiRoutes);

app.use("/api/user", userRouter);

app.use("/api/admin", adminRouter);

app.use("/api/doctor", doctorRouter);

app.use("/api/payment", paymentRoutes);

app.use("/api/appointment", appointmentRoute);

/* ================= TEST ROUTES ================= */

app.get("/", (req, res) => {
  res.send("API Working 🚀");
});

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Test route working",
  });
});

/* ================= START SERVER ================= */

const startServer = async () => {
  try {
    // Connect Database
    await connectDB();

    // Connect Cloudinary
    await connectCloudinary();

    // Start Server
    app.listen(PORT, () => {
      console.log(`🚀 Server started on PORT: ${PORT}`);
    });

  } catch (error) {
    console.log("❌ Server failed:", error.message);
  }
};

startServer();