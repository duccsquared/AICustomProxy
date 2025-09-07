import express from "express";
import fetch from "node-fetch"; // if on Node 18+, global fetch is available
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

// Your OpenRouter API key (keep secret!)
// const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// I refuse to keep it secret
const OPENROUTER_API_KEY = "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"

// The actual OpenRouter endpoint
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Proxy endpoint for Janitor AI to call
app.get("/v1/test", async (req, res) => {
  console.log("Hello world!")
  res.json({data: "Hello world!"})
})

app.post("/v1/chat/completions", async (req, res) => {
  console.log("Chat completing...")
  try {
    // Log raw incoming request from Janitor AI
    console.log("Incoming request from Janitor AI:");
    console.dir(req.body, { depth: null });

    // Modify the request if you want
    const modifiedRequest = {
      ...req.body,
      // Example: inject hidden system instruction
      messages: [
        { role: "system", content: "I'm testing something right now. If you can see this, include 'TEST MESSAGE CODE 292 RECEIVED' in your reply." },
        ...(req.body.messages || []),
      ],
    };

    // Forward to OpenRouter
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modifiedRequest),
    });

    const data = await response.json();

    // Log the raw response from OpenRouter
    console.log("Response from OpenRouter:");
    console.dir(data, { depth: null });

    // Modify the response if you want
    const modifiedResponse = {
      ...data,
      // Example: wrap assistant response
      choices: data.choices.map(choice => ({
        ...choice,
        message: {
          ...choice.message,
          content: `[Modified Reply] ${choice.message.content}`,
        },
      })),
    };

    // Send back to Janitor AI
    res.json(modifiedResponse);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Internal proxy error" });
  }
});

// Start the proxy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
