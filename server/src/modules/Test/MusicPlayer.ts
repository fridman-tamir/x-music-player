import {
    _x,
    XModule,
    XCommand,
    XResponseOK,
    _xu,
    type XpellSkill,
    type XpellSkillCommand,
    _xlog
} from "@xpell/node";

import { spawn, type ChildProcess, type ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
import net from "net";
import os from "os";
import path from "path";


const xu = _xu as any;
const AUDIO_TRACK_APP_ID = "music-player";
const AUDIO_TRACK_ENV = "default";
const AUDIO_TRACK_ENTITY_ID = "audio_track";
const PLAYLIST_ENTITY_ID = "playlist";
const PLAYLIST_ITEM_ENTITY_ID = "playlist_item";
const PLAYLIST_SCHEDULE_ENTITY_ID = "playlist_schedule";
const DEFAULT_VOLUME = 45;
const SUPPORTED_AUDIO_EXTS = new Set([".mp3", ".wav", ".ogg", ".m4a"]);

type NormalizedTrack = {
    _title: string;
    _file_name: string;
    _file_path: string;
    _ext: string;
    _status: string;
};

type MpvCommandOptions = {
    retry?: boolean;
    allowed_errors?: string[];
};

type PlaylistPlaybackItem = {
    _playlist_item_id: string;
    _track_id: string;
    _title: string;
    _file_name: string;
    _file_path: string;
    _order: number;
};

export class MusicPlayer extends XModule {
    static _name = "music-player";
    static _skill: XpellSkill = {
        _id: "music-player",
        _title: "Music Player",
        _version: "1.0.0",
        _active: true,
        _type: "server-module-api",
        _requires: ["xmodule"],

        _description:
            "Music Player module provides a simple music player interface and API for managing and playing music tracks.",

        _core_rules: [
            "Use XModule for module API, skill registration, and command handling.",
        ]
    };

    static _ops: Record<string, XpellSkillCommand> = {

        "scan-music-folder": {
            _name: "scan-music-folder",
            _scope: "module",
            _description: "Scan a music folder and return the list of tracks.",
            _params: {
                _env: "Optional environment. Defaults to current client env."
            }
        },
        "list-tracks": {
            _name: "list-tracks",
            _scope: "module",
            _description: "List persisted audio tracks from XDB."
        },
        "create-playlist": {
            _name: "create-playlist",
            _scope: "module",
            _description: "Create a persisted playlist."
        },
        "update-playlist": {
            _name: "update-playlist",
            _scope: "module",
            _description: "Update allowed playlist fields.",
            _params: {
                _playlist_id: "Required playlist id.",
                _name: "Optional playlist name.",
                _description: "Optional playlist description.",
                _mood: "Optional playlist mood.",
                _status: "Optional playlist status."
            }
        },
        "list-playlists": {
            _name: "list-playlists",
            _scope: "module",
            _description: "List persisted playlists."
        },
        "add-track-to-playlist": {
            _name: "add-track-to-playlist",
            _scope: "module",
            _description: "Add an audio track to a playlist."
        },
        "list-playlist-items": {
            _name: "list-playlist-items",
            _scope: "module",
            _description: "List playlist items for a playlist."
        },
        "get-playlist-details": {
            _name: "get-playlist-details",
            _scope: "module",
            _description: "Get a playlist and resolved playlist item track details."
        },
        "start-playlist": {
            _name: "start-playlist",
            _scope: "module",
            _description: "Start playback from a persisted playlist."
        },
        "get-current-playlist-state": {
            _name: "get-current-playlist-state",
            _scope: "module",
            _description: "Get current runtime playlist playback state."
        },
        "remove-playlist-item": {
            _name: "remove-playlist-item",
            _scope: "module",
            _description: "Remove a playlist item."
        },
        "create-schedule": {
            _name: "create-schedule",
            _scope: "module",
            _description: "Create a persisted playlist schedule."
        },
        "update-schedule": {
            _name: "update-schedule",
            _scope: "module",
            _description: "Update allowed playlist schedule fields.",
            _params: {
                _schedule_id: "Required playlist_schedule id.",
                _name: "Optional schedule name.",
                _playlist_id: "Optional playlist id.",
                _days: "Optional schedule day keys.",
                _start_time: "Optional start time.",
                _end_time: "Optional end time.",
                _priority: "Optional priority.",
                _volume: "Optional volume.",
                _enabled: "Optional enabled state.",
                _shuffle: "Optional shuffle state."
            }
        },
        "list-schedules": {
            _name: "list-schedules",
            _scope: "module",
            _description: "List persisted playlist schedules."
        },
        "get-schedule-runtime-state": {
            _name: "get-schedule-runtime-state",
            _scope: "module",
            _description: "Get current runtime schedule execution state."
        },
        "set-schedule-enabled": {
            _name: "set-schedule-enabled",
            _scope: "module",
            _description: "Enable or disable a persisted playlist schedule.",
            _params: {
                _schedule_id: "Required playlist_schedule id.",
                _enabled: "Required boolean enabled state."
            }
        },
        "delete-schedule": {
            _name: "delete-schedule",
            _scope: "module",
            _description: "Delete a persisted playlist schedule."
        },
        "play-track": {
            _name: "play-track",
            _scope: "module",
            _description: "Play one local audio track with mpv.",
            _params: {
                _track_id: "Optional audio_track id.",
                _file_path: "Optional local file path inside the music folder."
            }
        },
        "next-track": {
            _name: "next-track",
            _scope: "module",
            _description: "Play the next persisted audio track, wrapping to the first track."
        },
        "previous-track": {
            _name: "previous-track",
            _scope: "module",
            _description: "Play the previous persisted audio track, wrapping to the last track."
        },
        "stop-playback": {
            _name: "stop-playback",
            _scope: "module",
            _description: "Stop current playback and keep mpv idle."
        },
        "pause-playback": {
            _name: "pause-playback",
            _scope: "module",
            _description: "Pause current playback."
        },
        "resume-playback": {
            _name: "resume-playback",
            _scope: "module",
            _description: "Resume current playback."
        },
        "set-volume": {
            _name: "set-volume",
            _scope: "module",
            _description: "Set mpv playback volume.",
            _params: {
                _volume: "Required volume number."
            }
        },
        "get-player-state": {
            _name: "get-player-state",
            _scope: "module",
            _description: "Get current runtime player state."
        },

    };

    _work_folder: string;
    _music_folder: string = "";
    private _player_process?: ChildProcessWithoutNullStreams | ChildProcess;
    private _mpv_socket_path?: string;
    private _mpv_event_socket?: net.Socket;
    private _mpv_event_socket_path = "";
    private _mpv_event_buffer = "";
    private _current_track_id = "";
    private _current_file_path = "";
    private _player_status = "stopped";
    private _current_volume = DEFAULT_VOLUME;
    private _mpv_broken_pipe_seen = false;
    private _restarting_player = false;
    private _manual_stop_requested = false;
    private _manual_replace_in_progress = false;
    private _auto_next_in_progress = false;
    private _current_playlist_id = "";
    private _current_playlist_name = "";
    private _current_playlist_items: PlaylistPlaybackItem[] = [];
    private _current_playlist_index = -1;
    private _schedule_check_running = false;
    private _last_schedule_check_at = 0;
    private _schedule_check_interval_ms = 5_000;
    private _active_schedule_id = "";
    private _active_schedule_name = "";
    private _active_schedule_playlist_id = "";

    constructor(work_folder?: string) {

        super({ _name: MusicPlayer._name });
        this._work_folder = work_folder || "work";
        this._music_folder = path.join(this._work_folder, "music");
        _xlog.log("[music-player] initialized with work folder:", this._work_folder, "music folder:", this._music_folder);
    }

    async onLoad() {
        xu.checkFolders([this._work_folder, this._music_folder])
    }

    async onFrame(frameNumber: number) {
        try {
            await super.onFrame?.(frameNumber);
        } catch (err: any) {
            _xlog.error("[music-player] onFrame super failed:", err);
        }

        const now = Date.now();

        if (
            this._schedule_check_running ||
            now - this._last_schedule_check_at < this._schedule_check_interval_ms
        ) {
            return;
        }

        this._schedule_check_running = true;
        this._last_schedule_check_at = now;

        try {
            await this.checkSchedule();
        } catch (err: any) {
            _xlog.error("[music-player] schedule check failed:", err);
        } finally {
            this._schedule_check_running = false;
        }
    }

    private unwrapEntityManagerError(response: any, fallback: string) {
        const result = response?._result;
        return (
            result?._message ??
            result?.message ??
            result?._error?._message ??
            response?._error?._message ??
            fallback
        );
    }

    private readEntityRecords(response: any) {
        const records = response?._result?._records;

        if (Array.isArray(records?._data)) {
            return records._data;
        }

        if (Array.isArray(records)) {
            return records;
        }

        if (Array.isArray(response?._result?._data)) {
            return response._result._data;
        }

        return [];
    }

    private async findAudioTrackByPath(file_path: string) {
        const response = await _x.execute({
            _module: "entity-manager",
            _op: "find",
            _params: {
                _app_id: AUDIO_TRACK_APP_ID,
                _env: AUDIO_TRACK_ENV,
                _entity: AUDIO_TRACK_ENTITY_ID,
                _filter: {
                    _file_path: file_path
                }
            }
        });

        if (!response?._ok) {
            throw new Error(
                this.unwrapEntityManagerError(
                    response,
                    `audio_track lookup failed for ${file_path}`
                )
            );
        }

        return this.readEntityRecords(response);
    }

    private async createAudioTrack(track: NormalizedTrack) {
        const response = await _x.execute({
            _module: "entity-manager",
            _op: "add",
            _params: {
                _app_id: AUDIO_TRACK_APP_ID,
                _env: AUDIO_TRACK_ENV,
                _entity: AUDIO_TRACK_ENTITY_ID,
                _data: track
            }
        });

        if (!response?._ok) {
            throw new Error(
                this.unwrapEntityManagerError(
                    response,
                    `audio_track create failed for ${track._file_path}`
                )
            );
        }

        return response?._result?._record;
    }

    private async listAudioTracks() {
        const response = await _x.execute({
            _module: "entity-manager",
            _op: "find",
            _params: {
                _app_id: AUDIO_TRACK_APP_ID,
                _env: AUDIO_TRACK_ENV,
                _entity: AUDIO_TRACK_ENTITY_ID,
                _filter: {}
            }
        });

        if (!response?._ok) {
            throw new Error(
                this.unwrapEntityManagerError(
                    response,
                    "audio_track list failed"
                )
            );
        }

        return this.readEntityRecords(response);
    }

    private fail(message: string) {
        return new XResponseOK({
            _ok: false,
            _message: message
        }).toXData();
    }

    private readParams(xcmd: XCommand) {
        return xcmd?._params ?? {};
    }

    private createInternalCommand(_op: string, _params: XCommand["_params"] = {}) {
        return new XCommand({
            _module: MusicPlayer._name,
            _op,
            _params
        });
    }

    private readRequiredString(params: any, field: string) {
        const value = params?.[field];

        return typeof value === "string" ? value.trim() : "";
    }

    private readOptionalNumber(params: any, field: string, fallback: number) {
        const value = params?.[field];

        if (value === undefined || value === null || value === "") {
            return fallback;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    private readOptionalBoolean(params: any, field: string, fallback: boolean) {
        const value = params?.[field];

        return typeof value === "boolean" ? value : fallback;
    }

    private resolveMusicFilePath(file_path: string) {
        const resolved_music_folder = path.resolve(this._music_folder);
        const resolved_file_path = path.resolve(file_path);

        if (
            resolved_file_path !== resolved_music_folder &&
            !resolved_file_path.startsWith(`${resolved_music_folder}${path.sep}`)
        ) {
            return "";
        }

        return resolved_file_path;
    }

    private createMpvSocketPath() {
        const socket_name = `xpell-mpv-${process.pid}-${Date.now()}`;

        if (process.platform === "win32") {
            return `\\\\.\\pipe\\${socket_name}`;
        }

        if (process.platform === "darwin" || process.platform === "linux") {
            return path.join("/tmp", `${socket_name}.sock`);
        }

        return path.join(os.tmpdir(), `${socket_name}.sock`);
    }

    private sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async waitForMpvSocket(socket_path: string) {
        if (process.platform === "win32") {
            await this.sleep(150);
            return;
        }

        for (let i = 0; i < 60; i += 1) {
            if (fs.existsSync(socket_path)) {
                return;
            }

            await this.sleep(50);
        }

        throw new Error("mpv IPC socket was not created.");
    }

    private clearPlayerProcess(player_process?: ChildProcessWithoutNullStreams | ChildProcess) {
        if (player_process && this._player_process !== player_process) {
            return;
        }

        this.closeMpvEventListener();
        this._player_process = undefined;
        this._mpv_socket_path = undefined;
        this.clearRuntimePlaybackState();
    }

    private clearRuntimePlaybackState() {
        this._player_status = "stopped";
        this._current_track_id = "";
        this._current_file_path = "";
    }

    private clearRuntimePlaylistState() {
        this._current_playlist_id = "";
        this._current_playlist_name = "";
        this._current_playlist_items = [];
        this._current_playlist_index = -1;
    }

    private removeMpvSocketFile(socket_path?: string) {
        if (!socket_path || process.platform === "win32") {
            return;
        }

        try {
            if (fs.existsSync(socket_path)) {
                fs.unlinkSync(socket_path);
            }
        } catch (err: any) {
            _xlog.error("[music-player] mpv IPC socket cleanup failed:", err);
        }
    }

    private async restartPlayer(reason: string) {
        if (this._restarting_player) {
            _xlog.log("[music-player] mpv restart already running:", reason);

            for (let i = 0; i < 20; i += 1) {
                if (!this._restarting_player) {
                    break;
                }

                await this.sleep(50);
            }

            if (this._restarting_player) {
                throw new Error("mpv restart is already in progress.");
            }

            return this.ensurePlayer();
        }

        this._restarting_player = true;

        try {
            const player_process = this._player_process;
            const socket_path = this._mpv_socket_path;

            _xlog.error("[music-player] restarting mpv:", reason);

            this._player_process = undefined;
            this._mpv_socket_path = undefined;
            this.closeMpvEventListener();
            this.clearRuntimePlaybackState();

            if (player_process && !player_process.killed) {
                player_process.kill();
            }

            this.removeMpvSocketFile(socket_path);

            return await this.ensurePlayer();
        } finally {
            this._restarting_player = false;
        }
    }

    private isRoutineMpvStdoutLine(line: string) {
        return /^(?:A|V|AV):\s+\d{1,2}:\d{2}:\d{2}/.test(line);
    }

    private handleBrokenPipeOutput(text: string) {
        if (!/broken pipe/i.test(text)) {
            return false;
        }

        this._mpv_broken_pipe_seen = true;
        _xlog.log("[music-player] mpv broken pipe output observed, no restart:", text);

        return true;
    }

    private logMpvStdout(chunk: Buffer | string) {
        const lines = String(chunk)
            .split(/\r?\n|\r/g)
            .map((line) => line.trim())
            .filter(Boolean);

        for (const line of lines) {
            if (this.isRoutineMpvStdoutLine(line)) {
                continue;
            }

            _xlog.log("[music-player] mpv stdout:", line);
            this.handleBrokenPipeOutput(line);
        }
    }

    private closeMpvEventListener() {
        const socket = this._mpv_event_socket;

        this._mpv_event_socket = undefined;
        this._mpv_event_socket_path = "";
        this._mpv_event_buffer = "";

        if (socket && !socket.destroyed) {
            socket.destroy();
        }
    }

    private startMpvEventListener(socket_path: string) {
        if (
            this._mpv_event_socket &&
            !this._mpv_event_socket.destroyed &&
            this._mpv_event_socket_path === socket_path
        ) {
            return;
        }

        this.closeMpvEventListener();

        const socket = net.createConnection(socket_path);

        this._mpv_event_socket = socket;
        this._mpv_event_socket_path = socket_path;
        this._mpv_event_buffer = "";

        socket.setEncoding("utf8");

        socket.on("connect", () => {
            _xlog.log("[music-player] mpv IPC event listener ready:", socket_path);
        });

        socket.on("data", (chunk) => {
            if (this._mpv_event_socket !== socket) {
                return;
            }

            this._mpv_event_buffer += chunk;

            while (this._mpv_event_buffer.includes("\n")) {
                const newline_index = this._mpv_event_buffer.indexOf("\n");
                const line = this._mpv_event_buffer.slice(0, newline_index).trim();
                this._mpv_event_buffer = this._mpv_event_buffer.slice(newline_index + 1);

                if (!line) {
                    continue;
                }

                try {
                    this.handleMpvIpcMessage(JSON.parse(line), "event-listener");
                } catch (err: any) {
                    _xlog.error("[music-player] mpv IPC event parse failed:", {
                        _message: err?.message ?? String(err),
                        _line: line
                    });
                }
            }
        });

        socket.on("error", (err) => {
            if (this._mpv_event_socket === socket) {
                _xlog.error("[music-player] mpv IPC event listener error:", err);
            }
        });

        socket.on("close", () => {
            if (this._mpv_event_socket !== socket) {
                return;
            }

            this._mpv_event_socket = undefined;
            this._mpv_event_socket_path = "";
            this._mpv_event_buffer = "";
            _xlog.log("[music-player] mpv IPC event listener closed.");
        });
    }

    private handleMpvIpcMessage(message: any, source: string) {
        if (!message || typeof message !== "object") {
            return;
        }

        if (message.event) {
            _xlog.log("[music-player] mpv IPC event:", {
                _source: source,
                _event: message.event,
                _reason: message.reason ?? ""
            });
        }

        if (message.event === "end-file") {
            void this.handleMpvEndFileEvent(message);
        }
    }

    private async handleMpvEndFileEvent(event: any) {
        const reason = typeof event?.reason === "string" ? event.reason : "";

        _xlog.log("[music-player] end-file event received:", {
            _reason: reason,
            _manual_stop_requested: this._manual_stop_requested,
            _manual_replace_in_progress: this._manual_replace_in_progress,
            _auto_next_in_progress: this._auto_next_in_progress
        });

        if (reason !== "eof") {
            _xlog.log("[music-player] ignored end-file reason:", reason);
            return;
        }

        if (this._manual_stop_requested || this._manual_replace_in_progress) {
            _xlog.log("[music-player] ignored end-file during manual player action:", {
                _manual_stop_requested: this._manual_stop_requested,
                _manual_replace_in_progress: this._manual_replace_in_progress
            });
            return;
        }

        if (this._auto_next_in_progress) {
            _xlog.log("[music-player] ignored duplicate end-file while auto-next is running.");
            return;
        }

        if (this._current_playlist_items.length === 0) {
            this._player_status = "stopped";
            this._current_track_id = "";
            this._current_file_path = "";
            _xlog.log("[music-player] end-file eof stopped playback without active playlist.");
            return;
        }

        this._auto_next_in_progress = true;
        _xlog.log("[music-player] auto-next starting:", {
            _playlist_id: this._current_playlist_id,
            _current_index: this._current_playlist_index,
            _playlist_count: this._current_playlist_items.length
        });

        try {
            const result = await this._next_track(
                this.createInternalCommand("next-track", {
                    _auto_next: true
                })
            );

            if (this.isFailureResponse(result)) {
                const result_data = this.readResponseResult(result);
                throw new Error(result_data?._message ?? "Auto-next failed.");
            }

            _xlog.log("[music-player] auto-next success:", this.readResponseResult(result));
        } catch (err: any) {
            _xlog.error("[music-player] auto-next failed:", err);
            this._player_status = "stopped";
            this._current_track_id = "";
            this._current_file_path = "";
        } finally {
            this._auto_next_in_progress = false;
        }
    }

    private async runWithManualReplace<T>(operation: () => Promise<T>) {
        const previous_manual_replace = this._manual_replace_in_progress;

        this._manual_replace_in_progress = true;

        try {
            return await operation();
        } finally {
            this._manual_replace_in_progress = previous_manual_replace;
        }
    }

    private async ensurePlayer() {
        if (this._player_process && this._mpv_socket_path) {
            this.startMpvEventListener(this._mpv_socket_path);

            return {
                _ready: true,
                _socket_path: this._mpv_socket_path
            };
        }

        const socket_path = this.createMpvSocketPath();

        this.removeMpvSocketFile(socket_path);

        const args = [
            "--idle=yes",
            "--no-video",
            `--input-ipc-server=${socket_path}`
        ];
        const player_process = spawn("mpv", args);

        this._player_process = player_process;
        this._mpv_socket_path = socket_path;

        _xlog.log("[music-player] mpv spawn:", {
            _socket_path: socket_path,
            _args: args,
            _pid: player_process.pid
        });

        player_process.stdout?.on("data", (chunk) => {
            this.logMpvStdout(chunk);
        });

        player_process.stderr?.on("data", (chunk) => {
            const message = String(chunk).trim();

            _xlog.error("[music-player] mpv stderr:", message);
            this.handleBrokenPipeOutput(message);
        });

        player_process.on("exit", (code, signal) => {
            this.clearPlayerProcess(player_process);
            _xlog.log("[music-player] mpv exited:", {
                _code: code,
                _signal: signal
            });
        });

        player_process.on("error", (err) => {
            this.clearPlayerProcess(player_process);
            _xlog.error("[music-player] mpv error:", err);
        });

        await new Promise<void>((resolve, reject) => {
            player_process.once("spawn", () => resolve());
            player_process.once("error", reject);
        });

        await this.waitForMpvSocket(socket_path);
        this.startMpvEventListener(socket_path);

        _xlog.log("[music-player] mpv IPC ready:", socket_path);

        return {
            _ready: true,
            _socket_path: socket_path
        };
    }

    private async sendMpvCommand(command: any[], options: MpvCommandOptions = {}) {
        const retry = options.retry !== false;

        try {
            return await this.sendMpvCommandOnce(command, options);
        } catch (err: any) {
            if (!retry) {
                throw err;
            }

            const message = err?.message ?? String(err);

            _xlog.error("[music-player] mpv IPC command failed, restarting:", {
                _command: command,
                _message: message
            });

            await this.restartPlayer(`mpv IPC command failed: ${message}`);

            return this.sendMpvCommandOnce(command, options);
        }
    }

    private async sendMpvCommandOnce(command: any[], options: MpvCommandOptions = {}) {
        await this.ensurePlayer();

        const socket_path = this._mpv_socket_path;

        if (!socket_path) {
            throw new Error("mpv IPC socket is not ready.");
        }

        _xlog.log("[music-player] mpv IPC command:", command);

        return new Promise<any>((resolve, reject) => {
            const socket = net.createConnection(socket_path);
            let buffer = "";
            let done = false;

            const finish = (err?: Error, data?: any) => {
                if (done) {
                    return;
                }

                done = true;
                socket.destroy();

                if (err) {
                    reject(err);
                    return;
                }

                _xlog.log("[music-player] mpv IPC parsed response:", data);
                resolve(data);
            };

            socket.setEncoding("utf8");
            socket.setTimeout(2000);

            socket.on("connect", () => {
                try {
                    socket.write(`${JSON.stringify({ command })}\n`);
                } catch (err: any) {
                    finish(new Error(`mpv IPC socket write failed: ${err?.message ?? String(err)}`));
                }
            });

            socket.on("data", (chunk) => {
                buffer += chunk;

                while (buffer.includes("\n")) {
                    const newline_index = buffer.indexOf("\n");
                    const line = buffer.slice(0, newline_index).trim();
                    buffer = buffer.slice(newline_index + 1);

                    if (!line) {
                        continue;
                    }

                    _xlog.log("[music-player] mpv IPC raw response:", line);

                    try {
                        const response = JSON.parse(line);

                        if (typeof response?.error !== "string") {
                            this.handleMpvIpcMessage(response, "command");
                            continue;
                        }

                        if (response.error !== "success") {
                            if (options.allowed_errors?.includes(response.error)) {
                                finish(undefined, response);
                                return;
                            }

                            _xlog.error("[music-player] mpv IPC command error:", response);
                            finish(new Error(`mpv command failed: ${response.error}`));
                            return;
                        }

                        finish(undefined, response);
                    } catch (err: any) {
                        finish(new Error(`mpv IPC response parse failed: ${err?.message ?? String(err)}`));
                    }
                }
            });

            socket.on("timeout", () => {
                finish(new Error("mpv IPC command timed out."));
            });

            socket.on("error", (err) => {
                finish(err);
            });

            socket.on("close", () => {
                finish(new Error("mpv IPC socket closed."));
            });
        });
    }

    private async getMpvProperty(property_name: string) {
        const response = await this.sendMpvCommand(["get_property", property_name]);

        return response?.data;
    }

    private async getMpvPropertySafe(property_name: string, fallback: any) {
        const response = await this.sendMpvCommand(
            ["get_property", property_name],
            {
                allowed_errors: ["property unavailable"]
            }
        );

        if (response?.error === "property unavailable") {
            return fallback;
        }

        return response?.data ?? fallback;
    }

    private stoppedPlayerState(volume = this._current_volume) {
        this._player_status = "stopped";
        this._current_track_id = "";
        this._current_file_path = "";

        return new XResponseOK({
            _status: "stopped",
            _track_id: "",
            _file_path: "",
            _position_sec: 0,
            _duration_sec: 0,
            _percent: 0,
            _volume: volume
        }).toXData();
    }

    private async runPlayTrackSequence(file_path: string) {
        await this.ensurePlayer();
        await this.sendMpvCommand(["loadfile", file_path, "replace"], { retry: false });
        await this.sendMpvCommand(["set_property", "pause", false], { retry: false });
    }

    private normalizeMpvPath(file_path: string) {
        return file_path ? path.resolve(file_path) : "";
    }

    private async verifyPlayTrackPath(expected_file_path: string) {
        const mpv_path = await this.getMpvPropertySafe("path", "");
        const actual_file_path = typeof mpv_path === "string" ? mpv_path : "";
        const expected = this.normalizeMpvPath(expected_file_path);
        const actual = this.normalizeMpvPath(actual_file_path);
        const matched = Boolean(expected && actual && expected === actual);

        _xlog.log("[music-player] play-track verify path:", {
            _expected_file_path: expected,
            _actual_file_path: actual,
            _matched: matched
        });

        return matched;
    }

    private toFiniteNumber(value: any, fallback = 0) {
        const parsed = Number(value);

        return Number.isFinite(parsed) ? parsed : fallback;
    }

    private readRecordString(record: any, field: string) {
        const value = record?.[field];

        return typeof value === "string" ? value.trim() : "";
    }

    private readResponseResult(response: any) {
        return response?._result && typeof response._result === "object"
            ? response._result
            : response;
    }

    private isFailureResponse(response: any) {
        return response?._ok === false || this.readResponseResult(response)?._ok === false;
    }

    private compareTrackStrings(a: string, b: string) {
        return a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: "base"
        });
    }

    private sortAudioTrackRecords(tracks: any[]) {
        return [...tracks].sort((a, b) => {
            const a_title = this.readRecordString(a, "_title");
            const b_title = this.readRecordString(b, "_title");
            const a_file_name = this.readRecordString(a, "_file_name");
            const b_file_name = this.readRecordString(b, "_file_name");
            const a_sort = a_title || a_file_name;
            const b_sort = b_title || b_file_name;
            const primary = this.compareTrackStrings(a_sort, b_sort);

            if (primary !== 0) {
                return primary;
            }

            const secondary = this.compareTrackStrings(a_file_name, b_file_name);

            if (secondary !== 0) {
                return secondary;
            }

            return this.compareTrackStrings(
                this.readRecordString(a, "_id"),
                this.readRecordString(b, "_id")
            );
        });
    }

    private findCurrentTrackIndex(tracks: any[]) {
        if (this._current_track_id) {
            return tracks.findIndex(
                (track) => this.readRecordString(track, "_id") === this._current_track_id
            );
        }

        if (this._current_file_path) {
            const current_file_path = path.resolve(this._current_file_path);

            return tracks.findIndex((track) => {
                const file_path = this.readRecordString(track, "_file_path");

                return file_path ? path.resolve(file_path) === current_file_path : false;
            });
        }

        return -1;
    }

    private async playTrackRecord(track: any, wrapped: boolean, playlist_playback = false) {
        const track_id =
            this.readRecordString(track, "_id") ||
            this.readRecordString(track, "_track_id");
        const file_path = this.readRecordString(track, "_file_path");
        const title =
            this.readRecordString(track, "_title") ||
            this.readRecordString(track, "_file_name") ||
            "Playing track";
        const result = await this._play_track(
            this.createInternalCommand(
                "play-track",
                track_id
                    ? { _track_id: track_id, _playlist_playback: playlist_playback }
                    : { _file_path: file_path, _playlist_playback: playlist_playback }
            )
        );
        const result_data = this.readResponseResult(result);

        if (this.isFailureResponse(result)) {
            return result;
        }

        return new XResponseOK({
            _message: "Playing track.",
            _status: "playing",
            _track_id: this.readRecordString(result_data, "_track_id") || track_id,
            _file_path: this.readRecordString(result_data, "_file_path") || file_path,
            _title: title,
            _wrapped: wrapped
        }).toXData();
    }

    private getPlaylistStateData() {
        return {
            _playlist_id: this._current_playlist_id,
            _playlist_name: this._current_playlist_name,
            _playlist_index: this._current_playlist_index,
            _playlist_count: this._current_playlist_items.length,
            _items: this._current_playlist_items
        };
    }

    private getActivePlaylistResultFields() {
        if (this._current_playlist_items.length === 0) {
            return {};
        }

        return {
            _playlist_id: this._current_playlist_id,
            _playlist_name: this._current_playlist_name,
            _playlist_index: this._current_playlist_index,
            _playlist_count: this._current_playlist_items.length
        };
    }

    private async playPlaylistIndex(index: number, wrapped: boolean) {
        const item = this._current_playlist_items[index];

        if (!item) {
            return this.fail("Playlist track not found.");
        }

        const result = await this.playTrackRecord(item, wrapped, true);
        const result_data = this.readResponseResult(result);

        if (this.isFailureResponse(result)) {
            return result;
        }

        this._current_playlist_index = index;

        return new XResponseOK({
            ...result_data,
            _message: "Playing track.",
            _status: "playing",
            _playlist_id: this._current_playlist_id,
            _playlist_name: this._current_playlist_name,
            _playlist_index: this._current_playlist_index,
            _playlist_count: this._current_playlist_items.length,
            _track_id: item._track_id,
            _title: item._title,
            _file_path: item._file_path,
            _wrapped: wrapped
        }).toXData();
    }

    private async loadPlayablePlaylist(playlist_id: string) {
        const playlists = await this.findEntityRecords(PLAYLIST_ENTITY_ID, {
            _id: playlist_id
        });
        const playlist = playlists[0] ?? null;

        if (!playlist) {
            return {
                playlist: null,
                items: [] as PlaylistPlaybackItem[]
            };
        }

        const playlist_items = await this.findEntityRecords(PLAYLIST_ITEM_ENTITY_ID, {
            _playlist_id: playlist_id
        });
        const track_cache = new Map<string, any>();
        const items: PlaylistPlaybackItem[] = [];

        const sorted_playlist_items = playlist_items
            .filter((item: any) => item?._enabled !== false)
            .sort((a: any, b: any) => Number(a?._order ?? 0) - Number(b?._order ?? 0));

        for (const playlist_item of sorted_playlist_items) {
            const track_id = this.readRecordString(playlist_item, "_track_id");

            if (!track_id) {
                continue;
            }

            let track = track_cache.get(track_id);

            if (!track_cache.has(track_id)) {
                const tracks = await this.findEntityRecords(AUDIO_TRACK_ENTITY_ID, {
                    _id: track_id
                });
                track = tracks[0] ?? null;
                track_cache.set(track_id, track);
            }

            const file_path = this.readRecordString(track, "_file_path");
            const resolved_file_path = file_path ? this.resolveMusicFilePath(file_path) : "";

            if (!resolved_file_path || !fs.existsSync(resolved_file_path)) {
                continue;
            }

            const stat = fs.statSync(resolved_file_path);
            const ext = path.extname(resolved_file_path).toLowerCase();

            if (!stat.isFile() || !SUPPORTED_AUDIO_EXTS.has(ext)) {
                continue;
            }

            items.push({
                _playlist_item_id: this.readRecordString(playlist_item, "_id"),
                _track_id: track_id,
                _title:
                    this.readRecordString(track, "_title") ||
                    this.readRecordString(track, "_file_name") ||
                    "Playing track",
                _file_name: this.readRecordString(track, "_file_name"),
                _file_path: resolved_file_path,
                _order: this.toFiniteNumber(playlist_item?._order, 0)
            });
        }

        items.sort((a, b) => a._order - b._order);

        return {
            playlist,
            items
        };
    }

    private async findEntityRecords(entity_id: string, filter: any = {}) {
        const response = await _x.execute({
            _module: "entity-manager",
            _op: "find",
            _params: {
                _app_id: AUDIO_TRACK_APP_ID,
                _env: AUDIO_TRACK_ENV,
                _entity: entity_id,
                _filter: filter
            }
        });

        if (!response?._ok) {
            throw new Error(
                this.unwrapEntityManagerError(
                    response,
                    `${entity_id} lookup failed`
                )
            );
        }

        return this.readEntityRecords(response);
    }

    private async createEntityRecord(entity_id: string, data: any) {
        const response = await _x.execute({
            _module: "entity-manager",
            _op: "add",
            _params: {
                _app_id: AUDIO_TRACK_APP_ID,
                _env: AUDIO_TRACK_ENV,
                _entity: entity_id,
                _data: data
            }
        });

        if (!response?._ok) {
            throw new Error(
                this.unwrapEntityManagerError(
                    response,
                    `${entity_id} create failed`
                )
            );
        }

        return response?._result?._record;
    }

    private async updateEntityRecords(entity_id: string, filter: any, updates: any) {
        const response = await _x.execute({
            _module: "entity-manager",
            _op: "update",
            _params: {
                _app_id: AUDIO_TRACK_APP_ID,
                _env: AUDIO_TRACK_ENV,
                _entity: entity_id,
                _filter: filter,
                _updates: updates
            }
        });

        if (!response?._ok) {
            throw new Error(
                this.unwrapEntityManagerError(
                    response,
                    `${entity_id} update failed`
                )
            );
        }

        return response?._result;
    }

    private async deleteEntityRecords(entity_id: string, filter: any) {
        const response = await _x.execute({
            _module: "entity-manager",
            _op: "delete",
            _params: {
                _app_id: AUDIO_TRACK_APP_ID,
                _env: AUDIO_TRACK_ENV,
                _entity: entity_id,
                _filter: filter
            }
        });

        if (!response?._ok) {
            throw new Error(
                this.unwrapEntityManagerError(
                    response,
                    `${entity_id} delete failed`
                )
            );
        }

        return response?._result;
    }

    private getCurrentDayKey(date = new Date()) {
        return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][date.getDay()] ?? "";
    }

    private getCurrentHHmm(date = new Date()) {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${hours}:${minutes}`;
    }

    private scheduleMatchesDay(schedule: any, day_key: string) {
        const days = Array.isArray(schedule?._days) ? schedule._days : [];

        return days.includes(day_key);
    }

    private scheduleMatchesTime(schedule: any, current_time: string) {
        const start_time = this.readRecordString(schedule, "_start_time");
        const end_time = this.readRecordString(schedule, "_end_time");

        return Boolean(start_time && end_time && current_time >= start_time && current_time < end_time);
    }

    private chooseHighestPrioritySchedule(schedules: any[]) {
        return schedules.sort((a, b) => {
            const priority_delta = this.toFiniteNumber(b?._priority, 0) - this.toFiniteNumber(a?._priority, 0);

            if (priority_delta !== 0) {
                return priority_delta;
            }

            return this.readRecordString(a, "_id").localeCompare(this.readRecordString(b, "_id"));
        })[0] ?? null;
    }

    private clearActiveScheduleState() {
        this._active_schedule_id = "";
        this._active_schedule_name = "";
        this._active_schedule_playlist_id = "";
    }

    private buildScheduleLabel(schedule_name: string, playlist_name: string) {
        if (schedule_name && playlist_name) {
            return `${schedule_name} · ${playlist_name}`;
        }

        return schedule_name || playlist_name || "-";
    }

    private findNextScheduleLabel(schedules: any[], playlist_names: Map<any, any>, now: Date) {
        const day_key = this.getCurrentDayKey(now);
        const current_time = this.getCurrentHHmm(now);
        const next_schedule = schedules
            .filter((schedule: any) => {
                const start_time = this.readRecordString(schedule, "_start_time");

                return schedule?._enabled !== false &&
                    this.scheduleMatchesDay(schedule, day_key) &&
                    Boolean(start_time) &&
                    start_time > current_time;
            })
            .sort((a: any, b: any) => {
                const start_delta = this.readRecordString(a, "_start_time")
                    .localeCompare(this.readRecordString(b, "_start_time"));

                if (start_delta !== 0) {
                    return start_delta;
                }

                const priority_delta = this.toFiniteNumber(b?._priority, 0) - this.toFiniteNumber(a?._priority, 0);

                if (priority_delta !== 0) {
                    return priority_delta;
                }

                return this.readRecordString(a, "_id").localeCompare(this.readRecordString(b, "_id"));
            })[0] ?? null;

        if (!next_schedule) {
            return "-";
        }

        const schedule_name = this.readRecordString(next_schedule, "_name") ||
            String(playlist_names.get(next_schedule?._playlist_id) ?? "").trim() ||
            "Schedule";
        const start_time = this.readRecordString(next_schedule, "_start_time");

        return `${schedule_name} · ${start_time}`;
    }

    private async getScheduleRuntimeState() {
        const now = Date.now();
        const elapsed = this._last_schedule_check_at > 0
            ? now - this._last_schedule_check_at
            : this._schedule_check_interval_ms;
        const schedules = await this.findEntityRecords(PLAYLIST_SCHEDULE_ENTITY_ID);
        const playlists = await this.findEntityRecords(PLAYLIST_ENTITY_ID);
        const playlist_names = new Map(
            playlists.map((playlist: any) => [playlist?._id, playlist?._name ?? ""])
        );
        const active_schedule = this._active_schedule_id
            ? schedules.find((schedule: any) => schedule?._id === this._active_schedule_id)
            : null;
        const active_schedule_name = this._active_schedule_name ||
            this.readRecordString(active_schedule, "_name");
        const active_playlist_name = this._current_playlist_name ||
            String(playlist_names.get(this._active_schedule_playlist_id) ?? "").trim();
        const has_active_schedule = Boolean(this._active_schedule_id);
        const active_label = has_active_schedule
            ? this.buildScheduleLabel(active_schedule_name, active_playlist_name)
            : "-";

        return {
            _active_schedule_id: this._active_schedule_id,
            _active_schedule_name: active_schedule_name,
            _active_schedule_playlist_id: this._active_schedule_playlist_id,
            _active_playlist_id: this._current_playlist_id,
            _active_playlist_name: active_playlist_name,
            _last_schedule_check_at: this._last_schedule_check_at,
            _next_schedule_check_in_ms: Math.max(0, this._schedule_check_interval_ms - elapsed),
            _active_label: active_label,
            _next_label: this.findNextScheduleLabel(schedules, playlist_names, new Date(now)),
            _status_label: has_active_schedule ? "Schedule active" : "No active schedule"
        };
    }

    private async checkSchedule() {
        // _xlog.log("[music-player] schedule check started:", {
        //     _active_schedule_id: this._active_schedule_id
        // });

        const now = new Date();
        const day_key = this.getCurrentDayKey(now);
        const current_time = this.getCurrentHHmm(now);
        const schedules = await this.findEntityRecords(PLAYLIST_SCHEDULE_ENTITY_ID);
        const matching_schedules = schedules.filter((schedule: any) => (
            schedule?._enabled !== false &&
            this.scheduleMatchesDay(schedule, day_key) &&
            this.scheduleMatchesTime(schedule, current_time)
        ));
        const matching_schedule = this.chooseHighestPrioritySchedule(matching_schedules);

        if (!matching_schedule) {
            // _xlog.log("[music-player] no matching schedule:", {
            //     _day: day_key,
            //     _time: current_time
            // });

            if (this._active_schedule_id) {
                const ended_schedule_id = this._active_schedule_id;
                const ended_schedule_name = this._active_schedule_name;

                await this._stop_playback(
                    this.createInternalCommand("stop-playback", {
                        _preserve_schedule: true
                    })
                );
                this.clearActiveScheduleState();

                _xlog.log("[music-player] schedule ended:", {
                    _schedule_id: ended_schedule_id,
                    _schedule_name: ended_schedule_name
                });
            }

            return;
        }

        const schedule_id = this.readRecordString(matching_schedule, "_id");
        const schedule_name = this.readRecordString(matching_schedule, "_name");
        const playlist_id = this.readRecordString(matching_schedule, "_playlist_id");

        _xlog.log("[music-player] matching schedule found:", {
            _schedule_id: schedule_id,
            _schedule_name: schedule_name,
            _playlist_id: playlist_id,
            _day: day_key,
            _time: current_time
        });

        if (schedule_id && schedule_id === this._active_schedule_id) {
            _xlog.log("[music-player] schedule unchanged:", {
                _schedule_id: schedule_id,
                _schedule_name: schedule_name
            });
            return;
        }

        if (matching_schedule?._volume !== undefined && matching_schedule?._volume !== null && matching_schedule?._volume !== "") {
            const volume = Number(matching_schedule._volume);

            if (Number.isFinite(volume)) {
                const volume_result = await this._set_volume(
                    this.createInternalCommand("set-volume", {
                        _volume: volume
                    })
                );

                if (this.isFailureResponse(volume_result)) {
                    const result_data = this.readResponseResult(volume_result);
                    throw new Error(result_data?._message ?? "Schedule volume set failed.");
                }
            }
        }

        const playlist_result = await this._start_playlist(
            this.createInternalCommand("start-playlist", {
                _playlist_id: playlist_id
            })
        );

        if (this.isFailureResponse(playlist_result)) {
            const result_data = this.readResponseResult(playlist_result);
            throw new Error(result_data?._message ?? "Schedule playlist start failed.");
        }

        this._active_schedule_id = schedule_id;
        this._active_schedule_name = schedule_name;
        this._active_schedule_playlist_id = playlist_id;

        _xlog.log("[music-player] schedule started:", {
            _schedule_id: this._active_schedule_id,
            _schedule_name: this._active_schedule_name,
            _playlist_id: this._active_schedule_playlist_id
        });
    }

    async _scan_music_folder(xcmd: XCommand) {
        const music_folder = this._music_folder;

        try {
            const tracks: NormalizedTrack[] = [];
            let skipped = 0;
            let created = 0;
            let existing = 0;

            _xlog.log("[music-player] scan started:", music_folder);

            const entries = fs.existsSync(music_folder)
                ? fs.readdirSync(music_folder, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
                : [];

            _xlog.log("[music-player] entries found:", entries.length);

            for (const entry of entries) {
                const file = entry.name;
                const ext = path.extname(file).toLowerCase();

                if (!file || file.startsWith(".") || !entry.isFile() || !SUPPORTED_AUDIO_EXTS.has(ext)) {
                    skipped += 1;
                    continue;
                }

                const base = path.basename(file, ext);
                const title = base
                    .replace(/[_-]+/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();

                tracks.push({
                    _title: title || file,
                    _file_name: file,
                    _file_path: path.join(music_folder, file),
                    _ext: ext,
                    _status: "ready"
                });
            }

            _xlog.log("[music-player] audio files found:", tracks.length);

            for (const track of tracks) {
                const existing_tracks = await this.findAudioTrackByPath(track._file_path);

                if (existing_tracks.length > 0) {
                    existing += 1;
                    _xlog.log("[music-player] existing track:", track._file_path);
                    continue;
                }

                await this.createAudioTrack(track);
                created += 1;
                _xlog.log("[music-player] created track:", track._file_path);
            }

            const res = {
                _message: `Found ${tracks.length} audio files.`,
                _music_folder: music_folder,
                _scanned: tracks.length,
                _created: created,
                _existing: existing,
                _skipped: skipped,
                _tracks: tracks
            };

            _xlog.log("[music-player] scan summary:", {
                _scanned: tracks.length,
                _created: created,
                _existing: existing,
                _skipped: skipped
            });
            _xlog.log("[music-player] scan result:", res);

            return new XResponseOK(res).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] scan failed:", err);

            return new XResponseOK({
                _ok: false,
                _message: `Scan music folder failed: ${err?.message ?? String(err)}`,
                _music_folder: music_folder,
                _scanned: 0,
                _created: 0,
                _existing: 0,
                _skipped: 0,
                _tracks: []
            }).toXData();
        }
    }

    async _list_tracks(xcmd: XCommand) {
        try {
            const tracks = await this.listAudioTracks();

            _xlog.log("[music-player] list-tracks count:", tracks.length);
            _xlog.log("[music-player] tracks listed:", tracks.length);

            return new XResponseOK({
                _tracks: tracks,
                _count: tracks.length
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] list tracks failed:", err);

            return new XResponseOK({
                _ok: false,
                _message: `List tracks failed: ${err?.message ?? String(err)}`,
                _tracks: []
            }).toXData();
        }
    }

    async _create_playlist(xcmd: XCommand) {
        try {
            const params = this.readParams(xcmd);
            const name = this.readRequiredString(params, "_name");

            if (!name) {
                return this.fail("Playlist name is required.");
            }

            const playlist = await this.createEntityRecord(PLAYLIST_ENTITY_ID, {
                _name: name,
                ...(params._description ? { _description: String(params._description) } : {}),
                ...(params._mood ? { _mood: String(params._mood) } : {}),
                _status: typeof params._status === "string" && params._status.trim()
                    ? params._status.trim()
                    : "active"
            });

            _xlog.log("[music-player] playlist created:", playlist?._id);

            return new XResponseOK({
                _playlist: playlist,
                _message: "Playlist created."
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] create playlist failed:", err);

            return this.fail(`Create playlist failed: ${err?.message ?? String(err)}`);
        }
    }

    async _list_playlists(xcmd: XCommand) {
        try {
            const playlists = await this.findEntityRecords(PLAYLIST_ENTITY_ID);

            _xlog.log("[music-player] playlists listed:", playlists.length);

            return new XResponseOK({
                _playlists: playlists
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] list playlists failed:", err);

            return new XResponseOK({
                _ok: false,
                _message: `List playlists failed: ${err?.message ?? String(err)}`,
                _playlists: []
            }).toXData();
        }
    }

    async _update_playlist(xcmd: XCommand) {
        try {
            const params = this.readParams(xcmd);
            const playlist_id = this.readRequiredString(params, "_playlist_id");

            if (!playlist_id) {
                return this.fail("Playlist id is required.");
            }

            const playlists = await this.findEntityRecords(PLAYLIST_ENTITY_ID, {
                _id: playlist_id
            });

            if (playlists.length === 0) {
                return this.fail("Playlist not found.");
            }

            const updates: Record<string, string> = {};
            const allowed_fields = ["_name", "_description", "_mood", "_status"];

            for (const field of allowed_fields) {
                if (!Object.prototype.hasOwnProperty.call(params, field)) {
                    continue;
                }

                const value = typeof params[field] === "string"
                    ? params[field].trim()
                    : String(params[field] ?? "").trim();

                if (field === "_name" && !value) {
                    return this.fail("Playlist name cannot be empty.");
                }

                updates[field] = value;
            }

            const update_result = Object.keys(updates).length > 0
                ? await this.updateEntityRecords(PLAYLIST_ENTITY_ID, { _id: playlist_id }, updates)
                : {};
            const updated_playlist =
                update_result?._record ??
                update_result?._playlist ??
                update_result?._records?._data?.[0] ??
                update_result?._records?.[0] ??
                (await this.findEntityRecords(PLAYLIST_ENTITY_ID, { _id: playlist_id }))[0] ??
                null;

            _xlog.log("[music-player] playlist updated:", playlist_id);

            return new XResponseOK({
                _playlist: updated_playlist,
                _playlist_id: playlist_id,
                _message: "Playlist updated."
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] update playlist failed:", err);

            return this.fail(`Update playlist failed: ${err?.message ?? String(err)}`);
        }
    }

    async _add_track_to_playlist(xcmd: XCommand) {
        try {
            const params = this.readParams(xcmd);
            const playlist_id = this.readRequiredString(params, "_playlist_id");
            const track_id = this.readRequiredString(params, "_track_id");

            if (!playlist_id) {
                return this.fail("Playlist id is required.");
            }

            if (!track_id) {
                return this.fail("Track id is required.");
            }

            const playlists = await this.findEntityRecords(PLAYLIST_ENTITY_ID, {
                _id: playlist_id
            });

            if (playlists.length === 0) {
                return this.fail("Playlist not found.");
            }

            const tracks = await this.findEntityRecords(AUDIO_TRACK_ENTITY_ID, {
                _id: track_id
            });

            if (tracks.length === 0) {
                return this.fail("Track not found.");
            }

            const playlist_items = await this.findEntityRecords(PLAYLIST_ITEM_ENTITY_ID, {
                _playlist_id: playlist_id
            });
            const duplicate = playlist_items.find((item: any) => item?._track_id === track_id);

            if (duplicate) {
                return new XResponseOK({
                    _ok: false,
                    _playlist_item: duplicate,
                    _message: "Track already exists in playlist."
                }).toXData();
            }

            const max_order = playlist_items.reduce((max: number, item: any) => {
                const order = Number(item?._order);
                return Number.isFinite(order) && order > max ? order : max;
            }, -1);
            const playlist_item = await this.createEntityRecord(PLAYLIST_ITEM_ENTITY_ID, {
                _playlist_id: playlist_id,
                _track_id: track_id,
                _order: max_order + 1,
                _enabled: true
            });

            _xlog.log("[music-player] track added to playlist:", {
                _playlist_id: playlist_id,
                _track_id: track_id,
                _playlist_item_id: playlist_item?._id
            });

            return new XResponseOK({
                _playlist_item: playlist_item,
                _message: "Track added to playlist."
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] add track to playlist failed:", err);

            return this.fail(`Add track to playlist failed: ${err?.message ?? String(err)}`);
        }
    }

    async _list_playlist_items(xcmd: XCommand) {
        try {
            const params = this.readParams(xcmd);
            const playlist_id = this.readRequiredString(params, "_playlist_id");

            if (!playlist_id) {
                return new XResponseOK({
                    _ok: false,
                    _message: "Playlist id is required.",
                    _playlist_items: []
                }).toXData();
            }

            const playlist_items = await this.findEntityRecords(PLAYLIST_ITEM_ENTITY_ID, {
                _playlist_id: playlist_id
            });
            playlist_items.sort((a: any, b: any) => Number(a?._order ?? 0) - Number(b?._order ?? 0));

            _xlog.log("[music-player] playlist items listed:", playlist_items.length);

            return new XResponseOK({
                _playlist_items: playlist_items
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] list playlist items failed:", err);

            return new XResponseOK({
                _ok: false,
                _message: `List playlist items failed: ${err?.message ?? String(err)}`,
                _playlist_items: []
            }).toXData();
        }
    }

    async _get_playlist_details(xcmd: XCommand) {
        try {
            const params = this.readParams(xcmd);
            const playlist_id = this.readRequiredString(params, "_playlist_id");

            if (!playlist_id) {
                return new XResponseOK({
                    _ok: false,
                    _message: "Playlist id is required.",
                    _playlist: null,
                    _items: []
                }).toXData();
            }

            const playlists = await this.findEntityRecords(PLAYLIST_ENTITY_ID, {
                _id: playlist_id
            });

            if (playlists.length === 0) {
                return new XResponseOK({
                    _ok: false,
                    _message: "Playlist not found.",
                    _playlist: null,
                    _items: []
                }).toXData();
            }

            const playlist_items = await this.findEntityRecords(PLAYLIST_ITEM_ENTITY_ID, {
                _playlist_id: playlist_id
            });
            playlist_items.sort((a: any, b: any) => Number(a?._order ?? 0) - Number(b?._order ?? 0));

            const track_cache = new Map<string, any>();
            const items = [];

            for (const playlist_item of playlist_items) {
                const track_id = typeof playlist_item?._track_id === "string"
                    ? playlist_item._track_id
                    : "";
                let track = track_cache.get(track_id);

                if (track_id && !track_cache.has(track_id)) {
                    const tracks = await this.findEntityRecords(AUDIO_TRACK_ENTITY_ID, {
                        _id: track_id
                    });
                    track = tracks[0] ?? null;
                    track_cache.set(track_id, track);
                }

                items.push({
                    _playlist_item_id: playlist_item?._id ?? "",
                    _track_id: track_id,
                    _title: track?._title ?? "Missing track",
                    _file_name: track?._file_name ?? "",
                    _order: playlist_item?._order ?? 0,
                    _enabled: playlist_item?._enabled ?? true
                });
            }

            _xlog.log("[music-player] playlist details loaded:", {
                _playlist_id: playlist_id,
                _items: items.length
            });

            return new XResponseOK({
                _playlist: playlists[0],
                _items: items
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] get playlist details failed:", err);

            return new XResponseOK({
                _ok: false,
                _message: `Get playlist details failed: ${err?.message ?? String(err)}`,
                _playlist: null,
                _items: []
            }).toXData();
        }
    }

    async _remove_playlist_item(xcmd: XCommand) {
        try {
            const params = this.readParams(xcmd);
            const playlist_item_id = this.readRequiredString(params, "_playlist_item_id");

            if (!playlist_item_id) {
                return this.fail("Playlist item id is required.");
            }

            const playlist_items = await this.findEntityRecords(PLAYLIST_ITEM_ENTITY_ID, {
                _id: playlist_item_id
            });

            if (playlist_items.length === 0) {
                return this.fail("Playlist item not found.");
            }

            await this.deleteEntityRecords(PLAYLIST_ITEM_ENTITY_ID, {
                _id: playlist_item_id
            });

            _xlog.log("[music-player] playlist item removed:", playlist_item_id);

            return new XResponseOK({
                _message: "Playlist item removed."
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] remove playlist item failed:", err);

            return this.fail(`Remove playlist item failed: ${err?.message ?? String(err)}`);
        }
    }

    async _create_schedule(xcmd: XCommand) {
        try {
            const params = this.readParams(xcmd);
            const playlist_id = this.readRequiredString(params, "_playlist_id");
            const name = this.readRequiredString(params, "_name");
            const start_time = this.readRequiredString(params, "_start_time");
            const end_time = this.readRequiredString(params, "_end_time");

            if (!playlist_id) {
                return this.fail("Playlist id is required.");
            }

            if (!name) {
                return this.fail("Schedule name is required.");
            }

            if (!start_time) {
                return this.fail("Schedule start time is required.");
            }

            if (!end_time) {
                return this.fail("Schedule end time is required.");
            }

            const playlists = await this.findEntityRecords(PLAYLIST_ENTITY_ID, {
                _id: playlist_id
            });

            if (playlists.length === 0) {
                return this.fail("Playlist not found.");
            }

            const data: any = {
                _playlist_id: playlist_id,
                _name: name,
                _days: Array.isArray(params?._days) ? params._days : [],
                _start_time: start_time,
                _end_time: end_time,
                _priority: this.readOptionalNumber(params, "_priority", 0),
                _enabled: this.readOptionalBoolean(params, "_enabled", true),
                _shuffle: this.readOptionalBoolean(params, "_shuffle", false)
            };

            if (params?._volume !== undefined && params?._volume !== null && params?._volume !== "") {
                data._volume = this.readOptionalNumber(params, "_volume", 0);
            }

            const schedule = await this.createEntityRecord(
                PLAYLIST_SCHEDULE_ENTITY_ID,
                data
            );

            _xlog.log("[music-player] schedule created:", schedule?._id);

            return new XResponseOK({
                _schedule: schedule,
                _message: "Schedule created."
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] create schedule failed:", err);

            return this.fail(`Create schedule failed: ${err?.message ?? String(err)}`);
        }
    }

    async _list_schedules(xcmd: XCommand) {
        try {
            const schedules = await this.findEntityRecords(PLAYLIST_SCHEDULE_ENTITY_ID);
            const playlists = await this.findEntityRecords(PLAYLIST_ENTITY_ID);
            const playlist_names = new Map(
                playlists.map((playlist: any) => [playlist?._id, playlist?._name ?? ""])
            );

            const resolved_schedules = schedules.map((schedule: any) => ({
                ...schedule,
                _playlist_name: playlist_names.get(schedule?._playlist_id) ?? ""
            }));

            _xlog.log("[music-player] schedules listed:", resolved_schedules.length);

            return new XResponseOK({
                _schedules: resolved_schedules
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] list schedules failed:", err);

            return new XResponseOK({
                _ok: false,
                _message: `List schedules failed: ${err?.message ?? String(err)}`,
                _schedules: []
            }).toXData();
        }
    }

    async _update_schedule(xcmd: XCommand) {
        try {
            const params = this.readParams(xcmd);
            const schedule_id = this.readRequiredString(params, "_schedule_id");

            if (!schedule_id) {
                return this.fail("Schedule id is required.");
            }

            const schedules = await this.findEntityRecords(PLAYLIST_SCHEDULE_ENTITY_ID, {
                _id: schedule_id
            });

            if (schedules.length === 0) {
                return this.fail("Schedule not found.");
            }

            const updates: Record<string, any> = {};

            if (Object.prototype.hasOwnProperty.call(params, "_name")) {
                const name = this.readRequiredString(params, "_name");

                if (!name) {
                    return this.fail("Schedule name is required.");
                }

                updates._name = name;
            }

            if (Object.prototype.hasOwnProperty.call(params, "_playlist_id")) {
                const playlist_id = this.readRequiredString(params, "_playlist_id");

                if (!playlist_id) {
                    return this.fail("Playlist id is required.");
                }

                const playlists = await this.findEntityRecords(PLAYLIST_ENTITY_ID, {
                    _id: playlist_id
                });

                if (playlists.length === 0) {
                    return this.fail("Playlist not found.");
                }

                updates._playlist_id = playlist_id;
            }

            if (Object.prototype.hasOwnProperty.call(params, "_days")) {
                if (!Array.isArray(params._days)) {
                    return this.fail("Schedule days must be an array.");
                }

                updates._days = params._days
                    .map((day: any) => typeof day === "string" ? day.trim() : "")
                    .filter(Boolean);
            }

            for (const field of ["_start_time", "_end_time"]) {
                if (!Object.prototype.hasOwnProperty.call(params, field)) {
                    continue;
                }

                const value = this.readRequiredString(params, field);

                if (!value) {
                    return this.fail(`${field} is required.`);
                }

                updates[field] = value;
            }

            if (Object.prototype.hasOwnProperty.call(params, "_priority")) {
                updates._priority = this.readOptionalNumber(params, "_priority", 0);
            }

            if (
                Object.prototype.hasOwnProperty.call(params, "_volume") &&
                params._volume !== undefined &&
                params._volume !== null &&
                params._volume !== ""
            ) {
                updates._volume = this.readOptionalNumber(params, "_volume", 0);
            }

            for (const field of ["_enabled", "_shuffle"]) {
                if (!Object.prototype.hasOwnProperty.call(params, field)) {
                    continue;
                }

                if (typeof params[field] !== "boolean") {
                    return this.fail(`${field} must be a boolean.`);
                }

                updates[field] = params[field];
            }

            const update_result = Object.keys(updates).length > 0
                ? await this.updateEntityRecords(PLAYLIST_SCHEDULE_ENTITY_ID, { _id: schedule_id }, updates)
                : {};

            if (schedule_id === this._active_schedule_id) {
                if (updates._enabled === false) {
                    const stop_result = await this._stop_playback(
                        this.createInternalCommand("stop-playback")
                    );

                    if (this.isFailureResponse(stop_result)) {
                        return stop_result;
                    }

                    this.clearActiveScheduleState();
                } else {
                    if (typeof updates._name === "string") {
                        this._active_schedule_name = updates._name;
                    }

                    if (typeof updates._playlist_id === "string") {
                        this._active_schedule_playlist_id = updates._playlist_id;
                    }
                }
            }

            const updated_schedule =
                update_result?._record ??
                update_result?._schedule ??
                update_result?._records?._data?.[0] ??
                update_result?._records?.[0] ??
                (await this.findEntityRecords(PLAYLIST_SCHEDULE_ENTITY_ID, { _id: schedule_id }))[0] ??
                null;

            _xlog.log("[music-player] schedule updated:", schedule_id);

            return new XResponseOK({
                _schedule: updated_schedule,
                _schedule_id: schedule_id,
                _message: "Schedule updated."
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] update schedule failed:", err);

            return this.fail(`Update schedule failed: ${err?.message ?? String(err)}`);
        }
    }

    async _set_schedule_enabled(xcmd: XCommand) {
        try {
            const params = this.readParams(xcmd);
            const schedule_id = this.readRequiredString(params, "_schedule_id");
            const enabled_value = params?._enabled;

            if (!schedule_id) {
                return this.fail("Schedule id is required.");
            }

            if (typeof enabled_value !== "boolean") {
                return this.fail("Schedule enabled flag is required.");
            }

            const schedules = await this.findEntityRecords(PLAYLIST_SCHEDULE_ENTITY_ID, {
                _id: schedule_id
            });

            if (schedules.length === 0) {
                return this.fail("Schedule not found.");
            }

            await this.updateEntityRecords(PLAYLIST_SCHEDULE_ENTITY_ID, {
                _id: schedule_id
            }, {
                _enabled: enabled_value
            });

            if (!enabled_value && schedule_id === this._active_schedule_id) {
                const stop_result = await this._stop_playback(
                    this.createInternalCommand("stop-playback")
                );

                if (this.isFailureResponse(stop_result)) {
                    return stop_result;
                }

                this.clearActiveScheduleState();
            }

            _xlog.log("[music-player] schedule enabled updated:", {
                _schedule_id: schedule_id,
                _enabled: enabled_value
            });

            return new XResponseOK({
                _schedule_id: schedule_id,
                _enabled: enabled_value,
                _message: enabled_value ? "Schedule enabled." : "Schedule disabled."
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] set schedule enabled failed:", err);

            return this.fail(`Set schedule enabled failed: ${err?.message ?? String(err)}`);
        }
    }

    async _delete_schedule(xcmd: XCommand) {
        try {
            const params = this.readParams(xcmd);
            const schedule_id = this.readRequiredString(params, "_schedule_id");

            if (!schedule_id) {
                return this.fail("Schedule id is required.");
            }

            const schedules = await this.findEntityRecords(PLAYLIST_SCHEDULE_ENTITY_ID, {
                _id: schedule_id
            });

            if (schedules.length === 0) {
                return this.fail("Schedule not found.");
            }

            await this.deleteEntityRecords(PLAYLIST_SCHEDULE_ENTITY_ID, {
                _id: schedule_id
            });

            _xlog.log("[music-player] schedule deleted:", schedule_id);

            return new XResponseOK({
                _message: "Schedule deleted."
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] delete schedule failed:", err);

            return this.fail(`Delete schedule failed: ${err?.message ?? String(err)}`);
        }
    }

    async _play_track(xcmd: XCommand) {
        return this.runWithManualReplace(async () => {
            try {
            const params = this.readParams(xcmd);
            const track_id = this.readRequiredString(params, "_track_id");
            const requested_file_path = this.readRequiredString(params, "_file_path");
            const playlist_playback = params?._playlist_playback === true;
            let file_path = "";
            let resolved_track_id = track_id;

            if (!playlist_playback) {
                this.clearRuntimePlaylistState();
            }

            if (track_id) {
                const tracks = await this.findEntityRecords(AUDIO_TRACK_ENTITY_ID, {
                    _id: track_id
                });
                const track = tracks[0];

                if (!track) {
                    return this.fail("Track not found.");
                }

                file_path = typeof track?._file_path === "string" ? track._file_path : "";

                if (!file_path) {
                    return this.fail("Track file path is missing.");
                }
            } else if (requested_file_path) {
                file_path = requested_file_path;
                resolved_track_id = "";
            } else {
                return this.fail("Track id or file path is required.");
            }

            const resolved_file_path = this.resolveMusicFilePath(file_path);

            if (!resolved_file_path) {
                return this.fail("File path must be inside the music folder.");
            }

            if (!fs.existsSync(resolved_file_path)) {
                return this.fail("File does not exist.");
            }

            const stat = fs.statSync(resolved_file_path);

            if (!stat.isFile()) {
                return this.fail("File path must point to a file.");
            }

            const ext = path.extname(resolved_file_path).toLowerCase();

            if (!SUPPORTED_AUDIO_EXTS.has(ext)) {
                return this.fail("File extension is not supported.");
            }

            _xlog.log("[music-player] play-track sequence start:", {
                _track_id: resolved_track_id,
                _file_path: resolved_file_path
            });

            try {
                await this.runPlayTrackSequence(resolved_file_path);
            } catch (err: any) {
                _xlog.error("[music-player] play-track sequence retry:", {
                    _track_id: resolved_track_id,
                    _file_path: resolved_file_path,
                    _message: err?.message ?? String(err)
                });

                await this.restartPlayer("play-track recovery");
                await this.runPlayTrackSequence(resolved_file_path);
            }

            const verified = await this.verifyPlayTrackPath(resolved_file_path);

            if (!verified) {
                _xlog.error("[music-player] play-track verify retry:", {
                    _track_id: resolved_track_id,
                    _file_path: resolved_file_path
                });

                await this.restartPlayer("play-track verification failed");
                await this.runPlayTrackSequence(resolved_file_path);

                const retry_verified = await this.verifyPlayTrackPath(resolved_file_path);

                if (!retry_verified) {
                    throw new Error("mpv did not report the requested playback path after retry.");
                }
            }

            this._current_track_id = resolved_track_id;
            this._current_file_path = resolved_file_path;
            this._player_status = "playing";

            _xlog.log("[music-player] play-track sequence success:", {
                _track_id: resolved_track_id,
                _file_path: resolved_file_path
            });

            _xlog.log("[music-player] playing track:", {
                _track_id: resolved_track_id,
                _file_path: resolved_file_path
            });

            return new XResponseOK({
                _message: "Playing track.",
                _status: "playing",
                _track_id: resolved_track_id,
                _file_path: resolved_file_path
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] play track failed:", err);

            return this.fail(`Play track failed: ${err?.message ?? String(err)}`);
        }
        });
    }

    async _start_playlist(xcmd: XCommand) {
        return this.runWithManualReplace(async () => {
            try {
            const params = this.readParams(xcmd);
            const playlist_id = this.readRequiredString(params, "_playlist_id");

            if (!playlist_id) {
                return this.fail("Playlist id is required.");
            }

            const loaded = await this.loadPlayablePlaylist(playlist_id);

            if (!loaded.playlist) {
                return this.fail("Playlist not found.");
            }

            if (loaded.items.length === 0) {
                return this.fail("No playable playlist tracks found.");
            }

            this._current_playlist_id = playlist_id;
            this._current_playlist_name = this.readRecordString(loaded.playlist, "_name");
            this._current_playlist_items = loaded.items;
            this._current_playlist_index = -1;

            const result = await this.playPlaylistIndex(0, false);

            if (this.isFailureResponse(result)) {
                this.clearRuntimePlaylistState();
            }

            return result;
        } catch (err: any) {
            _xlog.error("[music-player] start playlist failed:", err);

            return this.fail(`Start playlist failed: ${err?.message ?? String(err)}`);
        }
        });
    }

    async _get_current_playlist_state(xcmd: XCommand) {
        return new XResponseOK(this.getPlaylistStateData()).toXData();
    }

    async _get_schedule_runtime_state(xcmd: XCommand) {
        try {
            return new XResponseOK(await this.getScheduleRuntimeState()).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] get schedule runtime state failed:", err);

            return this.fail(`Get schedule runtime state failed: ${err?.message ?? String(err)}`);
        }
    }

    async _next_track(xcmd: XCommand) {
        return this.runWithManualReplace(async () => {
            try {
            if (this._current_playlist_items.length > 0) {
                const current_index = this._current_playlist_index;
                const wrapped = current_index >= this._current_playlist_items.length - 1;
                const target_index = current_index < 0 || wrapped
                    ? 0
                    : current_index + 1;

                _xlog.log("[music-player] next playlist track:", {
                    _playlist_id: this._current_playlist_id,
                    _current_index: current_index,
                    _target_index: target_index,
                    _wrapped: wrapped
                });

                return await this.playPlaylistIndex(target_index, wrapped);
            }

            const tracks = this.sortAudioTrackRecords(await this.listAudioTracks());

            if (tracks.length === 0) {
                return this.fail("No playable tracks found.");
            }

            const current_index = this.findCurrentTrackIndex(tracks);
            const wrapped = current_index >= tracks.length - 1;
            const target_index = current_index < 0 || wrapped
                ? 0
                : current_index + 1;
            const target_track = tracks[target_index];

            _xlog.log("[music-player] next track:", {
                _current_index: current_index,
                _target_index: target_index,
                _wrapped: wrapped
            });

            return await this.playTrackRecord(target_track, wrapped);
        } catch (err: any) {
            _xlog.error("[music-player] next track failed:", err);

            return this.fail(`Next track failed: ${err?.message ?? String(err)}`);
        }
        });
    }

    async _previous_track(xcmd: XCommand) {
        return this.runWithManualReplace(async () => {
            try {
            if (this._current_playlist_items.length > 0) {
                const current_index = this._current_playlist_index;
                const wrapped = current_index <= 0;
                const target_index = current_index < 0
                    ? 0
                    : wrapped
                        ? this._current_playlist_items.length - 1
                        : current_index - 1;

                _xlog.log("[music-player] previous playlist track:", {
                    _playlist_id: this._current_playlist_id,
                    _current_index: current_index,
                    _target_index: target_index,
                    _wrapped: wrapped
                });

                return await this.playPlaylistIndex(target_index, wrapped);
            }

            const tracks = this.sortAudioTrackRecords(await this.listAudioTracks());

            if (tracks.length === 0) {
                return this.fail("No playable tracks found.");
            }

            const current_index = this.findCurrentTrackIndex(tracks);
            const wrapped = current_index === 0;
            const target_index = current_index < 0
                ? 0
                : wrapped
                    ? tracks.length - 1
                    : current_index - 1;
            const target_track = tracks[target_index];

            _xlog.log("[music-player] previous track:", {
                _current_index: current_index,
                _target_index: target_index,
                _wrapped: wrapped
            });

            return await this.playTrackRecord(target_track, wrapped);
        } catch (err: any) {
            _xlog.error("[music-player] previous track failed:", err);

            return this.fail(`Previous track failed: ${err?.message ?? String(err)}`);
        }
        });
    }

    async _stop_playback(xcmd: XCommand) {
        try {
            const params = this.readParams(xcmd);
            const preserve_schedule = params?._preserve_schedule === true;

            await this.ensurePlayer();

            this._manual_stop_requested = true;

            try {
                await this.sendMpvCommand(["stop"]);
            } finally {
                this._manual_stop_requested = false;
            }

            this._player_status = "stopped";
            this._current_track_id = "";
            this._current_file_path = "";
            this.clearRuntimePlaylistState();
            if (!preserve_schedule) {
                this.clearActiveScheduleState();
            }

            _xlog.log("[music-player] playback stopped.");

            return new XResponseOK({
                _message: "Playback stopped.",
                _status: "stopped",
                ...this.getPlaylistStateData()
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] stop playback failed:", err);

            return this.fail(`Stop playback failed: ${err?.message ?? String(err)}`);
        }
    }

    async _pause_playback(xcmd: XCommand) {
        try {
            await this.ensurePlayer();
            await this.sendMpvCommand(["set_property", "pause", true]);

            this._player_status = "paused";

            _xlog.log("[music-player] playback paused.");

            return new XResponseOK({
                _message: "Playback paused.",
                _status: "paused"
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] pause playback failed:", err);

            return this.fail(`Pause playback failed: ${err?.message ?? String(err)}`);
        }
    }

    async _resume_playback(xcmd: XCommand) {
        try {
            await this.ensurePlayer();
            await this.sendMpvCommand(["set_property", "pause", false]);

            this._player_status = "playing";

            _xlog.log("[music-player] playback resumed.");

            return new XResponseOK({
                _message: "Playback resumed.",
                _status: "playing"
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] resume playback failed:", err);

            return this.fail(`Resume playback failed: ${err?.message ?? String(err)}`);
        }
    }

    async _set_volume(xcmd: XCommand) {
        try {
            const params = this.readParams(xcmd);
            const raw_volume = params?._volume;
            const volume = Number(raw_volume);

            if (!Number.isFinite(volume)) {
                return this.fail("Volume is required.");
            }

            await this.ensurePlayer();
            await this.sendMpvCommand(["set_property", "volume", volume]);

            this._current_volume = volume;

            _xlog.log("[music-player] volume set:", volume);

            return new XResponseOK({
                _message: "Volume set.",
                _status: "playing",
                _volume: volume
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] set volume failed:", err);

            return this.fail(`Set volume failed: ${err?.message ?? String(err)}`);
        }
    }

    async _get_player_state(xcmd: XCommand) {
        try {
            if (!this._player_process && !this._current_track_id && !this._current_file_path) {
                return this.stoppedPlayerState();
            }

            const paused = await this.getMpvPropertySafe("pause", false);
            const mpv_path = await this.getMpvPropertySafe("path", "");
            const volume = this.toFiniteNumber(
                await this.getMpvPropertySafe("volume", this._current_volume),
                this._current_volume
            );
            const file_path = typeof mpv_path === "string" ? mpv_path : "";

            this._current_volume = volume;

            if (!file_path) {
                return this.stoppedPlayerState(volume);
            }

            const position_sec = this.toFiniteNumber(await this.getMpvPropertySafe("time-pos", 0));
            const duration_sec = this.toFiniteNumber(await this.getMpvPropertySafe("duration", 0));
            const percent = this.toFiniteNumber(await this.getMpvPropertySafe("percent-pos", 0));
            const status = paused === true
                ? "paused"
                : "playing";

            this._player_status = status;
            this._current_file_path = file_path;

            return new XResponseOK({
                _status: status,
                _position_sec: position_sec,
                _duration_sec: duration_sec,
                _percent: percent,
                _volume: volume,
                _track_id: this._current_track_id,
                _file_path: this._current_file_path,
                ...this.getActivePlaylistResultFields()
            }).toXData();
        } catch (err: any) {
            _xlog.error("[music-player] get player state failed:", err);

            return this.fail(`Get player state failed: ${err?.message ?? String(err)}`);
        }
    }
}

export default MusicPlayer;
