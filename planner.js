"use strict";

const WardRoutes = (() => {
  const width = 17;
  const height = 11;
  const dock = [2, 8];
  const supply = [14, 8];
  const rooms = { A: [3, 2], B: [8, 2], C: [13, 2] };
  const key = ([x, y]) => y * width + x;
  const distance = ([ax, ay], [bx, by]) => Math.abs(ax - bx) + Math.abs(ay - by);
  const directions = [[1, 0], [0, -1], [-1, 0], [0, 1]];

  function makeWard(seed, scenario) {
    const walls = new Set();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const boundary = x === 0 || y === 0 || x === width - 1 || y === height - 1;
        const partition = y === 5 && (scenario === "sealed" || ![3, 8, 13].includes(x));
        const roomWall = y < 5 && [5, 11].includes(x);
        if (boundary || partition || roomWall) walls.add(key([x, y]));
      }
    }

    const carts = new Set();
    if (scenario === "busy") {
      let state = seed >>> 0;
      const candidates = [];
      for (let y = 6; y <= 9; y++) {
        for (let x = 1; x < width - 1; x++) {
          const cell = key([x, y]);
          if (cell !== key(dock) && cell !== key(supply)) candidates.push(cell);
        }
      }
      while (carts.size < 11) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        const index = Math.floor((state / 4294967296) * candidates.length);
        carts.add(candidates.splice(index, 1)[0]);
      }
    }
    return { walls, carts };
  }

  function findPath(ward, start, goal, algorithm) {
    const visited = new Set();
    const costs = new Map([[key(start), 0]]);
    const parents = new Map();
    const frontier = [{ cell: start, cost: 0 }];
    const isAStar = algorithm === "astar";
    const priority = ({ cell, cost }) => cost + distance(cell, goal);

    while (frontier.length) {
      if (isAStar) frontier.sort((a, b) => priority(a) - priority(b) ||
        distance(a.cell, goal) - distance(b.cell, goal));
      const { cell, cost } = frontier.shift();
      const current = key(cell);
      if (visited.has(current)) continue;
      visited.add(current);
      if (current === key(goal)) {
        const path = [cell];
        while (parents.has(key(path.at(-1)))) path.push(parents.get(key(path.at(-1))));
        return { path: path.reverse(), visited };
      }

      for (const [dx, dy] of directions) {
        const next = [cell[0] + dx, cell[1] + dy];
        if (next[0] < 0 || next[0] >= width || next[1] < 0 || next[1] >= height) continue;
        const nextKey = key(next);
        if (ward.walls.has(nextKey) || ward.carts.has(nextKey) ||
          cost + 1 >= (costs.get(nextKey) ?? Infinity)) continue;
        costs.set(nextKey, cost + 1);
        parents.set(nextKey, cell);
        frontier.push({ cell: next, cost: cost + 1 });
      }
    }
    return { path: [], visited };
  }

  function planMission(ward, room, algorithm) {
    const pickup = findPath(ward, dock, supply, algorithm);
    const delivery = pickup.path.length ? findPath(ward, supply, rooms[room], algorithm) : null;
    const completed = Boolean(delivery?.path.length);
    return {
      completed,
      path: completed ? [...pickup.path, ...delivery.path.slice(1)] : [],
      pickupStep: completed ? pickup.path.length - 1 : null,
      expanded: pickup.visited.size + (delivery?.visited.size ?? 0),
      visited: new Set([...pickup.visited, ...(delivery?.visited ?? [])]),
      blockedLeg: completed ? null : (delivery ? "Delivery" : "Pickup"),
    };
  }

  return { width, height, dock, supply, rooms, key, makeWard, planMission };
})();

if (typeof module !== "undefined") module.exports = WardRoutes;
