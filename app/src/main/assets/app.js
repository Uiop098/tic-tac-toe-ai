// Neo Tic-Tac-Toe App Controller
(function() {
    'use strict';

    // DOM Elements
    const board = document.getElementById('board');
    const status = document.getElementById('status');
    const resetBtn = document.getElementById('reset-btn');
    const resetStatsBtn = document.getElementById('resetStatsBtn');
    const winLine = document.getElementById('winLine');
    const appContainer = document.getElementById('app-container');
    const winRuleText = document.getElementById('winRuleText');
    const learnerBadge = document.getElementById('learnerBadge');

    // Selectors
    const gridBtns = document.querySelectorAll('.grid-btn');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const diffBtns = document.querySelectorAll('.diff-btn');
    const diffContainer = document.getElementById('diffContainer');

    // Chat Elements
    const chatDrawer = document.getElementById('chatDrawer');
    const toggleChatBtn = document.getElementById('toggleChatBtn');
    const chatHeader = document.getElementById('chatHeader');
    const minimizeChatBtn = document.getElementById('minimizeChatBtn');
    const chatChevron = document.getElementById('chatChevron');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const unreadBadge = document.getElementById('unreadBadge');
    const emojiBtns = document.querySelectorAll('.emoji-btn');
    const aiChatStatus = document.getElementById('aiChatStatus');

    // Audio Synthesizer
    let audioCtx = null;
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playSound(type) {
        try {
            initAudio();
            if (!audioCtx) return;
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'x') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.exponentialRampToValueAtTime(1040, now + 0.08);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'o') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.exponentialRampToValueAtTime(130, now + 0.12);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'win') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554.37, now + 0.08);
                osc.frequency.setValueAtTime(659.25, now + 0.16);
                osc.frequency.setValueAtTime(880, now + 0.24);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (type === 'loss') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(60, now + 0.35);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'draw') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.linearRampToValueAtTime(160, now + 0.25);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'chat') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.setValueAtTime(1320, now + 0.06);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            }
        } catch (e) {
            // Audio error safety
        }
    }

    // State Variables
    let gridSize = 3;
    let gameMode = 'ai'; // 'ai' or 'pvp'
    let difficulty = 'impossible'; // 'low', 'mid', 'hard', 'impossible'
    let gameState = [];
    let currentPlayer = 'X';
    let gameActive = true;
    let moveCount = 0;
    let scores = { X: 0, O: 0, Ties: 0 };
    let isChatMinimized = true;

    // Initialize UI
    initGame();
    updateLearnerBadge();

    // 1. Grid Size Selector
    gridBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gridBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gridSize = parseInt(btn.getAttribute('data-size'));
            updateWinRuleText();
            scores = { X: 0, O: 0, Ties: 0 };
            updateScoreBoard();
            initGame();
        });
    });

    // 2. Mode Selector (AI vs PvP)
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameMode = btn.getAttribute('data-mode');

            if (gameMode === 'pvp') {
                diffContainer.classList.add('opacity-40', 'pointer-events-none');
            } else {
                diffContainer.classList.remove('opacity-40', 'pointer-events-none');
            }

            scores = { X: 0, O: 0, Ties: 0 };
            updateScoreBoard();
            initGame();
        });
    });

    // 3. Difficulty Selector
    diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            diffBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            difficulty = btn.getAttribute('data-diff');
            initGame();
            addAiMessage(`Difficulty calibrated to ${difficulty.toUpperCase()}. Prepare yourself! ⚡`, 'chat');
        });
    });

    resetBtn.addEventListener('click', () => {
        initGame();
        playSound('chat');
    });

    resetStatsBtn.addEventListener('click', () => {
        if (confirm('Reset AI learned stats and player rating?')) {
            LearningEngine.resetStats();
            updateLearnerBadge();
            scores = { X: 0, O: 0, Ties: 0 };
            updateScoreBoard();
            addAiMessage('All neural weights reset. We start from scratch! 🧠', 'chat');
        }
    });

    function updateWinRuleText() {
        const winLen = GameLogic.getWinLength(gridSize);
        winRuleText.textContent = `${winLen}-in-a-row to win`;
    }

    function updateScoreBoard() {
        document.getElementById('scoreX').innerText = scores.X;
        document.getElementById('scoreO').innerText = scores.O;
        document.getElementById('scoreTies').innerText = scores.Ties;
    }

    function updateLearnerBadge() {
        const stats = LearningEngine.getStats();
        learnerBadge.textContent = `AI Learning: ${stats.playerStyle} (Elo: ${stats.skillRating})`;
    }

    function initGame() {
        gameState = GameLogic.createState(gridSize);
        currentPlayer = 'X';
        gameActive = true;
        moveCount = 0;
        winLine.style.display = 'none';
        winLine.style.width = '0px';

        status.innerHTML = `<span class="turn-badge x-turn"><i class="fa-solid fa-bolt text-xs"></i> X's Turn</span>`;

        // Generate Board DOM
        board.style.setProperty('--grid-size', gridSize);
        board.innerHTML = '';
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.setAttribute('data-index', i);
            cell.addEventListener('click', handleCellClick);
            board.appendChild(cell);
        }
    }

    function handleCellClick(e) {
        initAudio();
        const cell = e.target;
        const index = parseInt(cell.getAttribute('data-index'));

        if (gameState[index] !== '' || !gameActive) return;

        // Human Move
        moveCount++;
        if (currentPlayer === 'X') {
            LearningEngine.recordMove(gridSize, index, moveCount);
        }

        makeMove(index, currentPlayer);

        // AI Move Trigger
        if (gameActive && gameMode === 'ai' && currentPlayer === 'O') {
            gameActive = false; // Prevent clicks while AI computes
            aiChatStatus.textContent = 'Computing optimal move... ⚡';

            // Instant 0ms Bitboard Computation
            setTimeout(() => {
                const userWeights = LearningEngine.getTendencyWeights(gridSize);
                const aiMove = BitboardEngine.getBestMove(gameState, gridSize, difficulty, userWeights);

                if (aiMove !== -1 && gameState[aiMove] === '') {
                    gameActive = true;
                    moveCount++;
                    makeMove(aiMove, 'O');
                    aiChatStatus.textContent = 'Watching your every move...';

                    // Trigger contextual AI chat roast asynchronously
                    triggerAiBanterAfterMove(index, aiMove);
                } else {
                    gameActive = true;
                }
            }, 100);
        }
    }

    function makeMove(index, player) {
        gameState[index] = player;
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        if (cell) {
            cell.textContent = player;
            cell.classList.add(player.toLowerCase());
        }

        playSound(player.toLowerCase());
        checkWinOrDraw();

        if (gameActive) {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            const badgeClass = currentPlayer === 'X' ? 'x-turn' : 'o-turn';
            const icon = currentPlayer === 'X' ? 'fa-bolt' : 'fa-robot';
            status.innerHTML = `<span class="turn-badge ${badgeClass}"><i class="fa-solid ${icon} text-xs"></i> ${currentPlayer}'s Turn</span>`;
        }
    }

    function checkWinOrDraw() {
        const result = GameLogic.getWinner(gameState, gridSize);

        if (result) {
            gameActive = false;
            scores[currentPlayer]++;
            updateScoreBoard();
            drawWinLine(result.pattern);

            if (currentPlayer === 'X') {
                status.innerHTML = `<span class="turn-badge win-badge"><i class="fa-solid fa-trophy"></i> Player X Wins! 🏆</span>`;
                playSound('win');
                LearningEngine.recordGameEnd('win', gridSize, difficulty);
                updateLearnerBadge();

                if (window.confetti) {
                    confetti({
                        particleCount: 120,
                        spread: 80,
                        origin: { y: 0.6 },
                        colors: ['#00f0ff', '#8b5cf6', '#ffffff']
                    });
                }

                if (gameMode === 'ai') {
                    triggerOutcomeRoast('user_win', `Player won on ${gridSize}x${gridSize}`);
                }
            } else {
                status.innerHTML = `<span class="turn-badge o-turn"><i class="fa-solid fa-skull"></i> AI (O) Wins! 🤖</span>`;
                playSound('loss');
                LearningEngine.recordGameEnd('loss', gridSize, difficulty);
                updateLearnerBadge();

                appContainer.classList.add('shake');
                setTimeout(() => appContainer.classList.remove('shake'), 400);

                if (gameMode === 'ai') {
                    triggerOutcomeRoast('ai_win', `AI crushed human on ${gridSize}x${gridSize}`);
                }
            }
            return;
        }

        if (GameLogic.isFull(gameState)) {
            gameActive = false;
            scores.Ties++;
            updateScoreBoard();
            LearningEngine.recordGameEnd('draw', gridSize, difficulty);
            updateLearnerBadge();

            status.innerHTML = `<span class="turn-badge draw-badge"><i class="fa-solid fa-handshake"></i> It's a Draw! 🤝</span>`;
            playSound('draw');

            if (gameMode === 'ai') {
                triggerOutcomeRoast('draw', `Draw on ${gridSize}x${gridSize}`);
            }
            return;
        }
    }

    function drawWinLine(winPattern) {
        if (!winPattern || winPattern.length < 2) return;
        const startCell = document.querySelector(`.cell[data-index="${winPattern[0]}"]`);
        const endCell = document.querySelector(`.cell[data-index="${winPattern[winPattern.length - 1]}"]`);
        if (!startCell || !endCell) return;

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

    // Contextual Chat Triggers
    async function triggerAiBanterAfterMove(humanMove, aiMove) {
        if (moveCount === 2) {
            // First exchange
            const roast = ChatEngine.getLocalRoast('start');
            addAiMessage(roast);
            return;
        }

        // Random chance of banter during match
        if (Math.random() < 0.4) {
            const roast = await ChatEngine.getOnlineRoastOrFallback(
                `Human played slot ${humanMove}, AI responded at ${aiMove}`,
                'blunder'
            );
            addAiMessage(roast);
        }
    }

    async function triggerOutcomeRoast(category, context) {
        const roast = await ChatEngine.getOnlineRoastOrFallback(context, category);
        addAiMessage(roast, 'chat');
    }

    // Chat Drawer UI Management
    function toggleChat(forceOpen = null) {
        if (forceOpen !== null) {
            isChatMinimized = !forceOpen;
        } else {
            isChatMinimized = !isChatMinimized;
        }

        if (isChatMinimized) {
            chatDrawer.classList.add('minimized');
            chatChevron.className = 'fa-solid fa-chevron-up';
        } else {
            chatDrawer.classList.remove('minimized');
            chatChevron.className = 'fa-solid fa-chevron-down';
            unreadBadge.classList.add('hidden');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Start minimized on mobile
    toggleChat(false);

    toggleChatBtn.addEventListener('click', () => toggleChat());
    chatHeader.addEventListener('click', () => toggleChat());
    minimizeChatBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleChat();
    });

    function addAiMessage(text, sound = 'chat') {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble-ai p-2 self-start max-w-[85%]';
        bubble.textContent = text;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (isChatMinimized) {
            unreadBadge.classList.remove('hidden');
        }
        if (sound) playSound(sound);
    }

    function addUserMessage(text) {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble-user p-2 self-end max-w-[85%]';
        bubble.textContent = text;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        playSound('x');
    }

    function handleSendUserMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        addUserMessage(text);
        chatInput.value = '';

        // AI reply after short natural delay
        setTimeout(async () => {
            const reply = await ChatEngine.getOnlineRoastOrFallback(
                `Human said in chat: "${text}"`,
                'blunder'
            );
            addAiMessage(reply);
        }, 500);
    }

    sendChatBtn.addEventListener('click', handleSendUserMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendUserMessage();
    });

    emojiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const emoji = btn.getAttribute('data-emoji');
            addUserMessage(emoji);
            setTimeout(() => {
                const reply = ChatEngine.getEmojiReactionReply(emoji);
                addAiMessage(reply);
            }, 400);
        });
    });

})();
