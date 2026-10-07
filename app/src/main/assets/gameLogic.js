(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.GameLogic = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Winning streak length required per board size:
    // 3x3 -> 3
    // 4x4 -> 4
    // 5x5 -> 4
    // 6x6 -> 4
    function getWinLength(size) {
        if (size <= 3) return 3;
        return 4;
    }

    // Cache winning patterns per board size
    const patternsCache = {};

    function generateWinningPatterns(size, winLen) {
        winLen = winLen || getWinLength(size);
        const cacheKey = `${size}_${winLen}`;
        if (patternsCache[cacheKey]) return patternsCache[cacheKey];

        const patterns = [];

        // 1. Horizontal
        for (let r = 0; r < size; r++) {
            for (let c = 0; c <= size - winLen; c++) {
                const line = [];
                for (let k = 0; k < winLen; k++) {
                    line.push(r * size + (c + k));
                }
                patterns.push(line);
            }
        }

        // 2. Vertical
        for (let c = 0; c < size; c++) {
            for (let r = 0; r <= size - winLen; r++) {
                const line = [];
                for (let k = 0; k < winLen; k++) {
                    line.push((r + k) * size + c);
                }
                patterns.push(line);
            }
        }

        // 3. Diagonal (\)
        for (let r = 0; r <= size - winLen; r++) {
            for (let c = 0; c <= size - winLen; c++) {
                const line = [];
                for (let k = 0; k < winLen; k++) {
                    line.push((r + k) * size + (c + k));
                }
                patterns.push(line);
            }
        }

        // 4. Anti-Diagonal (/)
        for (let r = 0; r <= size - winLen; r++) {
            for (let c = winLen - 1; c < size; c++) {
                const line = [];
                for (let k = 0; k < winLen; k++) {
                    line.push((r + k) * size + (c - k));
                }
                patterns.push(line);
            }
        }

        patternsCache[cacheKey] = patterns;
        return patterns;
    }

    function createState(size = 3) {
        return Array(size * size).fill('');
    }

    function isFull(state) {
        return state.every(function (cell) { return cell !== ''; });
    }

    function getWinner(state, size = 3, winLen) {
        winLen = winLen || getWinLength(size);
        const patterns = generateWinningPatterns(size, winLen);

        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            const first = state[pattern[0]];
            if (!first) continue;

            let win = true;
            for (let j = 1; j < pattern.length; j++) {
                if (state[pattern[j]] !== first) {
                    win = false;
                    break;
                }
            }

            if (win) {
                return { winner: first, pattern: pattern };
            }
        }
        return null;
    }

    function getAvailableMoves(state) {
        const moves = [];
        for (let i = 0; i < state.length; i++) {
            if (state[i] === '') moves.push(i);
        }
        return moves;
    }

    function randomMove(state) {
        const moves = getAvailableMoves(state);
        if (moves.length === 0) return -1;
        return moves[Math.floor(Math.random() * moves.length)];
    }

    function isValidMove(state, index) {
        return index >= 0 && index < state.length && state[index] === '';
    }

    return {
        getWinLength,
        generateWinningPatterns,
        createState,
        isFull,
        getWinner,
        getAvailableMoves,
        randomMove,
        isValidMove
    };
}));
