
const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const aiLoading = document.getElementById('aiLoading');

let gameState = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let currentMode = 'pvp'; // pvp, easy-ai, real-ai

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// Switch Modes
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.getAttribute('data-mode');
        resetGame();
    });
});

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', resetGame);

function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));

    if (gameState[index] !== '' || !gameActive) return;

    makeMove(index, currentPlayer);

    if (gameActive && currentMode !== 'pvp' && currentPlayer === 'O') {
        fetchAiMove();
    }
}

function makeMove(index, player) {
    gameState[index] = player;
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
    
    checkWinOrDraw();
    
    if (gameActive) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        status.textContent = `Player ${currentPlayer}'s Turn`;
    }
}

function checkWinOrDraw() {
    let roundWon = false;
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        status.textContent = `Player ${currentPlayer} Wins!`;
        gameActive = false;
        return;
    }

    if (!gameState.includes('')) {
        status.textContent = 'Game Ended in a Draw!';
        gameActive = false;
        return;
    }
}

function resetGame() {
    gameState = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    status.textContent = `Player X's Turn`;
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });
    aiLoading.style.display = 'none';
}

async function fetchAiMove() {
    gameActive = false; // pause clicking
    aiLoading.style.display = 'flex';
    
    let moveIndex = -1;

    if (currentMode === 'easy-ai') {
        // Random available spot
        const available = gameState.map((val, i) => val === '' ? i : null).filter(val => val !== null);
        if(available.length > 0) {
            moveIndex = available[Math.floor(Math.random() * available.length)];
        }
        setTimeout(() => {
            aiLoading.style.display = 'none';
            gameActive = true;
            if(moveIndex !== -1) makeMove(moveIndex, 'O');
        }, 500);
        return;
    }

    if (currentMode === 'real-ai') {
        const boardMapping = gameState.map((v, i) => v === '' ? String(i) : v).join(',');
        const prompt = `You are playing Tic Tac Toe as 'O'. Board state (0-8 empty slots): [${boardMapping}]. Reply ONLY with a single digit (0-8) representing the empty slot you choose to win or block 'X'. Do not add any other text.`;
        
        try {
            const res = await fetch("https://text.pollinations.ai/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{role: "system", content: "Reply exclusively with a single number from the empty slots."}, {role: "user", content: prompt}],
                    jsonMode: false
                })
            });
            const textResponse = await res.text();
            
            // Extract the first number found
            const match = textResponse.match(/\d/);
            if (match) {
                const idx = parseInt(match[0]);
                if (gameState[idx] === '') {
                    moveIndex = idx;
                }
            }
        } catch (err) {
            console.error(err);
        }

        // Fallback to random if AI fails or picks invalid
        if (moveIndex === -1) {
            const available = gameState.map((val, i) => val === '' ? i : null).filter(val => val !== null);
            if(available.length > 0) moveIndex = available[Math.floor(Math.random() * available.length)];
        }
        
        aiLoading.style.display = 'none';
        gameActive = true;
        if(moveIndex !== -1) makeMove(moveIndex, 'O');
    }
}
