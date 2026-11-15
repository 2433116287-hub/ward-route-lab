"use strict";

const { width, height, dock, supply, rooms, key, makeWard, planMission } = WardRoutes;
const element = id => document.getElementById(id);
const canvas = element("map");
const context = canvas.getContext("2d");
const tile = canvas.width / width;
const labels = { astar: "A*", bfs: "Breadth-first search" };
let run;
let timer;

function center([x, y]) {
  return [(x + 0.5) * tile, (y + 0.5) * tile];
}

function circle(cell, radius, color) {
  context.beginPath();
  context.arc(...center(cell), radius, 0, 2 * Math.PI);
  context.fillStyle = color;
  context.fill();
}

function station(cell, name) {
  circle(cell, tile * 0.36, "#fff");
  context.font = "bold 12px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#102925";
  context.fillText(name, ...center(cell));
}

function draw(robotCell) {
  const { ward, result } = run;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = key([x, y]);
      let fill = "#ebf3f0";
      if (result.visited.has(index)) fill = "#cce7e0";
      if (ward.walls.has(index)) fill = "#284842";
      if (ward.carts.has(index)) fill = "#ae5119";
      context.fillStyle = fill;
      context.fillRect(x * tile, y * tile, tile - 1, tile - 1);
    }
  }

  if (result.path.length) {
    context.beginPath();
    context.moveTo(...center(result.path[0]));
    for (const cell of result.path.slice(1)) context.lineTo(...center(cell));
    context.lineJoin = "round";
    context.lineWidth = 5;
    context.strokeStyle = "#008b72";
    context.stroke();
  }

  station(dock, "Dock");
  station(supply, "Pick");
  for (const [name, cell] of Object.entries(rooms)) station(cell, name);
  circle(robotCell, tile * 0.19, "#6153aa");
}

function plan() {
  const seedInput = element("seed");
  if (!seedInput.reportValidity()) return;
  clearInterval(timer);
  const seed = Number(seedInput.value);
  const scenario = element("scenario").value;
  const room = element("room").value;
  const algorithm = element("algorithm").value;
  const ward = makeWard(seed, scenario);
  const results = Object.fromEntries(Object.keys(labels).map(name => [
    name, planMission(ward, room, name),
  ]));
  const result = results[algorithm];
  run = { seed, scenario, room, algorithm, ward, results, result };

  const rows = Object.entries(results).map(([name, route]) => {
    const row = document.createElement("tr");
    for (const value of [labels[name], route.completed ? route.path.length - 1 : "Blocked", route.expanded]) {
      row.insertCell().textContent = value;
    }
    return row;
  });
  element("metrics").replaceChildren(...rows);
  element("replay").disabled = !result.completed;
  element("status").textContent = result.completed
    ? `${labels[algorithm]} route ready for Room ${room}`
    : `${result.blockedLeg} blocked. No complete route to Room ${room}.`;
  draw(dock);
}

function replay() {
  const { result, room } = run;
  clearInterval(timer);
  let step = 0;
  draw(result.path[0]);
  element("status").textContent = "Robot en route to the supply station.";
  timer = setInterval(() => {
    step += 1;
    draw(result.path[step]);
    if (step === result.pickupStep) {
      element("status").textContent = `Supplies collected. Heading to Room ${room}.`;
    }
    if (step === result.path.length - 1) {
      element("status").textContent = `Supplies delivered to Room ${room}.`;
      clearInterval(timer);
    }
  }, 95);
}

function exportRun() {
  const { seed, scenario, room, algorithm, ward, results } = run;
  const payload = {
    seed, scenario, room, algorithm,
    grid: { width, height, walls: [...ward.walls], carts: [...ward.carts] },
    planners: Object.fromEntries(Object.entries(results).map(([name, route]) => [
      name,
      { ...route, visited: [...route.visited], moves: route.completed ? route.path.length - 1 : null },
    ])),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `ward-route-${scenario}-${seed}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

element("plan").addEventListener("click", plan);
element("replay").addEventListener("click", replay);
element("export").addEventListener("click", exportRun);
plan();
