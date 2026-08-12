import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../..");
const adminViewPath = resolve(
  projectRoot,
  "server/work/xvm/apps/default/music-player/views/admin.json"
);
const clientPath = resolve(projectRoot, "client/src/MPClient/MusicPlayerClient.ts");

const adminView = JSON.parse(readFileSync(adminViewPath, "utf8"));
const clientSource = readFileSync(clientPath, "utf8");
const allObjects = [];
const parents = new Map();

function walk(node, parent = null) {
  if (!node || typeof node !== "object") return;
  if (node._id) {
    allObjects.push(node);
    parents.set(node._id, parent?._id || null);
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => walk(child, node));
    else if (value && typeof value === "object") walk(value, node);
  }
}

walk(adminView);

function byId(id) {
  return allObjects.find((object) => object._id === id && typeof object._type === "string");
}

function parentChain(id) {
  const chain = [];
  let current = parents.get(id);
  while (current) {
    chain.push(current);
    current = parents.get(current);
  }
  return chain;
}

function handlerOp(object) {
  return object?._on?.click?._op || object?._on?.click?._params?._op;
}

function handlerModule(object) {
  return object?._on?.click?._module || object?._on?.click?._params?._module;
}

function dataOutputForField(id) {
  const field = byId(id);
  return field?._data_output || field?._control?._data_output;
}

assert.equal(byId("open-create-schedule-button")._text, "+ Create Schedule");
assert.equal(handlerModule(byId("open-create-schedule-button")), "music-player-client");
assert.equal(handlerOp(byId("open-create-schedule-button")), "open-create-schedule-modal");

assert.ok(byId("schedule-list-pane"), "schedule list remains visible on the main screen");
assert.equal(parentChain("schedule-list-pane")[0], "schedule-panel");
assert.ok(parentChain("schedules-gallery").includes("schedule-panel"));
assert.ok(!parentChain("schedule-create-form").includes("schedule-panel"));

const modal = byId("create-schedule-modal");
assert.equal(modal._type, "modal");
assert.equal(modal._title, "Create Schedule");
assert.equal(modal._size, "lg");
assert.equal(modal._closable, false);
assert.equal(modal._close_on_backdrop, false);
assert.ok(parentChain("schedule-create-form").includes("create-schedule-modal"));

const requiredFields = [
  ["schedule-name-field", "music-schedule-name"],
  ["schedule-playlist-field", "music-schedule-playlist-id"],
  ["schedule-start-time-field", "music-schedule-start-time"],
  ["schedule-end-time-field", "music-schedule-end-time"],
  ["schedule-volume-field", "music-schedule-volume"],
  ["schedule-shuffle-field", "music-schedule-shuffle"],
  ["schedule-enabled-field", "music-schedule-enabled"],
  ["schedule-priority-field", "music-schedule-priority"]
];

for (const [id, dataOutput] of requiredFields) {
  assert.equal(dataOutputForField(id), dataOutput);
}

const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
for (const day of days) {
  assert.ok(byId(`schedule-day-${day}`), `missing ${day} day wrapper`);
  assert.equal(byId(`schedule-day-${day}-checkbox`).type, "checkbox");
}

assert.equal(byId("schedule-status")._data_source, "music-schedule-status");
assert.equal(byId("create-schedule-modal-actions")._type, "toolbar");
assert.equal(handlerModule(byId("cancel-create-schedule-button")), "music-player-client");
assert.equal(handlerOp(byId("cancel-create-schedule-button")), "cancel-create-schedule");
assert.equal(handlerModule(byId("create-schedule-button")), "music-player-client");
assert.equal(handlerOp(byId("create-schedule-button")), "create-schedule");

assert.equal(
  allObjects.filter((object) => Object.hasOwn(object, "_click")).length,
  0,
  "admin view should use canonical _on.click bindings"
);

assert.match(clientSource, /"open-create-schedule-modal"/);
assert.match(clientSource, /"cancel-create-schedule"/);
assert.match(clientSource, /async _open_create_schedule_modal\(\)/);
assert.match(clientSource, /async _cancel_create_schedule\(\)/);
assert.match(clientSource, /XUI\.show\("create-schedule-modal"\)/);
assert.match(clientSource, /this\.closeObject\("create-schedule-modal"\)/);
assert.match(clientSource, /await this\._list_schedules\(\)/);
assert.match(clientSource, /this\.resetCreateScheduleForm\(source\)/);

console.log("admin create schedule modal contract verified");
