export const GRID_SIZE = 16;
export const SPEEDS = {
  slow: 320,
  normal: 220,
  fast: 150
};
export const DEFAULT_SPEED = "slow";
export const INITIAL_TICK_MS = SPEEDS[DEFAULT_SPEED];

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

const OPPOSITES = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT"
};

export function createInitialState(options = {}) {
  const gridSize = options.gridSize ?? GRID_SIZE;
  const snake = [
    { x: 4, y: 8 },
    { x: 3, y: 8 },
    { x: 2, y: 8 }
  ];

  return {
    gridSize,
    snake,
    direction: "RIGHT",
    queuedDirection: "RIGHT",
    food: spawnFood(snake, gridSize, options.rng),
    speed: options.speed ?? DEFAULT_SPEED,
    score: 0,
    status: "idle",
    tick: 0
  };
}

export function queueDirection(state, nextDirection) {
  if (!DIRECTIONS[nextDirection]) {
    return state;
  }

  const currentDirection = state.queuedDirection ?? state.direction;
  if (OPPOSITES[currentDirection] === nextDirection) {
    return state;
  }

  return {
    ...state,
    queuedDirection: nextDirection,
    status: state.status === "idle" ? "running" : state.status
  };
}

export function togglePause(state) {
  if (state.status === "game-over") {
    return state;
  }

  if (state.status === "paused") {
    return { ...state, status: "running" };
  }

  if (state.status === "running" || state.status === "idle") {
    return { ...state, status: "paused" };
  }

  return state;
}

export function restartGame(options = {}) {
  return createInitialState(options);
}

export function setSpeed(state, speed) {
  if (!Object.hasOwn(SPEEDS, speed)) {
    return state;
  }

  return {
    ...state,
    speed
  };
}

export function getTickMs(speed) {
  return SPEEDS[speed] ?? INITIAL_TICK_MS;
}

export function advanceState(state, rng = Math.random) {
  if (
    state.status === "idle" ||
    state.status === "paused" ||
    state.status === "game-over"
  ) {
    return state;
  }

  const nextDirection = state.queuedDirection ?? state.direction;
  const delta = DIRECTIONS[nextDirection];
  const nextHead = wrapPosition(
    {
      x: state.snake[0].x + delta.x,
      y: state.snake[0].y + delta.y
    },
    state.gridSize
  );

  const willGrow =
    state.food !== null &&
    nextHead.x === state.food.x &&
    nextHead.y === state.food.y;

  const snakeToCheck = willGrow ? state.snake : state.snake.slice(0, -1);
  if (hitsSnake(nextHead, snakeToCheck)) {
    return {
      ...state,
      direction: nextDirection,
      queuedDirection: nextDirection,
      status: "game-over"
    };
  }

  const snake = willGrow
    ? [nextHead, ...state.snake]
    : [nextHead, ...state.snake.slice(0, -1)];

  const boardFilled = snake.length === state.gridSize * state.gridSize;
  const food = willGrow && !boardFilled ? spawnFood(snake, state.gridSize, rng) : state.food;

  return {
    ...state,
    snake,
    direction: nextDirection,
    queuedDirection: nextDirection,
    food: willGrow ? food : state.food,
    score: state.score + (willGrow ? 1 : 0),
    status: boardFilled ? "won" : "running",
    tick: state.tick + 1
  };
}

export function spawnFood(snake, gridSize, rng = Math.random) {
  const openCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!hitsSnake({ x, y }, snake)) {
        openCells.push({ x, y });
      }
    }
  }

  if (openCells.length === 0) {
    return null;
  }

  const index = Math.floor(rng() * openCells.length);
  return openCells[index];
}

export function hitsWall(position, gridSize) {
  return (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= gridSize ||
    position.y >= gridSize
  );
}

export function wrapPosition(position, gridSize) {
  return {
    x: (position.x + gridSize) % gridSize,
    y: (position.y + gridSize) % gridSize
  };
}

export function hitsSnake(position, snake) {
  return snake.some((segment) => segment.x === position.x && segment.y === position.y);
}
