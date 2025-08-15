// 游戏配置
const START_TILES = 2;
const WINNING_VALUE = 2048;

// 游戏状态
let grid;
let score;
let gameOver;
let gameMode; // 'campaign' 或 'endless'
let level;
let gridSize;
let startTime;
let timerInterval;
let hasWon;

// DOM元素
const modeSelection = document.getElementById('mode-selection');
const gameInterface = document.getElementById('game-interface');
const startGameButton = document.getElementById('start-game-button');
const backToModeButton = document.getElementById('back-to-mode-button');
const modeOptions = document.querySelectorAll('.mode-option');
const endlessDifficultySelect = document.getElementById('endless-difficulty-select');
// 音效元素 - 使用现有音效文件
const mergeSound = document.getElementById('merge-sound');
const winSound = document.getElementById('win-sound');

// 初始化事件监听
function initEventListeners() {
    // 模式选择点击事件
    modeOptions.forEach(option => {
        option.addEventListener('click', () => {
            // 移除所有选中状态
            modeOptions.forEach(opt => opt.classList.remove('selected'));
            // 添加选中状态
            option.classList.add('selected');
            // 设置游戏模式
            gameMode = option.dataset.mode;
        });
    });

    // 开始游戏按钮点击事件
    startGameButton.addEventListener('click', startGame);

    // 返回模式选择按钮点击事件
    backToModeButton.addEventListener('click', backToModeSelection);

    // 重新开始按钮点击事件
    document.getElementById('restart-button').addEventListener('click', restartGame);

    // 键盘事件监听
    document.addEventListener('keydown', handleKeyPress);

    // 触摸事件监听
    const gameBoard = document.getElementById('game-board');
    let touchStartX = 0;
    let touchStartY = 0;

    gameBoard.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: false });

    gameBoard.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    gameBoard.addEventListener('touchend', (e) => {
        if (gameOver) return;

        e.preventDefault();

        let touchEndX = e.changedTouches[0].clientX;
        let touchEndY = e.changedTouches[0].clientY;

        // 计算滑动距离
        let dx = touchEndX - touchStartX;
        let dy = touchEndY - touchStartY;

        // 设置滑动阈值
        const threshold = 30;

        // 确定滑动方向
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平滑动
            if (dx > threshold) {
                moveTiles('right');
            } else if (dx < -threshold) {
                moveTiles('left');
            }
        } else {
            // 垂直滑动
            if (dy > threshold) {
                moveTiles('down');
            } else if (dy < -threshold) {
                moveTiles('up');
            }
        }

        // 如果有移动，添加新方块并渲染
        if (moved) {
            addRandomTile();
            renderBoard();
            document.getElementById('score').textContent = score;

            // 检查是否合成了2048（闯关模式）
            if (gameMode === 'campaign' && hasWon) {
                levelUp();
            }

            if (isGameOver()) {
                endGame();
            }
        }

        // 重置移动标志
        moved = false;
    }, { passive: false });
}

// 开始游戏
function startGame() {
    if (!gameMode) {
        alert('请选择游戏模式');
        return;
    }

    // 隐藏模式选择界面，显示游戏界面
    modeSelection.style.display = 'none';
    gameInterface.style.display = 'block';

    // 初始化游戏状态
    score = 0;
    gameOver = false;
    hasWon = false;

    if (gameMode === 'campaign') {
        // 闯关模式：从难度1开始（8x8）
        level = 1;
        gridSize = 9 - level; // 难度1: 8x8, 难度2: 7x7, ..., 难度5: 4x4
        document.getElementById('level').textContent = level;
    } else if (gameMode === 'endless') {
        // 无尽模式：根据选择的难度设置网格大小
        level = parseInt(endlessDifficultySelect.value);
        gridSize = 9 - level; // 难度1: 8x8, 难度2: 7x7, ..., 难度5: 4x4
        document.getElementById('level').textContent = level;
    }

    // 初始化网格
    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));

    // 添加初始方块
    for (let i = 0; i < START_TILES; i++) {
        addRandomTile();
    }

    // 渲染游戏板
    renderBoard();

    // 更新分数显示
    document.getElementById('score').textContent = score;

    // 开始计时
    startTime = new Date();
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

