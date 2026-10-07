(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./gameLogic.js'));
    } else {
        root.BitboardEngine = factory(root.GameLogic);
    }
}(typeof self !== 'undefined' ? self : this, function (GameLogic) {
    'use strict';

    // Cache of 64-bit BigInt win masks per board size
    const winMasksCache = {};

    function getBitboardWinMasks(size) {
        if (winMasksCache[size]) return winMasksCache[size];
        const patterns = GameLogic.generateWinningPatterns(size);
        const masks = patterns.map(p => {
            let mask = 0n;
            for (let i = 0; i < p.length; i++) {
                mask |= (1n << BigInt(p[i]));
            }
            return mask;
        });
        winMasksCache[size] = masks;
        return masks;
    }

    // Convert string array board to dual bitboards (bbX, bbO)
    function stateToBitboards(state) {
        let bbX = 0n;
        let bbO = 0n;
        for (let i = 0; i < state.length; i++) {
            if (state[i] === 'X') {
                bbX |= (1n << BigInt(i));
            } else if (state[i] === 'O') {
                bbO |= (1n << BigInt(i));
            }
        }
        return { bbX, bbO };
    }

    // Fast O(1) bitwise win test
    function checkBitboardWin(bitboard, winMasks) {
        for (let i = 0; i < winMasks.length; i++) {
            const mask = winMasks[i];
            if ((bitboard & mask) === mask) {
                return true;
            }
        }
        return false;
    }

    // Positional weight matrix generator (center & near-center values higher)
    function getPositionalWeights(size) {
        const weights = [];
        const center = (size - 1) / 2.0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const dist = Math.abs(r - center) + Math.abs(c - center);
                // Closer to center = higher priority
                const val = Math.max(1, Math.round((size * 1.5 - dist) * 4));
                weights.push(val);
            }
        }
        return weights;
    }

    // Opening book / precomputed high-value moves for instant 0ms pre-move execution
    const openingBooks = {
        3: {
            '': [4], // Center first
            'X4': [0, 2, 6, 8], // If X takes center, take corner
            'X0': [4], // If X takes corner, take center
            'X2': [4],
            'X6': [4],
            'X8': [4],
            'X1': [4],
            'X3': [4],
            'X5': [4],
            'X7': [4]
        },
        4: {
            '': [5, 6, 9, 10], // Central squares
            'X5': [10], 'X6': [9], 'X9': [6], 'X10': [5]
        },
        5: {
            '': [12], // Absolute center
            'X12': [6, 8, 16, 18]
        },
        6: {
            '': [14, 15, 20, 21]
        }
    };

    // Pre-move lookup
    function getPreMove(state, size) {
        const totalMoves = state.filter(c => c !== '').length;
        if (totalMoves <= 1) {
            const book = openingBooks[size];
            if (!book) return null;
            if (totalMoves === 0 && book['']) {
                const choices = book[''];
                return choices[Math.floor(Math.random() * choices.length)];
            }
            if (totalMoves === 1) {
                const xIdx = state.indexOf('X');
                if (xIdx !== -1 && book[`X${xIdx}`]) {
                    const choices = book[`X${xIdx}`];
                    return choices[Math.floor(Math.random() * choices.length)];
                }
            }
        }
        return null;
    }

    // Immediate win or block detector
    function findImmediateMove(bbPlayer, bbOpponent, winMasks, totalCells) {
        for (let i = 0; i < totalCells; i++) {
            const bit = (1n << BigInt(i));
            if (((bbPlayer | bbOpponent) & bit) === 0n) {
                if (checkBitboardWin(bbPlayer | bit, winMasks)) {
                    return i;
                }
            }
        }
        return -1;
    }

    // Heuristic board evaluation for larger boards (5x5, 6x6)
    function evaluateBoardPatterns(bbAI, bbHuman, size, winMasks, patterns) {
        let score = 0;
        const winLen = GameLogic.getWinLength(size);

        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            let countAI = 0;
            let countHuman = 0;

            for (let j = 0; j < pattern.length; j++) {
                const bit = 1n << BigInt(pattern[j]);
                if ((bbAI & bit) !== 0n) countAI++;
                if ((bbHuman & bit) !== 0n) countHuman++;
            }

            if (countAI > 0 && countHuman > 0) {
                // Line blocked by both, 0 threat
                continue;
            } else if (countAI > 0) {
                if (countAI === winLen) return 100000;
                if (countAI === winLen - 1) score += 500;
                else if (countAI === winLen - 2) score += 50;
                else score += countAI * 2;
            } else if (countHuman > 0) {
                if (countHuman === winLen) return -100000;
                if (countHuman === winLen - 1) score -= 600; // Human threat must be blocked aggressively
                else if (countHuman === winLen - 2) score -= 60;
                else score -= countHuman * 2;
            }
        }

        return score;
    }

    // Transposition Table
    const transpositionTable = new Map();

    // Minimax with Alpha-Beta pruning on Bitboards
    function minimax(bbAI, bbHuman, depth, alpha, beta, isMaximizing, size, winMasks, patterns, posWeights, maxDepth) {
        // 1. Terminal condition checks
        if (checkBitboardWin(bbAI, winMasks)) return 10000 + depth;
        if (checkBitboardWin(bbHuman, winMasks)) return -10000 - depth;

        const occupied = bbAI | bbHuman;
        const totalCells = size * size;
        const allMask = (1n << BigInt(totalCells)) - 1n;
        if (occupied === allMask) return 0; // Draw

        if (depth >= maxDepth) {
            return evaluateBoardPatterns(bbAI, bbHuman, size, winMasks, patterns);
        }

        // Transposition table key
        const ttKey = `${bbAI.toString(16)}_${bbHuman.toString(16)}_${isMaximizing ? 1 : 0}`;
        if (transpositionTable.has(ttKey)) {
            const cached = transpositionTable.get(ttKey);
            if (cached.depth >= (maxDepth - depth)) {
                return cached.score;
            }
        }

        // Candidate move generation with move ordering
        const candidateMoves = [];
        for (let i = 0; i < totalCells; i++) {
            const bit = 1n << BigInt(i);
            if ((occupied & bit) === 0n) {
                // Heuristic move score for ordering
                let weight = posWeights[i];
                candidateMoves.push({ idx: i, bit: bit, weight: weight });
            }
        }

        // Sort moves descending by priority for maximum alpha-beta cutoffs
        candidateMoves.sort((a, b) => b.weight - a.weight);

        // Limit branching factor on large boards (5x5, 6x6) to keep move generation < 1ms
        const maxBranches = size >= 5 ? 10 : candidateMoves.length;
        const selectedMoves = candidateMoves.slice(0, maxBranches);

        let bestScore = isMaximizing ? -Infinity : Infinity;

        for (let m = 0; m < selectedMoves.length; m++) {
            const move = selectedMoves[m];
            let score;
            if (isMaximizing) {
                score = minimax(bbAI | move.bit, bbHuman, depth + 1, alpha, beta, false, size, winMasks, patterns, posWeights, maxDepth);
                bestScore = Math.max(bestScore, score);
                alpha = Math.max(alpha, bestScore);
            } else {
                score = minimax(bbAI, bbHuman | move.bit, depth + 1, alpha, beta, true, size, winMasks, patterns, posWeights, maxDepth);
                bestScore = Math.min(bestScore, score);
                beta = Math.min(beta, bestScore);
            }

            if (beta <= alpha) break; // Alpha-beta cutoff
        }

        transpositionTable.set(ttKey, { score: bestScore, depth: maxDepth - depth });
        return bestScore;
    }

    // Main AI decision calculator
    function getBestMove(state, size, difficulty, userTendencyWeights) {
        const totalCells = size * size;
        const available = GameLogic.getAvailableMoves(state);
        if (available.length === 0) return -1;
        if (available.length === 1) return available[0];

        const winMasks = getBitboardWinMasks(size);
        const patterns = GameLogic.generateWinningPatterns(size);
        const posWeights = getPositionalWeights(size);
        const { bbX, bbO } = stateToBitboards(state);
        // AI plays as 'O', Human is 'X'
        const bbAI = bbO;
        const bbHuman = bbX;

        // Clean cache periodically
        if (transpositionTable.size > 20000) transpositionTable.clear();

        // 1. Instant Pre-Move Opening Book Check (0ms latency)
        if (difficulty === 'impossible' || difficulty === 'hard') {
            const preMove = getPreMove(state, size);
            if (preMove !== null && state[preMove] === '') {
                return preMove;
            }
        }

        // 2. DIFFICULTY: LOW (Beginner)
        // 70% random, 30% tactical block/win
        if (difficulty === 'low') {
            if (Math.random() < 0.35) {
                const winNow = findImmediateMove(bbAI, bbHuman, winMasks, totalCells);
                if (winNow !== -1) return winNow;
                const blockNow = findImmediateMove(bbHuman, bbAI, winMasks, totalCells);
                if (blockNow !== -1) return blockNow;
            }
            return available[Math.floor(Math.random() * available.length)];
        }

        // 3. DIFFICULTY: MID (Intermediate)
        // Immediate win -> Immediate block -> 2-ply evaluation with center bias
        if (difficulty === 'mid') {
            const winNow = findImmediateMove(bbAI, bbHuman, winMasks, totalCells);
            if (winNow !== -1) return winNow;
            const blockNow = findImmediateMove(bbHuman, bbAI, winMasks, totalCells);
            if (blockNow !== -1) return blockNow;

            // Pick move with best immediate positional weight + random spice
            let bestMove = available[0];
            let maxW = -1;
            for (let i = 0; i < available.length; i++) {
                const idx = available[i];
                let w = posWeights[idx] + Math.floor(Math.random() * 8);
                if (userTendencyWeights && userTendencyWeights[idx]) {
                    w += userTendencyWeights[idx] * 2;
                }
                if (w > maxW) {
                    maxW = w;
                    bestMove = idx;
                }
            }
            return bestMove;
        }

        // 4. DIFFICULTY: HARD (Advanced) & IMPOSSIBLE (Master)
        // Priority 1: Instant Winning Move (1-ply)
        const instantWin = findImmediateMove(bbAI, bbHuman, winMasks, totalCells);
        if (instantWin !== -1) return instantWin;

        // Priority 2: Instant Block Move (1-ply)
        const instantBlock = findImmediateMove(bbHuman, bbAI, winMasks, totalCells);
        if (instantBlock !== -1) return instantBlock;

        // Set search depth based on grid size & difficulty
        let searchDepth;
        if (size === 3) {
            searchDepth = difficulty === 'impossible' ? 9 : 5;
        } else if (size === 4) {
            searchDepth = difficulty === 'impossible' ? 5 : 3;
        } else if (size === 5) {
            searchDepth = difficulty === 'impossible' ? 4 : 2;
        } else {
            // 6x6
            searchDepth = difficulty === 'impossible' ? 3 : 2;
        }

        let bestMove = available[0];
        let maxScore = -Infinity;

        // Score all available moves
        for (let i = 0; i < available.length; i++) {
            const idx = available[i];
            const bit = 1n << BigInt(idx);

            let score = minimax(
                bbAI | bit, bbHuman, 0,
                -Infinity, Infinity,
                false, size, winMasks, patterns, posWeights, searchDepth
            );

            // Inject positional weight and learned user tendency biases
            score += (posWeights[idx] * 0.1);
            if (userTendencyWeights && userTendencyWeights[idx]) {
                score += (userTendencyWeights[idx] * 1.5);
            }

            if (score > maxScore) {
                maxScore = score;
                bestMove = idx;
            }
        }

        return bestMove;
    }

    return {
        getBitboardWinMasks,
        stateToBitboards,
        checkBitboardWin,
        getPositionalWeights,
        getPreMove,
        findImmediateMove,
        getBestMove
    };
}));
