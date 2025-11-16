import fetch from "node-fetch"; // if on Node 18+, global fetch is available
import dotenv from "dotenv";
import { callOpenRouterMock, callOpenRouterMock2 } from "../mock/openrouter.js";
import llamaTokenizer from "llama-tokenizer-js";
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

const getWordCount = (strVal) => {
  return strVal.split(' ').length
}

const getTokenCount = (strVal) => {
  return llamaTokenizer.encode(strVal).length
}

const getWordTokenString = (message) => {
  return `${message.tokens} tokens (${message.words} words) `
}

const getWordTokenStringSum = (messages,tokenFunc,wordFunc) => {
  return `${Math.round(messages.reduce((prev,curr,index)=>tokenFunc(prev,curr.tokens,index),0))} tokens (${Math.round(messages.reduce((prev,curr,index)=>wordFunc(prev,curr.words,index),0))} words) `
}

const runStats = (command, messages) => {

  messages.forEach((message) => {
    message.words = getWordCount(message.content)
    message.tokens = getTokenCount(message.content)
  })

  const lines = [];
  let firstMessageContent = messages.find((message) => message.role!="system").content 

  lines.push(`---- overall ----`)
  lines.push(`message count: ${messages.length}`);
  messages.sort((a, b) => a.tokens - b.tokens);
  lines.push(`shortest: ${getWordTokenString(messages[0])}`);
  lines.push(`longest: ${getWordTokenString(messages[messages.length - 1])}` );
  lines.push(`average: ${getWordTokenStringSum(messages,(prev,tokens,index)=>(prev*index+tokens)/(index+1),(prev,words,index)=>(prev*index+words)/(index+1))}`)
  lines.push(`total: ${getWordTokenStringSum(messages,(prev,tokens,index)=>prev+tokens,(prev,words,index)=>prev+words)}`);
  lines.push(`oldest message: "${firstMessageContent.split(" ").slice(0,10).join(" ") ?? "N/A"}..."`)
  for(let messageType of ["system","assistant","user"]) {
    let filteredMessages = messages.filter((message)=>message.role==messageType)
    if(filteredMessages.length==0) continue;
    lines.push(`\n---- ${messageType} ----`)
    lines.push(`message count: ${filteredMessages.length}`);
    filteredMessages.sort((a, b) => a.tokens - b.tokens);
    lines.push(`shortest: ${getWordTokenString(filteredMessages[0])}`);
    lines.push(`longest: ${getWordTokenString(filteredMessages[filteredMessages.length - 1])}` );
    lines.push(`average: ${getWordTokenStringSum(filteredMessages,(prev,tokens,index)=>(prev*index+tokens)/(index+1),(prev,words,index)=>(prev*index+words)/(index+1))}`)
    lines.push(`total: ${getWordTokenStringSum(filteredMessages,(prev,tokens,index)=>prev+tokens,(prev,words,index)=>prev+words)}`);
  }

  return lines.join("\n");
};

const runEcho = (command, messages) => {
  return JSON.stringify([messages[0],messages[messages.length-1]],undefined,2)
}

const MEMORY_PROMPT = `
DEBUG: Create a brief, focused summary of the roleplay between {{char}} and {{user}} based on the chat history. Structure the summary as follows and do not include additional text outside the requested structure:
1) plot: a set of 1 - 2 sentence long bullet points with each bullet point covering one major story beat.
2) characters: important characters in the story. Each character should have 2 - 4 bullet points describing their personality, background, and relevant story events
3) locations: important locations where story events took place. 2 - 4 bullet points per location.
4) additional information: bullet points relevant for understanding important context behind the existing story that isn't covered in previous sections. leave empty if there is no extra information needed.
`


const addMemoryPrompt = (command,messages) => {
  return [...messages,{role: "system", content: MEMORY_PROMPT}]
}

const commands = [
  { name: "/stats", standard: false, func: runStats },
  { name: "/echo", standard: false, func: runEcho },
  { name: "/memory", standard: true, func: addMemoryPrompt, json: true }
];

const modifyRequestMessages = (messages,command) => {
  // messages = [...messages];
  if(command!=null) {
    messages = command.func(command,messages)
  }
  return messages;
};

// format: "abc"
const modifyResponseMessage = (content,command) => {
  // const lines = content.split("\n");
  // return lines.join("\n");
  return content;
};



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

const standardFlow = async (req, res, command) => {
  console.log("Chat completing...");
  try {
    // Modify the request
    const modifiedRequest = {
      ...req.body,
      messages: modifyRequestMessages(req.body.messages, command),
    };
    console.log("Modified Request:", modifiedRequest);
    // Forward to OpenRouter
    const data = await callOpenRouter(modifiedRequest);

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
          content: modifyResponseMessage(choice.message.content, command),
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
      return standardFlow(req, res, command);
    } else {
      const result = {
        id: "command-" + Date.now(),
        object: "chat.completion",
        provider: "Chutes",
        model: req.body.model,
        choices: [
          { 
            logprobs: null,
            finish_reason: "stop",
            native_finish_reason: "stop",
            index: 0,
            message: { role: "assistant", content: command.func(command, req.body.messages) } },
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
