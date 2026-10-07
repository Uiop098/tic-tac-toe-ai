(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.LearningEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const STORAGE_KEY = 'ttt_user_learning_profile_v2';

    const defaultProfile = {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winStreak: 0,
        maxWinStreak: 0,
        // Heatmap of player opening moves per grid size
        openings: {
            3: {},
            4: {},
            5: {},
            6: {}
        },
        // Frequency of player moves across board slots
        moveFrequency: {
            3: {},
            4: {},
            5: {},
            6: {}
        },
        // Common blunders (failed to block or missed win)
        blundersCount: 0,
        // Player style: "Aggressive", "Defensive", "Center-Focused", "Corner-Master", "Balanced"
        playerStyle: "Calibrating...",
        skillRating: 1000 // Elo-like rating
    };

    function loadProfile() {
        try {
            if (typeof localStorage !== 'undefined') {
                const data = localStorage.getItem(STORAGE_KEY);
                if (data) {
                    return Object.assign({}, defaultProfile, JSON.parse(data));
                }
            }
        } catch (e) {
            console.error('Failed to load learning profile:', e);
        }
        return JSON.parse(JSON.stringify(defaultProfile));
    }

    function saveProfile(profile) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
            }
        } catch (e) {
            console.error('Failed to save learning profile:', e);
        }
    }

    let profile = loadProfile();

    // Record human move
    function recordMove(gridSize, index, moveNumber) {
        gridSize = parseInt(gridSize);
        if (!profile.moveFrequency[gridSize]) {
            profile.moveFrequency[gridSize] = {};
        }
        profile.moveFrequency[gridSize][index] = (profile.moveFrequency[gridSize][index] || 0) + 1;

        if (moveNumber === 1) {
            if (!profile.openings[gridSize]) {
                profile.openings[gridSize] = {};
            }
            profile.openings[gridSize][index] = (profile.openings[gridSize][index] || 0) + 1;
        }

        saveProfile(profile);
    }

    // Record game outcome
    function recordGameEnd(result, gridSize, difficulty) {
        // result: 'win' (human win), 'loss' (human loss), 'draw'
        profile.totalGames++;
        if (result === 'win') {
            profile.wins++;
            profile.winStreak++;
            if (profile.winStreak > profile.maxWinStreak) {
                profile.maxWinStreak = profile.winStreak;
            }
            // Elo adjust
            const gain = difficulty === 'impossible' ? 40 : difficulty === 'hard' ? 25 : 15;
            profile.skillRating += gain;
        } else if (result === 'loss') {
            profile.losses++;
            profile.winStreak = 0;
            const loss = difficulty === 'low' ? 30 : difficulty === 'mid' ? 15 : 5;
            profile.skillRating = Math.max(500, profile.skillRating - loss);
        } else {
            profile.draws++;
        }

        classifyPlayerStyle(gridSize);
        saveProfile(profile);
    }

    function classifyPlayerStyle(gridSize) {
        const freq = profile.moveFrequency[gridSize] || {};
        const entries = Object.entries(freq);
        if (entries.length === 0) return;

        const centerIndex = Math.floor((gridSize * gridSize) / 2);
        const centerMoves = freq[centerIndex] || 0;

        let totalRecorded = 0;
        entries.forEach(([_, count]) => totalRecorded += count);

        if (totalRecorded < 5) {
            profile.playerStyle = "Analyzing Style...";
            return;
        }

        if (centerMoves / totalRecorded > 0.3) {
            profile.playerStyle = "Center Strategist 🎯";
        } else if (profile.winStreak >= 3) {
            profile.playerStyle = "Tactical Master 🧠";
        } else if (profile.wins > profile.losses) {
            profile.playerStyle = "Aggressive Hunter ⚔️";
        } else {
            profile.playerStyle = "Adapting Challenger 🛡️";
        }
    }

    // Get learned counter-weights to bias AI minimax
    function getTendencyWeights(gridSize) {
        const weights = {};
        const freq = profile.moveFrequency[gridSize] || {};
        const openings = profile.openings[gridSize] || {};

        // Heavily weight player's favorite spots so AI contests them
        Object.keys(freq).forEach(idx => {
            weights[idx] = (freq[idx] || 0) * 1.5;
        });

        Object.keys(openings).forEach(idx => {
            weights[idx] = (weights[idx] || 0) + (openings[idx] || 0) * 3;
        });

        return weights;
    }

    function getStats() {
        return {
            totalGames: profile.totalGames,
            wins: profile.wins,
            losses: profile.losses,
            draws: profile.draws,
            winStreak: profile.winStreak,
            skillRating: profile.skillRating,
            playerStyle: profile.playerStyle
        };
    }

    function resetStats() {
        profile = JSON.parse(JSON.stringify(defaultProfile));
        saveProfile(profile);
    }

    return {
        loadProfile,
        recordMove,
        recordGameEnd,
        getTendencyWeights,
        getStats,
        resetStats
    };
}));
