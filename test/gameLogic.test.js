'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const GameLogic = require('../app/src/main/assets/gameLogic.js');

test('createState returns a board of 9 empty cells', () => {
    const state = GameLogic.createState();
    assert.equal(state.length, 9);
    assert.ok(state.every(cell => cell === ''));
});

test('getWinner returns null on an empty board', () => {
    assert.equal(GameLogic.getWinner(GameLogic.createState()), null);
});

test('getWinner detects a row win for X', () => {
    const state = ['X', 'X', 'X', '', 'O', '', '', 'O', ''];
    const result = GameLogic.getWinner(state);
    assert.deepEqual(result, { winner: 'X', pattern: [0, 1, 2] });
});

test('getWinner detects a column win for O', () => {
    const state = ['O', 'X', '', 'O', 'X', '', 'O', '', ''];
    const result = GameLogic.getWinner(state);
    assert.deepEqual(result, { winner: 'O', pattern: [0, 3, 6] });
});

test('getWinner detects a diagonal win', () => {
    const state = ['X', 'O', '', '', 'X', 'O', '', '', 'X'];
    const result = GameLogic.getWinner(state);
    assert.deepEqual(result, { winner: 'X', pattern: [0, 4, 8] });
});

test('isFull returns true only when no empty cells remain', () => {
    assert.equal(GameLogic.isFull(['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O']), true);
    assert.equal(GameLogic.isFull(['X', 'O', '', 'O', 'X', 'O', 'O', 'X', 'O']), false);
});

test('getAvailableMoves lists only empty cells', () => {
    const state = ['X', '', 'O', '', 'X', '', '', '', 'O'];
    assert.deepEqual(GameLogic.getAvailableMoves(state), [1, 3, 5, 6, 7]);
});

test('randomMove returns a valid empty index', () => {
    const state = GameLogic.createState();
    for (let i = 0; i < 50; i++) {
        const move = GameLogic.randomMove(state);
        assert.ok(move >= 0 && move <= 8);
    }
});

test('randomMove returns -1 when the board is full', () => {
    const full = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
    assert.equal(GameLogic.randomMove(full), -1);
});

test('isValidMove validates bounds and occupancy', () => {
    const state = ['X', '', 'O', '', '', '', '', '', ''];
    assert.equal(GameLogic.isValidMove(state, 0), false);
    assert.equal(GameLogic.isValidMove(state, 2), false);
    assert.equal(GameLogic.isValidMove(state, 1), true);
    assert.equal(GameLogic.isValidMove(state, -1), false);
    assert.equal(GameLogic.isValidMove(state, 9), false);
});