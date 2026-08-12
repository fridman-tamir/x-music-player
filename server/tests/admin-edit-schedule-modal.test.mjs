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

function walk(node) {
  if (!node || typeof node !== "object") return;
  allObjects.push(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") walk(value);
  }
}

walk(adminView);

function byId(id) {
  return allObjects.find((object) => object._id === id && typeof object._type === "string");
}

function clickHandler(object) {
  return object?._on?.click ?? null;
}

function dataOutputForField(id) {
  const field = byId(id);
  return field?._data_output || field?._control?._data_output;
}

const editButton = allObjects.find((object) => {
  const handler = clickHandler(object);
  return object?._type === "button" &&
    object?._text === "Edit" &&
    handler?._module === "music-player-client" &&
    handler?._op === "prepare-edit-schedule";
});

assert.ok(editButton, "schedule Edit action should call prepare-edit-schedule");
assert.equal(clickHandler(editButton)._params?._schedule_id, "$row._id");

const modal = byId("edit-schedule-modal");
assert.equal(modal._type, "modal");
assert.equal(modal._title, "Edit Schedule");

const requiredFields = [
  ["edit-schedule-name-field", "music-edit-schedule-name"],
  ["edit-schedule-playlist-field", "music-edit-schedule-playlist-id"],
  ["edit-schedule-start-time-field", "music-edit-schedule-start-time"],
  ["edit-schedule-end-time-field", "music-edit-schedule-end-time"],
  ["edit-schedule-priority-field", "music-edit-schedule-priority"],
  ["edit-schedule-volume-field", "music-edit-schedule-volume"],
  ["edit-schedule-shuffle-field", "music-edit-schedule-shuffle"],
  ["edit-schedule-enabled-field", "music-edit-schedule-enabled"]
];

for (const [id, dataOutput] of requiredFields) {
  assert.equal(dataOutputForField(id), dataOutput);
}

assert.equal(byId("edit-schedule-playlist-select")._selected_data_source, "music-edit-schedule-playlist-id");
assert.equal(byId("edit-schedule-shuffle-input")._selected_data_source, "music-edit-schedule-shuffle");
assert.equal(byId("edit-schedule-enabled-input")._selected_data_source, "music-edit-schedule-enabled");

for (const day of ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]) {
  const checkbox = byId(`edit-schedule-day-${day}-checkbox`);
  assert.equal(checkbox.type, "checkbox");
  assert.equal(clickHandler(checkbox), null);
  assert.equal(checkbox._on?.change?._params?.key, `music-edit-schedule-day-${day}`);
}

const saveButton = modal._actions.find((object) => object?._text === "Save");
assert.equal(clickHandler(saveButton)._module, "music-player-client");
assert.equal(clickHandler(saveButton)._op, "edit-schedule");

assert.match(clientSource, /async _prepare_edit_schedule\(xcmd\?: ClientXCommand\)/);
assert.match(clientSource, /const schedule_id = this\.readParamString\(xcmd, "_schedule_id"\);/);
assert.match(clientSource, /let schedule = this\.findScheduleById\(schedule_id\);/);
assert.match(clientSource, /this\.showEditScheduleModal\(source, schedule\);/);
assert.match(
  clientSource,
  /private showEditScheduleModal\(source: string, schedule: any\) \{\s*this\.syncEditScheduleForm\(source, schedule\);\s*XUI\.show\("edit-schedule-modal"\);\s*queueMicrotask\(\(\) => this\.syncEditScheduleForm\(source, schedule\)\);\s*\}/s
);

for (const key of [
  "music-edit-schedule-id",
  "music-edit-schedule-name",
  "music-edit-schedule-playlist-id",
  "music-edit-schedule-start-time",
  "music-edit-schedule-end-time",
  "music-edit-schedule-priority",
  "music-edit-schedule-volume",
  "music-edit-schedule-shuffle",
  "music-edit-schedule-enabled"
]) {
  assert.match(clientSource, new RegExp(JSON.stringify(key)));
}

assert.match(clientSource, /this\.setControlChecked\(day\._object_id, checked\);/);
assert.match(clientSource, /const days = this\.readEditScheduleDays\(\);/);
assert.match(clientSource, /const playlist_id = this\.readControlOrXDataString\("music-edit-schedule-playlist-id", "edit-schedule-playlist-select"\);/);
assert.match(clientSource, /_schedule_id: schedule_id/);
assert.match(clientSource, /_op: "update-schedule"/);

console.log("admin edit schedule modal contract verified");
