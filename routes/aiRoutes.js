import express from "express";
import { aiChat, getChatHistory } from "../controllers/aiController.js";

const router = express.Router();   // ✅ FIRST create router

router.post("/chat", aiChat);
router.get("/history", getChatHistory);

export default router;