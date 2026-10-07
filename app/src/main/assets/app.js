// Neo Tic-Tac-Toe App Controller
(function() {
    'use strict';

    // Screens
    const lobbyScreen = document.getElementById('lobbyScreen');
    const gameScreen = document.getElementById('gameScreen');

    // Lobby Elements
    const oppAiCard = document.getElementById('oppAiCard');
    const oppPvpCard = document.getElementById('oppPvpCard');
    const lobbyDiffSection = document.getElementById('lobbyDiffSection');
    const diffCards = document.querySelectorAll('.diff-card');
    const gridBtns = document.querySelectorAll('.grid-btn');
    const lobbyWinRule = document.getElementById('lobbyWinRule');
    const enterGameBtn = document.getElementById('enterGameBtn');
    const lobbyLearnerBadge = document.getElementById('lobbyLearnerBadge');
    const lobbySkillRating = document.getElementById('lobbySkillRating');
    const statGames = document.getElementById('statGames');
    const statWins = document.getElementById('statWins');
    const statLosses = document.getElementById('statLosses');
    const statStreak = document.getElementById('statStreak');

    // Game Screen Elements
    const backToLobbyBtn = document.getElementById('backToLobbyBtn');
    const gameTabIcon = document.getElementById('gameTabIcon');
    const gameTabTitle = document.getElementById('gameTabTitle');
    const scoreOLabel = document.getElementById('scoreOLabel');
    const board = document.getElementById('board');
    const status = document.getElementById('status');
    const resetBtn = document.getElementById('reset-btn');
    const resetStatsBtn = document.getElementById('resetStatsBtn');
    const winLine = document.getElementById('winLine');
    const appContainer = document.getElementById('app-container');

    // Top In-App Toast Elements
    const topToast = document.getElementById('topToast');
    const toastContent = document.getElementById('toastContent');
    const toastMessage = document.getElementById('toastMessage');
    const closeToastBtn = document.getElementById('closeToastBtn');
    let toastTimeout = null;

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
            } else if (type === 'chat' || type === 'toast') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.setValueAtTime(1320, now + 0.06);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            }
        } catch (e) {
            // Audio safety
        }
    }

    // State Variables
    let selectedOpponent = 'ai'; // 'ai' or 'pvp'
    let selectedDifficulty = 'impossible'; // 'low', 'mid', 'hard', 'impossible'
    let selectedGridSize = 3;

    let gameState = [];
    let currentPlayer = 'X';
    let gameActive = true;
    let moveCount = 0;
    let scores = { X: 0, O: 0, Ties: 0 };
    let isChatMinimized = true;

    // Initialize Lobby
    updateLobbyStats();

    // 1. Opponent Selection
    oppAiCard.addEventListener('click', () => {
        oppAiCard.classList.add('active');
        oppPvpCard.classList.remove('active');
        selectedOpponent = 'ai';
        lobbyDiffSection.classList.remove('hidden');
    });

    oppPvpCard.addEventListener('click', () => {
        oppPvpCard.classList.add('active');
        oppAiCard.classList.remove('active');
        selectedOpponent = 'pvp';
        lobbyDiffSection.classList.add('hidden');
    });

    // 2. Difficulty Selection
    diffCards.forEach(card => {
        card.addEventListener('click', () => {
            diffCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedDifficulty = card.getAttribute('data-diff');
        });
    });

    // 3. Grid Dimension Selection
    gridBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gridBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedGridSize = parseInt(btn.getAttribute('data-size'));
            const winLen = GameLogic.getWinLength(selectedGridSize);
            lobbyWinRule.textContent = `${winLen}-in-a-row to win`;
        });
    });

    // Enter Game Screen
    enterGameBtn.addEventListener('click', () => {
        initAudio();
        playSound('chat');
        launchGame();
    });

    // Back to Lobby
    backToLobbyBtn.addEventListener('click', () => {
        gameScreen.classList.add('hidden');
        lobbyScreen.classList.remove('hidden');
        hideTopToast();
        updateLobbyStats();
    });

    function updateLobbyStats() {
        const stats = LearningEngine.getStats();
        lobbyLearnerBadge.textContent = `AI Learning: ${stats.playerStyle}`;
        lobbySkillRating.textContent = `Elo: ${stats.skillRating}`;
        statGames.textContent = stats.totalGames;
        statWins.textContent = stats.wins;
        statLosses.textContent = stats.losses;
        statStreak.textContent = stats.winStreak;
    }

    function launchGame() {
        lobbyScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        // Update Top Navigation Tab Info
        if (selectedOpponent === 'ai') {
            gameTabIcon.innerHTML = `<i class="fa-solid fa-robot text-fuchsia-400"></i>`;
            const diffName = selectedDifficulty === 'impossible' ? 'God AI' : `${selectedDifficulty.toUpperCase()} AI`;
            gameTabTitle.textContent = `${selectedGridSize}x${selectedGridSize} vs ${diffName}`;
            scoreOLabel.innerHTML = `<i class="fa-regular fa-circle"></i> AI (O)`;
        } else {
            gameTabIcon.innerHTML = `<i class="fa-solid fa-user-group text-cyan-400"></i>`;
            gameTabTitle.textContent = `${selectedGridSize}x${selectedGridSize} PvP Match`;
            scoreOLabel.innerHTML = `<i class="fa-regular fa-circle"></i> Player (O)`;
        }

        scores = { X: 0, O: 0, Ties: 0 };
        updateScoreBoard();
        initGameBoard();

        // Initial AI Taunt if AI mode
        if (selectedOpponent === 'ai') {
            const startRoast = ChatEngine.getLocalRoast('start');
            addAiMessage(startRoast, false);
            showTopToast(startRoast);
        }
    }

    function initGameBoard() {
        gameState = GameLogic.createState(selectedGridSize);
        currentPlayer = 'X';
        gameActive = true;
        moveCount = 0;
        winLine.style.display = 'none';
        winLine.style.width = '0px';

        status.innerHTML = `<span class="turn-badge x-turn"><i class="fa-solid fa-bolt text-xs"></i> X's Turn</span>`;

        // Generate Board DOM
        board.style.setProperty('--grid-size', selectedGridSize);
        board.innerHTML = '';
        for (let i = 0; i < selectedGridSize * selectedGridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.setAttribute('data-index', i);
            cell.addEventListener('click', handleCellClick);
            board.appendChild(cell);
        }
    }

    function updateScoreBoard() {
        document.getElementById('scoreX').innerText = scores.X;
        document.getElementById('scoreO').innerText = scores.O;
        document.getElementById('scoreTies').innerText = scores.Ties;
    }

    function handleCellClick(e) {
        initAudio();
        const cell = e.target;
        const index = parseInt(cell.getAttribute('data-index'));

        if (gameState[index] !== '' || !gameActive) return;

        // Human Move
        moveCount++;
        if (currentPlayer === 'X') {
            LearningEngine.recordMove(selectedGridSize, index, moveCount);
        }

        makeMove(index, currentPlayer);

        // AI Move Trigger
        if (gameActive && selectedOpponent === 'ai' && currentPlayer === 'O') {
            gameActive = false; // Prevent double taps during compute
            aiChatStatus.textContent = 'Computing optimal move... ⚡';

            // Instant 0ms Bitboard Computation
            setTimeout(() => {
                const userWeights = LearningEngine.getTendencyWeights(selectedGridSize);
                const aiMove = BitboardEngine.getBestMove(gameState, selectedGridSize, selectedDifficulty, userWeights);

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
            }, 80);
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
            const icon = currentPlayer === 'X' ? 'fa-bolt' : (selectedOpponent === 'ai' ? 'fa-robot' : 'fa-circle-user');
            status.innerHTML = `<span class="turn-badge ${badgeClass}"><i class="fa-solid ${icon} text-xs"></i> ${currentPlayer}'s Turn</span>`;
        }
    }

    function checkWinOrDraw() {
        const result = GameLogic.getWinner(gameState, selectedGridSize);

        if (result) {
            gameActive = false;
            scores[currentPlayer]++;
            updateScoreBoard();
            drawWinLine(result.pattern);

            if (currentPlayer === 'X') {
                status.innerHTML = `<span class="turn-badge win-badge"><i class="fa-solid fa-trophy"></i> Player X Wins! 🏆</span>`;
                playSound('win');
                LearningEngine.recordGameEnd('win', selectedGridSize, selectedDifficulty);

                if (window.confetti) {
                    confetti({
                        particleCount: 120,
                        spread: 80,
                        origin: { y: 0.6 },
                        colors: ['#00f0ff', '#8b5cf6', '#ffffff']
                    });
                }

                if (selectedOpponent === 'ai') {
                    triggerOutcomeRoast('user_win', `Player won on ${selectedGridSize}x${selectedGridSize}`);
                }
            } else {
                const winnerLabel = selectedOpponent === 'ai' ? 'AI (O) Wins! 🤖' : 'Player O Wins! 🎉';
                status.innerHTML = `<span class="turn-badge o-turn"><i class="fa-solid fa-skull"></i> ${winnerLabel}</span>`;
                playSound('loss');
                LearningEngine.recordGameEnd('loss', selectedGridSize, selectedDifficulty);

                appContainer.classList.add('shake');
                setTimeout(() => appContainer.classList.remove('shake'), 400);

                if (selectedOpponent === 'ai') {
                    triggerOutcomeRoast('ai_win', `AI crushed human on ${selectedGridSize}x${selectedGridSize}`);
                }
            }
            return;
        }

        if (GameLogic.isFull(gameState)) {
            gameActive = false;
            scores.Ties++;
            updateScoreBoard();
            LearningEngine.recordGameEnd('draw', selectedGridSize, selectedDifficulty);

            status.innerHTML = `<span class="turn-badge draw-badge"><i class="fa-solid fa-handshake"></i> It's a Draw! 🤝</span>`;
            playSound('draw');

            if (selectedOpponent === 'ai') {
                triggerOutcomeRoast('draw', `Draw on ${selectedGridSize}x${selectedGridSize}`);
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

    // Contextual Chat & Toast Roasts
    async function triggerAiBanterAfterMove(humanMove, aiMove) {
        if (moveCount === 2) {
            const roast = ChatEngine.getLocalRoast('start');
            addAiMessage(roast);
            showTopToast(roast);
            return;
        }

        // Random chance of banter during match
        if (Math.random() < 0.45) {
            const roast = await ChatEngine.getOnlineRoastOrFallback(
                `Human played slot ${humanMove}, AI responded at ${aiMove}`,
                'blunder'
            );
            addAiMessage(roast);
            showTopToast(roast);
        }
    }

    async function triggerOutcomeRoast(category, context) {
        const roast = await ChatEngine.getOnlineRoastOrFallback(context, category);
        addAiMessage(roast, 'chat');
        showTopToast(roast);
    }

    // Top In-App Notification Toast Functions
    function showTopToast(message) {
        if (!message) return;
        toastMessage.textContent = message;
        topToast.classList.add('show');
        playSound('toast');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            hideTopToast();
        }, 4500);
    }

    function hideTopToast() {
        topToast.classList.remove('show');
        if (toastTimeout) {
            clearTimeout(toastTimeout);
            toastTimeout = null;
        }
    }

    // Toast click opens chat drawer to reply!
    toastContent.addEventListener('click', () => {
        hideTopToast();
        toggleChat(true);
        setTimeout(() => chatInput.focus(), 250);
    });

    closeToastBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideTopToast();
    });

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
            showTopToast(reply);
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
                showTopToast(reply);
            }, 400);
        });
    });

    resetBtn.addEventListener('click', () => {
        initGameBoard();
        playSound('chat');
    });

    resetStatsBtn.addEventListener('click', () => {
        if (confirm('Reset AI learned stats and player rating?')) {
            LearningEngine.resetStats();
            scores = { X: 0, O: 0, Ties: 0 };
            updateScoreBoard();
            addAiMessage('All neural weights reset. We start from scratch! 🧠', 'chat');
            showTopToast('Neural weights reset! 🧠');
        }
    });

})();
