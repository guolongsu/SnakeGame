import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceState,
  createInitialState,
  getTickMs,
  hitsWall,
  queueDirection,
  setSpeed,
  spawnFood
} from "../src/game.js";

test("moves one cell in the active direction", () => {
  const nextState = advanceState({
    gridSize: 8,
    snake: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 }
    ],
    direction: "RIGHT",
    queuedDirection: "RIGHT",
    food: { x: 7, y: 7 },
    score: 0,
    status: "running",
    tick: 0
  });

  assert.deepEqual(nextState.snake, [
    { x: 3, y: 2 },
    { x: 2, y: 2 },
    { x: 1, y: 2 }
  ]);
  assert.equal(nextState.tick, 1);
});

test("grows and increases score when food is eaten", () => {
  const nextState = advanceState(
    {
      gridSize: 8,
      snake: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 0, y: 2 }
      ],
      direction: "RIGHT",
      queuedDirection: "RIGHT",
      food: { x: 3, y: 2 },
      score: 0,
      status: "running",
      tick: 0
    },
    () => 0
  );

  assert.equal(nextState.snake.length, 4);
  assert.equal(nextState.score, 1);
  assert.notDeepEqual(nextState.food, { x: 3, y: 2 });
});

test("wraps to the opposite side on wall crossing", () => {
  const nextState = advanceState({
    gridSize: 4,
    snake: [
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 1 }
    ],
    direction: "RIGHT",
    queuedDirection: "RIGHT",
    food: { x: 0, y: 0 },
    score: 0,
    status: "running",
    tick: 0
  });

  assert.equal(nextState.status, "running");
  assert.deepEqual(nextState.snake[0], { x: 0, y: 1 });
});

test("marks game over on self collision", () => {
  const nextState = advanceState({
    gridSize: 8,
    snake: [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 1 }
    ],
    direction: "UP",
    queuedDirection: "RIGHT",
    food: { x: 7, y: 7 },
    score: 0,
    status: "running",
    tick: 0
  });

  assert.equal(nextState.status, "game-over");
});

test("food spawns only on empty cells", () => {
  const food = spawnFood(
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 }
    ],
    2,
    () => 0
  );

  assert.deepEqual(food, { x: 1, y: 1 });
});

test("prevents immediate reversal of direction", () => {
  const initialState = createInitialState({ gridSize: 8, rng: () => 0.5 });
  const nextState = queueDirection(initialState, "LEFT");

  assert.equal(nextState.queuedDirection, "RIGHT");
});

test("changes speed when selecting a valid speed", () => {
  const initialState = createInitialState({ gridSize: 8, rng: () => 0.5 });
  const nextState = setSpeed(initialState, "fast");

  assert.equal(nextState.speed, "fast");
});

test("ignores invalid speed values", () => {
  const initialState = createInitialState({ gridSize: 8, rng: () => 0.5 });
  const nextState = setSpeed(initialState, "turbo");

  assert.equal(nextState.speed, "slow");
});

test("preserves selected speed across restart", () => {
  const initialState = setSpeed(
    createInitialState({ gridSize: 8, rng: () => 0.5 }),
    "slow"
  );
  const restartedState = createInitialState({ gridSize: 8, speed: initialState.speed, rng: () => 0.5 });

  assert.equal(restartedState.speed, "slow");
});

test("maps speeds to expected tick intervals", () => {
  assert.equal(getTickMs("slow"), 320);
  assert.equal(getTickMs("normal"), 220);
  assert.equal(getTickMs("fast"), 150);
});

test("default state starts at the slow speed", () => {
  const initialState = createInitialState({ gridSize: 8, rng: () => 0.5 });

  assert.equal(initialState.speed, "slow");
});

test("hitsWall still detects out of bounds positions independently", () => {
  assert.equal(hitsWall({ x: -1, y: 2 }, 8), true);
  assert.equal(hitsWall({ x: 2, y: 2 }, 8), false);
});