// 更新计时器
function updateTimer() {
    const now = new Date();
    const elapsedTime = Math.floor((now - startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
    const seconds = (elapsedTime % 60).toString().padStart(2, '0');
    document.getElementById('time').textContent = `${minutes}:${seconds}`;
}

// 关卡升级（闯关模式）
function levelUp() {
    // 停止计时器
    clearInterval(timerInterval);

    // 播放胜利音效
    playWinSound();

    // 显示关卡完成信息
    document.getElementById('message').textContent = `关卡 ${level} 完成! 耗时: ${document.getElementById('time').textContent}, 得分: ${score}`;

    // 增加关卡
    level++;

    // 检查是否达到最高难度
    if (level > 5) {
        // 游戏通关
        gameOver = true;
        document.getElementById('message').textContent = `恭喜你通关了! 总耗时: ${document.getElementById('time').textContent}, 总得分: ${score}`;
        return;
    }

    // 更新关卡显示
    document.getElementById('level').textContent = level;

    // 调整网格大小
    gridSize = 9 - level; // 难度1: 8x8, 难度2: 7x7, ..., 难度5: 4x4

    // 重置游戏状态，但保留分数
    gameOver = false;
    hasWon = false;
    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));

    // 添加初始方块
    for (let i = 0; i < START_TILES; i++) {
        addRandomTile();
    }

    // 重新渲染游戏板
    renderBoard();

    // 重新开始计时
    startTime = new Date();
    timerInterval = setInterval(updateTimer, 1000);
}

// 播放合成音效
function playMergeSound() {
    mergeSound.currentTime = 0;
    mergeSound.play().catch(err => console.log('无法播放音效:', err));
}

// 播放胜利音效
function playWinSound() {
    winSound.currentTime = 0;
    winSound.play().catch(err => console.log('无法播放音效:', err));
}

// 返回模式选择
function backToModeSelection() {
    // 停止计时器
    clearInterval(timerInterval);

    // 隐藏游戏界面，显示模式选择界面
    gameInterface.style.display = 'none';
    modeSelection.style.display = 'block';

    // 重置游戏状态
    gameMode = null;
    modeOptions.forEach(opt => opt.classList.remove('selected'));
    document.getElementById('message').textContent = '';
}

// 重新开始游戏
function restartGame() {
    // 停止计时器
    clearInterval(timerInterval);

    // 重新开始当前模式
    startGame();

    // 清空消息
    document.getElementById('message').textContent = '';
}

// 添加随机方块
function addRandomTile() {
    const emptyCells = [];

    // 查找所有空单元格
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (grid[i][j] === 0) {
                emptyCells.push({row: i, col: j});
            }
        }
    }

    if (emptyCells.length > 0) {
        // 随机选择一个空单元格
        const {row, col} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        // 90%概率生成2，10%概率生成4
        grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
}

// 渲染游戏板
function renderBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';

    // 设置网格模板
    gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';

            const value = grid[i][j];
            if (value > 0) {
                tile.textContent = value;
                tile.style.backgroundColor = getTileColor(value);
                tile.style.color = value <= 4 ? '#776e65' : '#f9f6f2';

                // 检查是否合成了2048
                if (value >= WINNING_VALUE) {
                    hasWon = true;
                }
            }

            gameBoard.appendChild(tile);
        }
    }
}

// 获取方块颜色
function getTileColor(value) {
    const colors = {
        2: '#eee4da',
        4: '#ede0c8',
        8: '#f2b179',
        16: '#f59563',
        32: '#f67c5f',
        64: '#f65e3b',
        128: '#edcf72',
        256: '#edcc61',
        512: '#edc850',
        1024: '#edc53f',
        2048: '#edc22e'
    };

    return colors[value] || '#3c3a32';
}

