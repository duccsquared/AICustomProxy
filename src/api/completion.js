import fetch from "node-fetch"; // if on Node 18+, global fetch is available
import dotenv from "dotenv";
import { callOpenRouterMock, callOpenRouterMock2 } from "../mock/openrouter.js";
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const callOpenRouter = async (request) => {
  // Forward to OpenRouter
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  return await response.json();
};

const runStats = (command, messages) => {
  const lines = [];
  lines.push(`message count: ${messages.length}`);
  messages.sort((a, b) => a.content.length - b.content.length);
  lines.push(`shortest message: ${messages[0].content.length} chars`);
  lines.push(
    `longest message: ${messages[messages.length - 1].content.length} chars`
  );
  lines.push(
    `total length: ${messages.reduce(
      (prev, curr) => prev + curr.content.length,
      0
    )} chars`
  );
  return lines.join("\n");
};

const modifyRequestMessages = (messages) => {
  messages = [...messages];
  return messages;
};

// format: "abc"
const modifyResponseMessage = (content) => {
  // const lines = content.split("\n");
  // return lines.join("\n");
  return content;
};

const commands = [{ name: "/stats", standard: false, func: runStats }];

const findCommand = (message) => {
  const lines = message.content.split("\n");
  for (let line of lines) {
    for (let command of commands) {
      if (line.includes(command.name)) {
        return command;
      }
    }
  }
  return null;
};

const standardFlow = async (req, res) => {
  console.log("Chat completing...");
  try {
    // Modify the request
    const modifiedRequest = {
      ...req.body,
      messages: modifyRequestMessages(req.body.messages),
    };
    console.log("Modified Request:", modifiedRequest);
    // Forward to OpenRouter
    const data = await callOpenRouterMock(modifiedRequest);

    // Log the raw response from OpenRouter
    console.log("Response from OpenRouter:");
    console.dir(data, { depth: null });

    // If there's an error, quit early
    if (data?.error?.code != undefined) {
      return res.status(data.error.code).json(data.error);
    }

    // Modify the response
    const modifiedResponse = {
      ...data,
      choices: data.choices.map((choice) => ({
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
    res.status(500).json({
      error: {
        message: String(error),
        code: 500,
        metadata: {
          raw: String(error),
          provider_name: "Chutes",
        },
      },
      code: 500,
    });
  }
};

export const endpointCompletion = async (req, res) => {
  console.log("Running");
  try {
    // Log raw incoming request from Janitor AI
    console.log("Incoming request from Janitor AI:");
    console.dir(req.body, { depth: null });

    let command = findCommand(req.body.messages[req.body.messages.length - 1]);
    if (command == null || command.standard) {
      return standardFlow(req, res);
    } else {
      const result = {
        id: "command-" + Date.now(),
        object: "chat.completion",
        choices: [
          { message: { content: command.func(command, req.body.messages) } },
        ],
      };
      res.json(result);
    }
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({
      error: {
        message: String(error),
        code: 500,
        metadata: {
          raw: String(error),
          provider_name: "Chutes",
        },
      },
      code: 500,
    });
  }
};
