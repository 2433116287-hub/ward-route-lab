# Ward Route Lab

Ward Route Lab is a browser simulator for a hospital supply robot. The robot leaves its dock, collects supplies, and heads to a selected room. The planner must route around walls and parked carts. A closed-door scenario shows how the simulator handles a mission it cannot complete.

## Run it

Download or clone the repository and open `index.html` in a browser. The simulator runs locally without a server, packages, or an API key.

1. Select a scenario, a layout seed, and a destination. The seed controls where carts are parked.
2. Click **Plan mission** to compare A* and breadth-first search on the same layout.
3. Click **Replay route** to watch the selected planner's route or **Download run JSON** to inspect both results.

## Model and metrics

The 17 x 11 grid allows four-way movement at one cost unit per adjacent cell. Breadth-first search expands the grid in distance order. A* uses Manhattan distance to prioritize cells toward the goal. Each planner solves two legs, from dock to supply station and from supply station to room. Moves count the full route, and expanded cells are summed across both legs. In exported JSON, path points are zero-based `[x, y]` pairs. Walls, carts, and explored cells use the index `y * width + x`.

| File | Responsibility |
| --- | --- |
| `planner.js` | Builds seeded layouts and computes routes and search metrics |
| `app.js` | Draws the ward, replays the robot, and exports results |
| `index.html` | Defines the layout and mission controls |

## Scope

This Codex-assisted prototype models a point robot with static obstacles. It uses synthetic layouts and focuses on grid navigation. Continuous motion, patient interaction, and physical robot integration are outside the prototype's scope.
