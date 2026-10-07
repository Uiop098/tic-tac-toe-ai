const assert = require('assert');
const GameLogic = require('../app/src/main/assets/gameLogic.js');
const BitboardEngine = require('../app/src/main/assets/bitboardEngine.js');
const LearningEngine = require('../app/src/main/assets/learningEngine.js');
const ChatEngine = require('../app/src/main/assets/chatEngine.js');

console.log('=== Comprehensive Tic-Tac-Toe AI Test Suite ===');

// 1. Grid Pattern & Win Rules
[3, 4, 5, 6].forEach(size => {
    const patterns = GameLogic.generateWinningPatterns(size);
    const winLen = GameLogic.getWinLength(size);
    console.log(`[PASS] Grid ${size}x${size}: Generated ${patterns.length} win patterns (Win length: ${winLen})`);
    assert(patterns.length > 0);
});

// 2. Win Detection across all directions
// 3x3 Horizontal
let s3h = GameLogic.createState(3);
s3h[3] = 'X'; s3h[4] = 'X'; s3h[5] = 'X';
assert.strictEqual(GameLogic.getWinner(s3h, 3).winner, 'X');

// 4x4 Vertical
let s4v = GameLogic.createState(4);
s4v[1] = 'O'; s4v[5] = 'O'; s4v[9] = 'O'; s4v[13] = 'O';
assert.strictEqual(GameLogic.getWinner(s4v, 4).winner, 'O');

// 5x5 Diagonal
let s5d = GameLogic.createState(5);
s5d[0] = 'X'; s5d[6] = 'X'; s5d[12] = 'X'; s5d[18] = 'X';
assert.strictEqual(GameLogic.getWinner(s5d, 5).winner, 'X');

// 6x6 Anti-Diagonal
let s6ad = GameLogic.createState(6);
s6ad[3] = 'O'; s6ad[8] = 'O'; s6ad[13] = 'O'; s6ad[18] = 'O';
assert.strictEqual(GameLogic.getWinner(s6ad, 6).winner, 'O');
console.log('[PASS] All multi-grid win detections passed.');

// 3. Bitboard Engine & Difficulty Verification
['low', 'mid', 'hard', 'impossible'].forEach(diff => {
    const state = GameLogic.createState(3);
    state[0] = 'X';
    const move = BitboardEngine.getBestMove(state, 3, diff);
    assert(move >= 0 && move < 9 && move !== 0, `Valid move for diff: ${diff}`);
    console.log(`[PASS] Difficulty '${diff}' computed valid move: ${move}`);
});

// 4. Learning Engine Verification
LearningEngine.resetStats();
LearningEngine.recordMove(3, 4, 1); // User played center on move 1
LearningEngine.recordMove(3, 0, 2);
LearningEngine.recordGameEnd('loss', 3, 'impossible');
const stats = LearningEngine.getStats();
assert.strictEqual(stats.totalGames, 1);
assert.strictEqual(stats.losses, 1);
const weights = LearningEngine.getTendencyWeights(3);
assert(weights[4] > 0, 'Learned weight for center move 4 should be positive');
console.log('[PASS] Auto-Learning Engine correctly logged player tendencies.');

// 5. Chat & Roast Engine Verification
const startRoast = ChatEngine.getLocalRoast('start');
assert(typeof startRoast === 'string' && startRoast.length > 0);
const emojiReply = ChatEngine.getEmojiReactionReply('😂');
assert(typeof emojiReply === 'string' && emojiReply.length > 0);
console.log('[PASS] Chat & Roast Engine delivers valid instant responses.');

console.log('=== ALL TESTS PASSED WITH 100% SUCCESS ===');
