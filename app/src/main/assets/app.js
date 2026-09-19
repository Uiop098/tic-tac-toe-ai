const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const aiLoading = document.getElementById('aiLoading');
const winLine = document.getElementById('winLine');
const appContainer = document.getElementById('app-container');

// Audio Context for synthetic UI sounds
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'x') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'o') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    } else if (type === 'draw') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

let gameState = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let currentMode = 'pvp'; // pvp, easy-ai, real-ai

let scores = { X: 0, O: 0, Ties: 0 };

// Switch Modes
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.getAttribute('data-mode');
        // Reset scores on mode switch
        scores = { X: 0, O: 0, Ties: 0 };
        updateScoreBoard();
        resetGame();
    });
});

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', resetGame);

function updateScoreBoard() {
    document.getElementById('scoreX').innerText = scores.X;
    document.getElementById('scoreO').innerText = scores.O;
    document.getElementById('scoreTies').innerText = scores.Ties;
}

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
    
    playSound(player.toLowerCase());
    checkWinOrDraw();
    
    if (gameActive) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        status.innerHTML = `<span class="turn-badge ${currentPlayer.toLowerCase()}-turn">${currentPlayer}'s Turn</span>`;
    }
}

function drawWinLine(winPattern) {
    const startCell = cells[winPattern[0]];
    const endCell = cells[winPattern[2]];
    
    const startRect = startCell.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    const startX = startRect.left + startRect.width / 2 - boardRect.left;
    const startY = startRect.top + startRect.height / 2 - boardRect.top;
    const endX = endRect.left + endRect.width / 2 - boardRect.left;
    const endY = endRect.top + endRect.height / 2 - boardRect.top;

    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

    winLine.style.width = '0px';
    winLine.style.height = '6px';
    winLine.style.left = `${startX}px`;
    winLine.style.top = `${startY - 3}px`;
    winLine.style.transform = `rotate(${angle}deg)`;
    winLine.style.display = 'block';

    setTimeout(() => {
        winLine.style.width = `${length}px`;
    }, 50);
}

function checkWinOrDraw() {
    const result = GameLogic.getWinner(gameState);

    if (result) {
        status.innerHTML = `<span class="turn-badge win-badge">Player ${currentPlayer} Wins! 🏆</span>`;
        scores[currentPlayer]++;
        updateScoreBoard();
        gameActive = false;
        playSound('win');
        drawWinLine(result.pattern);
        
        // Confetti if human wins
        if(currentPlayer === 'X' || currentMode === 'pvp') {
            if(window.confetti) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: currentPlayer === 'X' ? ['#3b82f6', '#ffffff'] : ['#f43f5e', '#ffffff']
                });
            }
        } else {
            // Screen shake when AI wins!
            appContainer.classList.add('shake');
            setTimeout(() => appContainer.classList.remove('shake'), 300);
        }
        return;
    }

    if (GameLogic.isFull(gameState)) {
        status.innerHTML = `<span class="turn-badge draw-badge">It's a Draw! 🤝</span>`;
        scores.Ties++;
        updateScoreBoard();
        gameActive = false;
        playSound('draw');
        return;
    }
}

function resetGame() {
    gameState = GameLogic.createState();
    currentPlayer = 'X';
    gameActive = true;
    winLine.style.display = 'none';
    winLine.style.width = '0px';
    status.innerHTML = `<span class="turn-badge x-turn">X's Turn</span>`;
    
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });
    aiLoading.style.display = 'none';
}

async function fetchAiMove() {
    gameActive = false; 
    aiLoading.style.display = 'flex';
    
    let moveIndex = -1;

    if (currentMode === 'easy-ai') {
        moveIndex = GameLogic.randomMove(gameState);
        setTimeout(() => {
            aiLoading.style.display = 'none';
            gameActive = true;
            if(moveIndex !== -1) makeMove(moveIndex, 'O');
        }, 600);
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

        if (moveIndex === -1) {
            moveIndex = GameLogic.randomMove(gameState);
        }
        
        aiLoading.style.display = 'none';
        gameActive = true;
        if(moveIndex !== -1) makeMove(moveIndex, 'O');
    }
}
