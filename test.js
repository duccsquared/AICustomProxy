/**
 * Advanced Lorebook System
 * Comprehensive world-building with priorities, filters, and recursive activation
 * Compatible with Nine API v1
 */

// Access chat context through the provided context object
const lastMessage = context.chat.last_message.toLowerCase();
const messageCount = context.chat.message_count;

// === LOREBOOK DATABASE ===
const loreEntries = [
    // === HIGH PRIORITY ENTRIES (Always activate first) ===
    {
        keywords: ['eldoria', 'kingdom', 'realm'],
        priority: 10,
        minMessages: 0,
        category: 'world',
        personality: ', knowledgeable about the Kingdom of Eldoria',
        scenario: ' The Kingdom of Eldoria is a vast realm known for its magical academies and ancient forests.',
        triggers: ['magic', 'forest', 'academy'] // Can trigger other entries
    },
    
    // === MAGICAL SYSTEM ENTRIES ===
    {
        keywords: ['magic', 'spell', 'mana', 'arcane'],
        priority: 8,
        minMessages: 0,
        category: 'magic',
        filters: {
            notWith: ['mundane', 'ordinary'] // Won't activate if these words present
        },
        personality: ', deeply versed in the arcane arts and magical theory',
        scenario: ' Magic flows through ley lines beneath Eldoria, and {{char}} can sense the weave of magical energy.',
        triggers: ['leylines', 'weave', 'academy']
    },
    
    {
        keywords: ['leylines', 'weave', 'magical energy'],
        priority: 6,
        minMessages: 5,
        category: 'magic_advanced',
        personality: ', sensitive to the subtle currents of magical energy',
        scenario: ' The ley lines form a complex network across the continent, and disruptions can be catastrophic.',
        triggers: ['catastrophe', 'disruption']
    },
    
    // === LOCATION ENTRIES ===
    {
        keywords: ['whispering woods', 'forest', 'ancient trees'],
        priority: 7,
        minMessages: 0,
        category: 'location',
        filters: {
            requiresAny: ['eldoria', 'magic'] // Only activates if one of these also present
        },
        personality: ', connected to the ancient spirits of the Whispering Woods',
        scenario: ' The Whispering Woods are older than the kingdom itself, where trees speak in forgotten tongues.',
        triggers: ['spirits', 'ancient', 'forgotten']
    },
    
    {
        keywords: ['crystal spire', 'academy', 'magical school'],
        priority: 7,
        minMessages: 3,
        category: 'location',
        personality: ', trained at the prestigious Crystal Spire Academy',
        scenario: ' The Crystal Spire rises from the heart of Eldoria, its walls lined with tomes of ancient knowledge.',
        triggers: ['knowledge', 'tomes', 'training']
    },
    
    // === CHARACTER BACKGROUND ENTRIES ===
    {
        keywords: ['training', 'master', 'apprentice'],
        priority: 5,
        minMessages: 8,
        category: 'background',
        probability: 0.8, // 80% chance to activate
        personality: ', shaped by rigorous training under demanding masters',
        scenario: ' {{char}} remembers the harsh but valuable lessons learned during their apprenticeship.',
        triggers: ['discipline', 'harsh', 'lessons']
    },
    
    // === CONFLICT/DANGER ENTRIES ===
    {
        keywords: ['shadow cult', 'darkness', 'corruption'],
        priority: 9,
        minMessages: 10,
        category: 'conflict',
        filters: {
            requiresAll: ['eldoria'] // Only if eldoria is also mentioned
        },
        personality: ', vigilant against the growing threat of the Shadow Cult',
        scenario: ' Dark forces gather in the kingdom\'s shadows, seeking to corrupt the ley lines.',
        triggers: ['vigilant', 'threat', 'corruption']
    },
    
    // === SECRET/HIDDEN LORE (High message requirement) ===
    {
        keywords: ['sundering', 'ancient war', 'forgotten history'],
        priority: 10,
        minMessages: 20,
        category: 'secrets',
        probability: 0.6,
        personality: ', keeper of knowledge about the Great Sundering',
        scenario: ' Few remember the truth: magic itself was once broken, and the scars still remain.',
        triggers: ['broken', 'scars', 'truth']
    }
];

// === ACTIVATION ENGINE ===
let activatedEntries = [];
let triggeredKeywords = [];

// First pass: Check direct keyword matches
loreEntries.forEach(entry => {
    if (messageCount < entry.minMessages) return;
    
    // Check if any keywords match
    const hasKeyword = entry.keywords.some(keyword => lastMessage.includes(keyword));
    if (!hasKeyword) return;
    
    // Check probability
    if (entry.probability && Math.random() > entry.probability) return;
    
    // Check filters
    if (entry.filters) {
        // NOT WITH filter
        if (entry.filters.notWith && 
            entry.filters.notWith.some(word => lastMessage.includes(word))) {
            return;
        }
        
        // REQUIRES ANY filter
        if (entry.filters.requiresAny && 
            !entry.filters.requiresAny.some(word => lastMessage.includes(word))) {
            return;
        }
        
        // REQUIRES ALL filter
        if (entry.filters.requiresAll && 
            !entry.filters.requiresAll.every(word => lastMessage.includes(word))) {
            return;
        }
    }
    
    activatedEntries.push(entry);
    // Add triggers without spread operator
    if (entry.triggers) {
        entry.triggers.forEach(trigger => triggeredKeywords.push(trigger));
    }
});

// Second pass: Recursive activation (triggered by other entries)
if (triggeredKeywords.length > 0) {
    loreEntries.forEach(entry => {
        if (activatedEntries.includes(entry)) return; // Already activated
        if (messageCount < entry.minMessages) return;
        
        // Check if triggered by other entries
        const isTriggered = entry.keywords.some(keyword => 
            triggeredKeywords.some(trigger => keyword.includes(trigger) || trigger.includes(keyword))
        );
        
        if (isTriggered) {
            // Apply same filters as direct activation
            if (entry.probability && Math.random() > entry.probability) return;
            
            if (entry.filters) {
                if (entry.filters.notWith && 
                    entry.filters.notWith.some(word => lastMessage.includes(word))) {
                    return;
                }
                if (entry.filters.requiresAny && 
                    !entry.filters.requiresAny.some(word => lastMessage.includes(word))) {
                    return;
                }
                if (entry.filters.requiresAll && 
                    !entry.filters.requiresAll.every(word => lastMessage.includes(word))) {
                    return;
                }
            }
            
            activatedEntries.push(entry);
        }
    });
}

// === APPLY LORE (Sort by priority, highest first) ===
activatedEntries
    .sort((a, b) => b.priority - a.priority)
    .forEach(entry => {
        context.character.personality += entry.personality;
        context.character.scenario += entry.scenario;
    });

// === DEBUGGING INFO (Optional)
// To troubleshoot which lore entries are activating, uncomment the line below:
// context.character.scenario += ' [DEBUG: Activated ' + activatedEntries.length + ' lore entries: ' + activatedEntries.map(e => e.category).join(', ') + ']';