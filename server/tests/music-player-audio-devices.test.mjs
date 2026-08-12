import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";

const tempRoot = mkdtempSync(join(tmpdir(), "music-player-audio-devices-"));
const fakeBin = join(tempRoot, "bin");
const fakeMpv = join(fakeBin, "mpv");
const workFolder = join(tempRoot, "work");

await import("node:fs/promises").then((fs) => fs.mkdir(fakeBin, { recursive: true }));

writeFileSync(
  fakeMpv,
  `#!/bin/sh
if [ "$1" = "--audio-device=help" ]; then
cat <<'EOF'
List of detected audio devices:
  'auto' (Autoselect device)
  'alsa/default:CARD=Headphones' (bcm2835 Headphones)
  'pipewire/bluez_output.11_22_33_44_55_66.1' (Living Room Bluetooth)
  pulse/custom-device-id (Unquoted Device)
EOF
exit 0
fi
exit 1
`,
  "utf8"
);
chmodSync(fakeMpv, 0o755);

process.env.PATH = `${fakeBin}${delimiter}${process.env.PATH ?? ""}`;

const { MusicPlayer } = await import("../dist/modules/MusicPlayer.js");
const player = new MusicPlayer(workFolder);

await player.onLoad();

const xcmd = (_params = {}) => ({ _params });
const resultOf = (response) => (
  response?._result && typeof response._result === "object"
    ? response._result
    : response
);

const listResult = resultOf(await player._list_audio_devices(xcmd()));
assert.equal(listResult._selected, "auto");
assert.deepEqual(
  listResult._devices.map((device) => device._id),
  [
    "auto",
    "alsa/default:CARD=Headphones",
    "pipewire/bluez_output.11_22_33_44_55_66.1",
    "pulse/custom-device-id"
  ]
);
assert.equal(listResult._devices[1]._label, "bcm2835 Headphones");
assert.equal(listResult._devices[3]._label, "Unquoted Device");

const setResult = resultOf(await player._set_audio_device(xcmd({
  _audio_device: "alsa/default:CARD=Headphones"
})));
assert.equal(setResult._selected, "alsa/default:CARD=Headphones");
assert.equal(setResult._restarted, false);

const config = JSON.parse(readFileSync(join(workFolder, "config", "music-player.json"), "utf8"));
assert.equal(config._audio_device, "alsa/default:CARD=Headphones");

const getResult = resultOf(await player._get_audio_device(xcmd()));
assert.equal(getResult._audio_device, "alsa/default:CARD=Headphones");

const invalidResult = resultOf(await player._set_audio_device(xcmd({
  _audio_device: "alsa/not-visible"
})));
assert.equal(invalidResult._ok, false);
assert.equal(invalidResult._code, "E_AUDIO_DEVICE_NOT_AVAILABLE");
assert.equal(
  JSON.parse(readFileSync(join(workFolder, "config", "music-player.json"), "utf8"))._audio_device,
  "alsa/default:CARD=Headphones"
);

console.log("music-player audio device tests passed");
