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

const callOpenRouterMock2 = async (request) => {
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
                    "content": "[Modified Reply] The ancient oak door groaned on its rusted hinges as Anna's cautious prodding revealed its fragility. The ruins around her - moss-covered stones etched with long-forgotten runes - held an eerie stillness broken only by the distant drip of water in shadowed corners. A faint violet glow pulsed intermittently from the cracks in the stonework, suggesting either magical residue... or something far more dangerous stirring beneath her feet. \n\nThe air smelled of wet earth and something metallic, the scent growing stronger as her fingers traced the arcane symbols bordering the doorframe. Whatever lay beyond hadn't been disturbed in centuries, perhaps longer. A scuttling noise from the darkened corridor behind her reminded Anna that while the entrance had been surprisingly unguarded until now, the deeper reaches of these ruins likely held more than just forgotten treasures.\n\n/RPG SET_MAX_HP 100\n/RPG SET_HP 100\n/RPG SET_GOLD 50\n/RPG ADD_ITEM Arcane Focus 1\n/RPG ADD_ITEM Health Potion 2\n/RPG ADD_ITEM Rope 1\n/RPG ADD_ITEM Flare Stone 3\n/RPG ADD_EQUIPPED Mage Robe\n/RPG ADD_EQUIPPED Travel Boots",
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

export {callOpenRouterMock, callOpenRouterMock2}