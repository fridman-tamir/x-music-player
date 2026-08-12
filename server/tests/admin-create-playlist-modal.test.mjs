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
  if (!node || typeof node !== "object") {
    return;
  }

  if (node._id) {
    allObjects.push(node);
    parents.set(node._id, parent?._id || null);
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        walk(child, node);
      }
    } else if (value && typeof value === "object") {
      walk(value, node);
    }
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

assert.equal(byId("open-create-playlist-button")._text, "+ Create Playlist");
assert.equal(handlerModule(byId("open-create-playlist-button")), "music-player-client");
assert.equal(handlerOp(byId("open-create-playlist-button")), "open-create-playlist-modal");

const playlistFormParents = parentChain("playlist-create-form");
assert.ok(playlistFormParents.includes("create-playlist-modal"));
assert.ok(!playlistFormParents.includes("playlist-manager-panel"));
assert.ok(byId("playlists-list"), "playlist list remains on the main admin screen");

const modal = byId("create-playlist-modal");
assert.equal(modal._type, "modal");
assert.equal(modal._title, "Create Playlist");
assert.equal(modal._closable, false);
assert.equal(modal._close_on_backdrop, false);

assert.equal(byId("playlist-name-field")._required, true);
assert.equal(byId("playlist-name-field")._data_output, "music-playlist-name");
assert.equal(byId("playlist-description-field")._data_output, "music-playlist-description");
assert.equal(byId("playlist-mood-field")._data_output, "music-playlist-mood");
assert.equal(byId("create-playlist-status")._data_source, "music-create-playlist-status");

assert.equal(byId("create-playlist-modal-actions")._type, "toolbar");
assert.equal(parentChain("create-playlist-modal-actions")[0], "create-playlist-modal");
assert.equal(handlerModule(byId("cancel-create-playlist-button")), "music-player-client");
assert.equal(handlerOp(byId("cancel-create-playlist-button")), "cancel-create-playlist");
assert.equal(handlerModule(byId("create-playlist-button")), "music-player-client");
assert.equal(handlerOp(byId("create-playlist-button")), "create-playlist");

assert.equal(
  allObjects.filter((object) => Object.hasOwn(object, "_click")).length,
  0,
  "admin view should use canonical _on.click bindings"
);

assert.match(clientSource, /"open-create-playlist-modal"/);
assert.match(clientSource, /"cancel-create-playlist"/);
assert.match(clientSource, /async _open_create_playlist_modal\(\)/);
assert.match(clientSource, /async _cancel_create_playlist\(\)/);
assert.match(clientSource, /bindCreatePlaylistModalControls\(\)/);
assert.match(clientSource, /open-create-playlist-button/);
assert.match(clientSource, /create-playlist-button/);
assert.match(clientSource, /XUI\.show\("create-playlist-modal"\)/);
assert.match(clientSource, /this\.closeObject\("create-playlist-modal"\)/);
assert.match(clientSource, /this\.resetCreatePlaylistForm\(source\)/);

const createStart = clientSource.indexOf("async _create_playlist()");
const sendStart = clientSource.indexOf("const client = XUIRuntime.requireClient();", createStart);
const validationSlice = clientSource.slice(createStart, sendStart);
assert.match(validationSlice, /Playlist name is required\./);
assert.match(validationSlice, /music-create-playlist-status/);
assert.doesNotMatch(validationSlice, /music-playlist-status/);

const successSlice = clientSource.slice(
  clientSource.indexOf("const status = this.getResultMessage", createStart),
  clientSource.indexOf("_xlog.log(\"[music-player-client] playlist created", createStart)
);
assert.match(successSlice, /await this\._list_playlists\(\)/);
assert.match(successSlice, /this\.closeObject\("create-playlist-modal"\)/);
assert.match(successSlice, /this\.resetCreatePlaylistForm\(source\)/);
assert.match(successSlice, /this\.clearCreatePlaylistValidation\(source\)/);

console.log("admin create playlist modal contract verified");
