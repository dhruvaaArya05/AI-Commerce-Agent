import express from "express";
import { runAgent } from "../agent/agent.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required."
      });
    }

    const response = await runAgent(message);

    res.json({
      success: true,
      response
    });

  } catch (error) {
    console.error("Chat error:", error);

    res.status(500).json({
      success: false,
      error: "Something went wrong while processing your message."
    });
  }
});

export default router;