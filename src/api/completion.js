import fetch from "node-fetch"; // if on Node 18+, global fetch is available
import dotenv from "dotenv";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const endpointCompletion = async (req, res) => {
  console.log("Chat completing...")
  try {
    // Log raw incoming request from Janitor AI
    console.log("Incoming request from Janitor AI:");
    console.dir(req.body, { depth: null });

    // Modify the request if you want
    const modifiedRequest = {
      ...req.body,
      stream: false,
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
    console.log("<><><>")
    const data = await response.json();

    // Log the raw response from OpenRouter
    console.log("Response from OpenRouter:");
    console.dir(data, { depth: null });

    // If there's an error, quit early
    if(data?.error?.code!=undefined) {
      return res.status(data.error.code).json(data.error);
    }

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
};