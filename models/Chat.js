import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  message: String,
  response: String,
  // ✅ store conversation state per user
  step: { type: String, default: null },
  symptom: { type: String, default: null },
  duration: { type: String, default: null },
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;