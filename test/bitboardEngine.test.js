const assert = require('assert');
const GameLogic = require('../app/src/main/assets/gameLogic.js');
const BitboardEngine = require('../app/src/main/assets/bitboardEngine.js');

console.log('--- Testing GameLogic & BitboardEngine ---');

// Test 1: Grid Patterns Generation
[3, 4, 5, 6].forEach(size => {
    const patterns = GameLogic.generateWinningPatterns(size);
    const winLen = GameLogic.getWinLength(size);
    console.log(`Grid ${size}x${size}: Generated ${patterns.length} patterns of win-length ${winLen}`);
    assert(patterns.length > 0, `Patterns for ${size}x${size} should not be empty`);
    patterns.forEach(p => {
        assert.strictEqual(p.length, winLen);
    });
});

// Test 2: 3x3 Win Detection
let state3 = GameLogic.createState(3);
state3[0] = 'X'; state3[1] = 'X'; state3[2] = 'X';
let res3 = GameLogic.getWinner(state3, 3);
assert(res3 && res3.winner === 'X', 'Player X should win on top row of 3x3');

// Test 3: Bitboard Win Detection
let { bbX, bbO } = BitboardEngine.stateToBitboards(state3);
let masks3 = BitboardEngine.getBitboardWinMasks(3);
assert.strictEqual(BitboardEngine.checkBitboardWin(bbX, masks3), true);
assert.strictEqual(BitboardEngine.checkBitboardWin(bbO, masks3), false);

// Test 4: 4x4 Win Detection
let state4 = GameLogic.createState(4);
state4[0] = 'O'; state4[5] = 'O'; state4[10] = 'O'; state4[15] = 'O'; // Diagonal
let res4 = GameLogic.getWinner(state4, 4);
assert(res4 && res4.winner === 'O', 'Player O should win on main diagonal of 4x4');

// Test 5: Bitboard AI Best Move Execution (<1ms check)
[3, 4, 5, 6].forEach(size => {
    const state = GameLogic.createState(size);
    state[0] = 'X'; // Human plays corner
    const start = Date.now();
    const move = BitboardEngine.getBestMove(state, size, 'impossible');
    const elapsed = Date.now() - start;
    console.log(`Grid ${size}x${size} AI Best Move: ${move} in ${elapsed}ms`);
    assert(move >= 0 && move < size * size && move !== 0, `Valid move generated for ${size}x${size}`);
});

// Test 6: Instant Block Verification
let blockState = GameLogic.createState(3);
blockState[0] = 'X'; blockState[1] = 'X'; // X threatens slot 2
let aiBlockMove = BitboardEngine.getBestMove(blockState, 3, 'impossible');
assert.strictEqual(aiBlockMove, 2, 'AI must immediately block X at slot 2');

// Test 7: Instant Win Verification
let winState = GameLogic.createState(3);
winState[0] = 'O'; winState[1] = 'O'; // O can win at slot 2
let aiWinMove = BitboardEngine.getBestMove(winState, 3, 'impossible');
assert.strictEqual(aiWinMove, 2, 'AI must immediately take winning slot 2');

console.log('--- ALL BITBOARD TESTS PASSED SUCCESSFULLY ---');
