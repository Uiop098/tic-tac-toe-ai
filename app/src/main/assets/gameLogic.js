(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.GameLogic = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    function createState() {
        return Array(9).fill('');
    }

    function isFull(state) {
        return state.every(function (cell) { return cell !== ''; });
    }

    function getWinner(state) {
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (state[a] && state[a] === state[b] && state[a] === state[c]) {
                return { winner: state[a], pattern: winningConditions[i] };
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
        winningConditions,
        createState,
        isFull,
        getWinner,
        getAvailableMoves,
        randomMove,
        isValidMove
    };
}));