import {
  advanceState,
  createInitialState,
  getTickMs,
  GRID_SIZE,
  queueDirection,
  restartGame,
  setSpeed,
  togglePause
} from "./game.js";

const boardElement = document.querySelector("#board");
const scoreElement = document.querySelector("#score");
const statusElement = document.querySelector("#status");
const restartButton = document.querySelector("#restart-button");
const pauseButton = document.querySelector("#pause-button");
const controlButtons = document.querySelectorAll("[data-direction]");
const speedButtons = document.querySelectorAll("[data-speed]");

let state = createInitialState();
let loopId = null;

buildBoard(GRID_SIZE);
render(state);
startLoop();
boardElement.focus();

document.addEventListener("keydown", handleKeydown);
restartButton.addEventListener("click", () => {
  state = restartGame({ speed: state.speed });
  render(state);
});
pauseButton.addEventListener("click", () => {
  state = togglePause(state);
  render(state);
});

speedButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state = setSpeed(state, button.dataset.speed);
    startLoop();
    render(state);
    boardElement.focus();
  });
});

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state = queueDirection(state, button.dataset.direction);
    render(state);
    boardElement.focus();
  });
});

function startLoop() {
  if (loopId !== null) {
    window.clearInterval(loopId);
  }

  loopId = window.setInterval(() => {
    state = advanceState(state);
    render(state);
  }, getTickMs(state.speed));
}

function buildBoard(gridSize) {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < gridSize * gridSize; index += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = String(index);
    cell.setAttribute("role", "gridcell");
    fragment.appendChild(cell);
  }

  boardElement.appendChild(fragment);
}

function render(currentState) {
  const cells = boardElement.children;

  for (const cell of cells) {
    cell.className = "cell";
  }

  currentState.snake.forEach((segment, index) => {
    const cell = getCell(segment.x, segment.y);
    if (!cell) {
      return;
    }

    cell.classList.add("snake");
    if (index === 0) {
      cell.classList.add("snake-head");
    }
  });

  if (currentState.food) {
    getCell(currentState.food.x, currentState.food.y)?.classList.add("food");
  }

  scoreElement.textContent = String(currentState.score);
  pauseButton.textContent = currentState.status === "paused" ? "继续" : "暂停";
  statusElement.textContent = getStatusText(currentState);
  updateSpeedButtons(currentState.speed);
}

function getCell(x, y) {
  return boardElement.children[y * GRID_SIZE + x] ?? null;
}

function getStatusText(currentState) {
  switch (currentState.status) {
    case "idle":
      return "按方向键开始，吃到更多苹果。";
    case "paused":
      return "游戏暂停了。";
    case "game-over":
      return "碰到自己了，再玩一次。";
    case "won":
      return "你把棋盘装满了，再来一次。";
    default:
      return "撞到边缘会从另一边出来。";
  }
}

function updateSpeedButtons(speed) {
  speedButtons.forEach((button) => {
    const isActive = button.dataset.speed === speed;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function handleKeydown(event) {
  const direction = keyToDirection(event.key);

  if (direction) {
    event.preventDefault();
    state = queueDirection(state, direction);
    render(state);
    return;
  }

  if (event.key === " ") {
    event.preventDefault();
    state = togglePause(state);
    render(state);
    return;
  }

  if (event.key === "Enter" && state.status === "game-over") {
    state = restartGame({ speed: state.speed });
    render(state);
  }
}

function keyToDirection(key) {
  const normalizedKey = key.toLowerCase();

  if (normalizedKey === "arrowup" || normalizedKey === "w") {
    return "UP";
  }

  if (normalizedKey === "arrowdown" || normalizedKey === "s") {
    return "DOWN";
  }

  if (normalizedKey === "arrowleft" || normalizedKey === "a") {
    return "LEFT";
  }

  if (normalizedKey === "arrowright" || normalizedKey === "d") {
    return "RIGHT";
  }

  return null;
}
