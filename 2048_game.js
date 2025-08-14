// 游戏常量
const GRID_SIZE = 9;
const START_TILES = 2;

// 游戏状态
let grid;
let score;
let gameOver;

// 初始化游戏
function initGame() {
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    gameOver = false;
    document.getElementById('score').textContent = score;
    
    // 添加初始方块
    for (let i = 0; i < START_TILES; i++) {
        addRandomTile();
    }
    
    // 渲染游戏板
    renderBoard();
    
    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('restart-button').addEventListener('click', restartGame);
}

// 添加随机方块
function addRandomTile() {
    const emptyCells = [];
    
    // 查找所有空单元格
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
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
    
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            
            const value = grid[i][j];
            if (value > 0) {
                tile.textContent = value;
                tile.style.backgroundColor = getTileColor(value);
                tile.style.color = value <= 4 ? '#776e65' : '#f9f6f2';
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
        
        if (isGameOver()) {
            gameOver = true;
            document.getElementById('message').textContent = '游戏结束!';
        }
    }
}

// 移动方块
function moveTiles(direction) {
    let moved = false;
    
    // 根据方向处理移动
    switch (direction) {
        case 'up':
            for (let j = 0; j < GRID_SIZE; j++) {
                moved = moveColumn(j, -1) || moved;
            }
            break;
        case 'down':
            for (let j = 0; j < GRID_SIZE; j++) {
                moved = moveColumn(j, 1) || moved;
            }
            break;
        case 'left':
            for (let i = 0; i < GRID_SIZE; i++) {
                moved = moveRow(i, -1) || moved;
            }
            break;
        case 'right':
            for (let i = 0; i < GRID_SIZE; i++) {
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
    for (let i = 0; i < GRID_SIZE; i++) {
        line.push(grid[i][col]);
    }
    
    const newLine = processLine(dir === 1 ? [...line].reverse() : [...line]);
    
    if (dir === 1) {
        newLine.reverse();
    }
    
    // 检查是否有变化
    if (JSON.stringify(line) !== JSON.stringify(newLine)) {
        for (let i = 0; i < GRID_SIZE; i++) {
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
        }
    }
    
    // 再次移除零
    nonZeros = nonZeros.filter(val => val !== 0);
    
    // 填充零
    while (nonZeros.length < GRID_SIZE) {
        nonZeros.push(0);
    }
    
    return nonZeros;
}

// 检查游戏是否结束
function isGameOver() {
    // 检查是否有空格
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j] === 0) {
                return false;
            }
        }
    }
    
    // 检查是否有可合并的相邻方块
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const value = grid[i][j];
            
            // 检查右侧
            if (j < GRID_SIZE - 1 && grid[i][j + 1] === value) {
                return false;
            }
            
            // 检查下方
            if (i < GRID_SIZE - 1 && grid[i + 1][j] === value) {
                return false;
            }
        }
    }
    
    return true;
}

// 重新开始游戏
function restartGame() {
    initGame();
    document.getElementById('message').textContent = '';
}

// 初始化游戏
window.onload = initGame;