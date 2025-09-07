import fetch from "node-fetch"; // if on Node 18+, global fetch is available
import dotenv from "dotenv";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const callOpenRouter = async (request) => {
    // Forward to OpenRouter
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    return await response.json();
}

const callOpenRouterMock = async (request) => {
    // simulate delay
    new Promise(resolve => setTimeout(resolve, 1000));
    // example response
    const response = {
        "id": "gen-1757263276-H7SkDAG3ZAycppZ7j65Z",
        "provider": "Chutes",
        "model": "deepseek/deepseek-chat-v3-0324:free",
        "object": "chat.completion",
        "created": 1757263277,
        "choices": [
            {
                "logprobs": null,
                "finish_reason": "stop",
                "native_finish_reason": "stop",
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "The heavy wooden door creaked ominously under Anna's careful touch, its ancient iron hinges groaning from disuse. Torchlight flickered along the damp stone walls of the ruin, casting long shadows that danced like restless spirits. The air smelled of mildew and something faintly metallic—blood? Rust?  \n\nFinding no obvious traps, Anna pushed the door open wider, revealing a hall lined with cracked pillars and broken statues of forgotten gods. At the far end, a stone pedestal glimmered with something—perhaps treasure, perhaps a trap. A soft, whispering rustle echoed from deeper within, too faint to pinpoint.  \n\nWas something *alive* in here?",
                    "refusal": null,
                    "reasoning": null
                }
            }
        ],
        "usage": {
            "prompt_tokens": 438,
            "completion_tokens": 277,
            "total_tokens": 715,
            "prompt_tokens_details": null
        }
    }
    return response
}

// format: [{role: "system", content: "abc"}, {role: "assistant", content: "abc"}, {role: "user", content: "abc"}]
const modifyRequestMessages = (messages) => {
    messages = [
        { role: "system", content: "I'm testing something right now. If you can see this, include 'TEST MESSAGE CODE 359 RECEIVED' in your reply." },
        ...messages,
    ]
    return messages
}

// format: "abc"
const modifyResponseMessage = (content) => {
    return `[Modified Reply] ${content}`
}

export const endpointCompletion = async (req, res) => {
  console.log("Chat completing...")
  try {
    // Log raw incoming request from Janitor AI
    console.log("Incoming request from Janitor AI:");
    console.dir(req.body, { depth: null });

    // Modify the request
    const modifiedRequest = {
      ...req.body,
      messages: modifyRequestMessages(req.body.messages),
    };

    // Forward to OpenRouter
    const data = await callOpenRouterMock(modifiedRequest)

    // Log the raw response from OpenRouter
    console.log("Response from OpenRouter:");
    console.dir(data, { depth: null });

    // If there's an error, quit early
    if(data?.error?.code!=undefined) {
      return res.status(data.error.code).json(data.error);
    }

    // Modify the response
    const modifiedResponse = {
      ...data,
      choices: data.choices.map(choice => ({
        ...choice,
        message: {
          ...choice.message,
          content: modifyResponseMessage(choice.message.content),
        },
      })),
    };

    // Send back to Janitor AI
    res.json(modifiedResponse);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: String(error), code: 500 });
  }
};