# ⚡ Neo Tic-Tac-Toe: Cyberpunk AI Edition

A high-performance, multi-grid **Tic-Tac-Toe & Gomoku** hybrid wrapped in an Android shell, featuring an ultra-fast **64-bit Binary Bitboard Engine**, background **Auto-Learning Profile Tracker**, and an interactive **Trolling Mini-Chat AI Companion**.

---

## 🚀 Key Features

### 1. Multi-Grid Game Modes
- **3x3**: Classic 3-in-a-row Tic-Tac-Toe.
- **4x4**: Tactical 4-in-a-row challenge.
- **5x5**: 4-in-a-row Gomoku-style battle.
- **6x6**: Extended 4-in-a-row strategic board.
- Dynamic responsive grid with SVG/CSS dynamic winning strike lines.

### 2. Ultra-Fast Binary Bitboard AI Engine
- **Sub-millisecond decisions (<1ms)** using 64-bit `BigInt` bitmasks and bitwise operations.
- **Pre-moves Opening Matrix**: Instant 0ms responses on standard openings.
- **Alpha-Beta Pruning with Transposition Tables**: Deep tactical foresight without network lag.
- **4 Difficulty Levels**:
  - 🟢 **Low**: 70% random, 30% tactical (Beginner friendly).
  - 🔵 **Mid**: Positional heuristic evaluation with center/corner bias.
  - 🟠 **Hard**: 4-6 ply Minimax with Alpha-Beta pruning.
  - 🔴 **Impossible (God Mode)**: Perfect play, unbeatable on 3x3/4x4, elite tactical master on 5x5/6x6.

### 3. Background Auto-Learning System
- Tracks player habits, preferred opening moves, and frequent blunders.
- Adapts AI counter-strategies dynamically to challenge user tendencies.
- Calculates dynamic **Player Style** *(Center Strategist, Tactical Master, Aggressive Hunter)* and **Elo Skill Rating** saved locally to `localStorage`.

### 4. In-Game Mini Chat & Roast AI
- **Decoupled Architecture**: Move execution is instant and local; chat banter runs in the background.
- **Contextual Roasts**: AI reacts in real-time to blunders, fork threats, blocks, wins, and draws.
- **Multi-API Fast Dispatcher**: Connects to fast public AI endpoints with instant fallback to a local 150+ roast database.
- **Emoji Quick Reactions**: Send 😂, 💀, 🤡, 🔥, 🤫, 🤖 for live AI clapbacks.

### 5. Standalone High-Performance C++ Engine (`cpp/tic_tac_toe_engine.cpp`)
- Built with `uint64_t` bitboards, bitwise intrinsics, and alpha-beta minimax for native desktop/embedded performance.

---

## 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3 Glassmorphism, Tailwind CSS, FontAwesome.
- **Engines**: `bitboardEngine.js`, `learningEngine.js`, `chatEngine.js`, `gameLogic.js`.
- **Audio**: Web Audio API procedural sound synthesizer (sine, triangle, sawtooth).
- **Android Shell**: Android WebView with `DomStorage` and `WebViewAssetLoader`.

---

## 📦 Building & Testing

### Run JavaScript Unit Tests:
```bash
node test/gameLogic.test.js
node test/bitboardEngine.test.js
```

### Compile and Run C++ Engine:
```bash
g++ -O3 cpp/tic_tac_toe_engine.cpp -o cpp/engine_test
./cpp/engine_test
```

### GitHub Actions APK Build:
This repository automatically builds an Android APK on every push to `main`. Download `app-debug.apk` directly from the GitHub **Actions** tab!
