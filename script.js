const ROWS = 9;
const COLS = 9;
const MINES = 10;

const boardEl = document.getElementById('board');
const mineCounterEl = document.getElementById('mine-counter');
const timerEl = document.getElementById('timer');
const faceBtn = document.getElementById('face-btn');

let board = [];
let cellEls = [];
let gameOver = false;
let firstClick = true;
let flagsPlaced = 0;
let openedCount = 0;
let elapsedSeconds = 0;
let timerInterval = null;

function createEmptyBoard() {
  board = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push({ isMine: false, isOpen: false, isFlagged: false, adjacentCount: 0 });
    }
    board.push(row);
  }
}

function forEachNeighbor(r, c, callback) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        callback(nr, nc);
      }
    }
  }
}

// 첫 클릭 칸과 그 주변은 지뢰를 배치하지 않는다
function placeMines(excludeRow, excludeCol) {
  const forbidden = new Set([`${excludeRow},${excludeCol}`]);
  forEachNeighbor(excludeRow, excludeCol, (nr, nc) => forbidden.add(`${nr},${nc}`));

  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (forbidden.has(`${r},${c}`) || board[r][c].isMine) continue;
    board[r][c].isMine = true;
    placed++;
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      forEachNeighbor(r, c, (nr, nc) => {
        if (board[nr][nc].isMine) count++;
      });
      board[r][c].adjacentCount = count;
    }
  }
}

function renderBoard() {
  boardEl.innerHTML = '';
  cellEls = [];
  for (let r = 0; r < ROWS; r++) {
    const rowEls = [];
    for (let c = 0; c < COLS; c++) {
      const cellEl = document.createElement('div');
      cellEl.className = 'cell';
      cellEl.addEventListener('click', () => handleLeftClick(r, c));
      cellEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        handleRightClick(r, c);
      });
      boardEl.appendChild(cellEl);
      rowEls.push(cellEl);
    }
    cellEls.push(rowEls);
  }
}

function updateCellView(r, c) {
  const cell = board[r][c];
  const cellEl = cellEls[r][c];
  cellEl.classList.toggle('open', cell.isOpen);
  cellEl.classList.toggle('flag', cell.isFlagged && !cell.isOpen);
  cellEl.classList.toggle('mine', cell.isOpen && cell.isMine);
  if (cell.isOpen && !cell.isMine && cell.adjacentCount > 0) {
    cellEl.textContent = cell.adjacentCount;
    cellEl.dataset.count = cell.adjacentCount;
  } else {
    cellEl.textContent = '';
    delete cellEl.dataset.count;
  }
}

function openCell(r, c) {
  const cell = board[r][c];
  if (cell.isOpen || cell.isFlagged) return;
  cell.isOpen = true;
  openedCount++;
  updateCellView(r, c);

  if (cell.adjacentCount === 0 && !cell.isMine) {
    forEachNeighbor(r, c, (nr, nc) => openCell(nr, nc));
  }
}

function revealAllMines(clickedR, clickedC) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].isMine) {
        board[r][c].isOpen = true;
        updateCellView(r, c);
      }
    }
  }
  cellEls[clickedR][clickedC].style.background = '#ff0000';
}

function handleLeftClick(r, c) {
  if (gameOver || board[r][c].isFlagged || board[r][c].isOpen) return;

  if (firstClick) {
    placeMines(r, c);
    firstClick = false;
    startTimer();
  }

  if (board[r][c].isMine) {
    endGame(false, r, c);
    return;
  }

  openCell(r, c);
  checkWin();
}

function handleRightClick(r, c) {
  if (gameOver || board[r][c].isOpen) return;
  board[r][c].isFlagged = !board[r][c].isFlagged;
  flagsPlaced += board[r][c].isFlagged ? 1 : -1;
  updateCellView(r, c);
  updateMineCounter();
}

function checkWin() {
  if (openedCount === ROWS * COLS - MINES) {
    endGame(true);
  }
}

function endGame(won, clickedR, clickedC) {
  gameOver = true;
  stopTimer();
  if (won) {
    faceBtn.textContent = '😎';
  } else {
    faceBtn.textContent = '😵';
    revealAllMines(clickedR, clickedC);
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    elapsedSeconds = Math.min(elapsedSeconds + 1, 999);
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimerDisplay() {
  timerEl.textContent = String(elapsedSeconds).padStart(3, '0');
}

function updateMineCounter() {
  const remaining = MINES - flagsPlaced;
  mineCounterEl.textContent = String(remaining).padStart(3, '0');
}

function resetGame() {
  gameOver = false;
  firstClick = true;
  flagsPlaced = 0;
  openedCount = 0;
  elapsedSeconds = 0;
  stopTimer();
  faceBtn.textContent = '🙂';
  updateTimerDisplay();
  createEmptyBoard();
  renderBoard();
  updateMineCounter();
}

faceBtn.addEventListener('click', resetGame);

resetGame();