// 处理键盘事件
function handleKeyPress(event) {
    if (gameOver) return;

    let moved = false;

    switch (event.key) {
        case 'ArrowUp':
            moved = moveTiles('up');
            break;
        case 'ArrowDown':
            moved = moveTiles('down');
            break;
        case 'ArrowLeft':
            moved = moveTiles('left');
            break;
        case 'ArrowRight':
            moved = moveTiles('right');
            break;
        default:
            return; // 忽略其他按键
    }

    if (moved) {
        addRandomTile();
        renderBoard();
        document.getElementById('score').textContent = score;

        // 检查是否合成了2048（闯关模式）
        if (gameMode === 'campaign' && hasWon) {
            levelUp();
        }

        if (isGameOver()) {
            endGame();
        }
    }
}

// 移动方块
let moved;
function moveTiles(direction) {
    moved = false;

    // 根据方向处理移动
    switch (direction) {
        case 'up':
            for (let j = 0; j < gridSize; j++) {
                moved = moveColumn(j, -1) || moved;
            }
            break;
        case 'down':
            for (let j = 0; j < gridSize; j++) {
                moved = moveColumn(j, 1) || moved;
            }
            break;
        case 'left':
            for (let i = 0; i < gridSize; i++) {
                moved = moveRow(i, -1) || moved;
            }
            break;
        case 'right':
            for (let i = 0; i < gridSize; i++) {
                moved = moveRow(i, 1) || moved;
            }
            break;
    }

    return moved;
}

// 移动行
function moveRow(row, dir) {
    const line = grid[row];
    const newLine = processLine(dir === 1 ? [...line].reverse() : [...line]);

    if (dir === 1) {
        newLine.reverse();
    }

    // 检查是否有变化
    if (JSON.stringify(line) !== JSON.stringify(newLine)) {
        grid[row] = newLine;
        return true;
    }

    return false;
}

// 移动列
function moveColumn(col, dir) {
    const line = [];

    // 提取列数据
    for (let i = 0; i < gridSize; i++) {
        line.push(grid[i][col]);
    }

    const newLine = processLine(dir === 1 ? [...line].reverse() : [...line]);

    if (dir === 1) {
        newLine.reverse();
    }

    // 检查是否有变化
    if (JSON.stringify(line) !== JSON.stringify(newLine)) {
        for (let i = 0; i < gridSize; i++) {
            grid[i][col] = newLine[i];
        }
        return true;
    }

    return false;
}

// 处理单行/列
function processLine(line) {
    // 移除零
    let nonZeros = line.filter(val => val !== 0);

    // 合并相同数字
    for (let i = 0; i < nonZeros.length - 1; i++) {
        if (nonZeros[i] === nonZeros[i + 1]) {
            nonZeros[i] *= 2;
            nonZeros[i + 1] = 0;
            score += nonZeros[i];

            // 播放合成音效
            playMergeSound();

            // 检查是否合成了2048
            if (nonZeros[i] >= WINNING_VALUE) {
                hasWon = true;
                playWinSound();
            }
        }
    }

    // 再次移除零
    nonZeros = nonZeros.filter(val => val !== 0);

    // 填充零
    while (nonZeros.length < gridSize) {
        nonZeros.push(0);
    }

    return nonZeros;
}

// 检查游戏是否结束
function isGameOver() {
    // 检查是否有空格
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (grid[i][j] === 0) {
                return false;
            }
        }
    }

    // 检查是否有可合并的相邻方块
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const value = grid[i][j];

            // 检查右侧
            if (j < gridSize - 1 && grid[i][j + 1] === value) {
                return false;
            }

            // 检查下方
            if (i < gridSize - 1 && grid[i + 1][j] === value) {
                return false;
            }
        }
    }

    return true;
}

// 游戏结束
function endGame() {
    gameOver = true;
    clearInterval(timerInterval);

    if (gameMode === 'campaign') {
        document.getElementById('message').textContent = `游戏结束! 当前关卡: ${level}, 耗时: ${document.getElementById('time').textContent}, 得分: ${score}`;
    } else {
        document.getElementById('message').textContent = `游戏结束! 耗时: ${document.getElementById('time').textContent}, 得分: ${score}`;
    }
}

// 初始化游戏
function initGame() {
    initEventListeners();
}

// 页面加载完成后初始化游戏
window.onload = initGame;