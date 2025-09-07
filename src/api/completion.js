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
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    return await response.json();
}


const RPG_1 = "This chat includes an RPG stat tracker to manage inventory, equipment, gold, and health. Do not include the stat section in your reply as it is managed by an external system. Instead, commands can be placed at the end of your message to modify the stats, with each command starting with \"/RPG\". For example, \"/RPG CHANGEHP -10\" reduces the user's hp by 10. Available commands:"
const RPG_SET_MAX_HEALTH = "SET_MAX_HP <amount>"
const RPG_SET_HEALTH = "SET_HP <amount>"
const RPG_CHANGE_HP = "CHANGE_HP <amount>"
const RPG_SET_GOLD = "SET_GOLD <amount>"
const RPG_CHANGE_GOLD = "CHANGE_GOLD <amount>"
const RPG_ADD_ITEM = "ADD_ITEM <name> <amount>"
const RPG_REMOVE_ITEM = "REMOVE_ITEM <name> <amount>"
const RPG_ADD_EQUIPPED = "ADD_EQUIPPED <name>"
const RPG_REMOVE_EQUIPPED = "REMOVE_EQUIPPED <name>"
const RPG_2 = "\nIf the previous assistant message doesn't include an RPG Stat section, set starting values for max hp, gold, inventory items (eg \"Iron Sword\"), and equipped items (eg \"Mage Robe\") based on previous context using the commands. Otherwise, modify the stats based on the actions of you or the user."
// format: [{role: "system", assistant: "abc"}, {role: "assistant", content: "abc"}, {role: "user", content: "abc"}]
const RPG_SYSTEM_MESSAGES = [RPG_1,RPG_SET_MAX_HEALTH,RPG_SET_HEALTH,RPG_CHANGE_HP,RPG_SET_GOLD,RPG_CHANGE_GOLD,RPG_ADD_ITEM,RPG_REMOVE_ITEM,RPG_ADD_EQUIPPED,RPG_REMOVE_EQUIPPED,RPG_2]
const modifyRequestMessages = (messages) => {
    messages = [
        { role: "system", content: RPG_SYSTEM_MESSAGES.join("\n") },
        ...messages,
    ]
    return messages
}

const rpgData = {
    maxHp: 0,
    hp: 0,
    gold: 0,
    inventory: [],
    equipped: []
}

const commands = {
    SET_MAX_HP: (args) => {
        rpgData.maxHp = parseInt(args[0])
    },
    SET_HP: (args) => {
        rpgData.hp = parseInt(args[0])
    },
    SET_GOLD: (args) => {
        rpgData.gold = parseInt(args[0])
    },
    ADD_ITEM: (args) => {
        rpgData.inventory.push(args.slice(0,-1).join(" ") + (args.slice(-1)[0]!="1"?` (${args.slice(-1)[0]})`:''))
    },
    ADD_EQUIPPED: (args) => {
        rpgData.equipped.push(args.join(" "))
    }
}

const parseCommand = (command) => {
    console.log("running command:", command)
    const parts = command.split(" ")
    if(parts.length < 2) {
        console.log("COMMAND ERROR: insufficient sections")
        return
    }
    const commandName = parts[1]
    if(commands[commandName]!=undefined) {
        commands[commandName](parts.slice(2))
    } else {
        console.log("COMMAND ERROR: unknown command", commandName)
    }

}

// format: "abc"
const modifyResponseMessage = (content) => {
    const lines = content.split("\n")
    const finalLines = []
    for(let line of lines) {
        // check if line starts with "/RPG"
        if(line.trim().startsWith("/RPG")) {
            parseCommand(line)
        }
        else {
            finalLines.push(line)
        }
    }
    // add rpg section
    finalLines.push("--- RPG stats ---")
    finalLines.push(`HP: ${rpgData.hp}/${rpgData.maxHp}`)
    finalLines.push(`Gold: ${rpgData.gold}`)
    finalLines.push(`Inventory: ${rpgData.inventory.length>0?rpgData.inventory.join(", "):"Empty"}`)
    finalLines.push(`Equipped: ${rpgData.equipped.length>0?rpgData.equipped.join(", "):"Empty"}`)
    // retun overall result
    return finalLines.join("\n")
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
    console.log("Modified Request:",modifiedRequest)
    // Forward to OpenRouter
    const data = await callOpenRouter(modifiedRequest)

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
    res.status(500).json({ error: {
        "message": String(error),
        "code": 500,
        "metadata": {
            "raw": String(error),
            "provider_name": "Chutes"
        }
    }, code: 500 });
  }
};