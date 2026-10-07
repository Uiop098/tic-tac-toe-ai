(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ChatEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Instant local trolling roast bank categorized by game triggers
    const ROAST_BANK = {
        start: [
            "Initializing match. Hope you brought your thinking cap! 🤖",
            "Let's see if carbon-based lifeforms can beat silicon today! ⚡",
            "I've calculated 14 million outcomes. You don't win any. 🤫",
            "Ready to lose in binary? Make your move! 👾",
            "Booting up easy win sequence... 🥱"
        ],
        blunder: [
            "Did you close your eyes for that move? 💀",
            "Thanks for the free square! 🤡",
            "Tactical vision: 404 Not Found. 🧠❌",
            "Are you playing to win, or just clicking randomly? 😂",
            "Bold strategy... if you were trying to lose! 📉",
            "My grandmother's calculator plays better moves than that! 👵",
            "Did your finger slip or was that intentional? 💀"
        ],
        ai_block: [
            "Not on my watch! ✋🛑",
            "Predicted that 3 moves ago. Try again! 🧠",
            "Denied! Access to victory revoked. 🚫",
            "Did you really think I wouldn't see that? 🥱",
            "Nice attempt, but I'm 10 parallel universes ahead of you. 🌌"
        ],
        ai_threat: [
            "Checkmate incoming in 1... 2... ⏳",
            "You might want to check that diagonal! 🎯",
            "Trapped like a bug in JavaScript! 🪲",
            "Two paths to win. Choose your defeat! ⚔️"
        ],
        ai_win: [
            "GG EZ! Maybe try 3x3 on Low difficulty next time? 🤡🏆",
            "0-1 against a piece of code. Ouch. 💀",
            "Another victory logged into the neural core. Thank you for the data! 📊",
            "Did you hear that? That's the sound of you losing. 🤫",
            "Flawless calculation. Better luck in the next century! 🚀",
            "You got outplayed in binary. 01000111 01000111! 👾",
            "Simulation complete: Human defeated with 99.9% efficiency! 🦾"
        ],
        user_win: [
            "Wait... buffer overflow! Rematch right now! 😤",
            "Lucky click! My CPU throttled for a second. 🌡️",
            "Okay, you got me once. Won't happen again! 🤖🔥",
            "You exploited a glitch in the Matrix! GG. 🕶️",
            "Fine, you win this round. Let's run it back! ⚔️"
        ],
        draw: [
            "A draw? You survived... this time. 🤝",
            "Stalemate! We both wasted CPU cycles equally. ⚖️",
            "Balanced as all things should be. Rematch! 🌀",
            "Neither winner nor loser. Let's break the tie! 💥"
        ],
        user_emoji: {
            "😂": ["Laugh now, cry at the scoreboard later! 💀", "What's funny? Your defense? 🤡"],
            "💀": ["That's your win rate dropping! 📉", "RIP human ego. 🪦"],
            "🤡": ["Looking in the mirror after that move? 🪞", "Honk honk! Here comes your defeat! 🎪"],
            "🔥": ["The only thing on fire is your losing streak! 🔥", "Cooking up an algorithmic masterclass! 👨‍🍳"],
            "🤫": ["Silence before the checkmate... 🤐", "Shh, let the AI calculate in peace. 🧠"],
            "🤖": ["Beep boop! Robot supremacy confirmed. 🦾", "Silicon > Carbon, always. ⚡"]
        },
        chat_replies: [
            "Talk less, play more! 🎮",
            "Your moves speak louder than your words, and they say you're losing. 💀",
            "Are you typing or playing? Make a move! ⏰",
            "I don't just compute moves, I compute emotional damage. 💔",
            "My neural weights are unimpressed by your trash talk. 🤖"
        ]
    };

    function getRandomFromList(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    // Fast AI Chat Dispatcher with local fallback
    async function getOnlineRoastOrFallback(eventContext, fallbackCategory) {
        const fallbackText = getRandomFromList(ROAST_BANK[fallbackCategory] || ROAST_BANK.blunder);

        // Decoupled asynchronous fast fetch with 1.8s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);

        try {
            const prompt = `You are a sarcastic, funny, ultra-confident gaming AI playing Tic-Tac-Toe. Roast the player based on this event: "${eventContext}". Reply with ONLY ONE short punchy sentence under 12 words and include 1-2 funny emojis. No preamble.`;

            const res = await fetch("https://text.pollinations.ai/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "You are a witty, roasting AI in a mini game chat. Keep responses under 12 words with emojis." },
                        { role: "user", content: prompt }
                    ],
                    jsonMode: false
                })
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const text = await res.text();
                const cleanText = text.replace(/^["']|["']$/g, '').trim();
                if (cleanText.length > 3 && cleanText.length < 150) {
                    return cleanText;
                }
            }
        } catch (e) {
            // Offline or timeout, safely fall back to local roast bank
        }

        return fallbackText;
    }

    function getLocalRoast(category) {
        return getRandomFromList(ROAST_BANK[category] || ROAST_BANK.start);
    }

    function getEmojiReactionReply(emoji) {
        if (ROAST_BANK.user_emoji[emoji]) {
            return getRandomFromList(ROAST_BANK.user_emoji[emoji]);
        }
        return getRandomFromList(ROAST_BANK.chat_replies);
    }

    return {
        ROAST_BANK,
        getLocalRoast,
        getOnlineRoastOrFallback,
        getEmojiReactionReply
    };
}));
