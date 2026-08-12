import {
    XModule,
    _xem,
    type XpellSkill,
    type XpellSkillCommand,
    _xd,
    _xlog,
    XUI,
    XUIRuntime
} from "@xpell/ui";

type ClientXCommand = {
    _params?: Record<string, any>;
};


export class MusicPlayerClient extends XModule {
    static _name = "music-player-client";
    static _skill: XpellSkill = {
        _id: "music-player-client",
        _title: "Music Player Client Module",
        _version: "1.0.0",
        _active: true,
        _type: "client-module-api",
        _requires: ["xmodule"],

        _description:
            "Music Player Client Module for managing music playback - call server module MusicPlayerModule.",

        _core_rules: [
            "Use XData/xd for reactive runtime state.",
            "Use string ops for simple values and object ops for JSON data."
        ]
    };

    static _ops: Record<string, XpellSkillCommand> = {
        "info": {
            _name: "info",
            _scope: "module",
            _description: "Get module information."
        },
        "scan-music-folder": {
            _name: "scan-music-folder",
            _scope: "module",
            _description: "Scan the server music folder and write tracks to XData."
        },
        "list-tracks": {
            _name: "list-tracks",
            _scope: "module",
            _description: "Load persisted tracks from XDB into XData."
        },
        "download-youtube": {
            _name: "download-youtube",
            _scope: "module",
            _description: "Start a YouTube audio download and track progress in XData."
        },
        "get-youtube-download-status": {
            _name: "get-youtube-download-status",
            _scope: "module",
            _description: "Refresh one YouTube download status by id."
        },
        "init-player-view": {
            _name: "init-player-view",
            _scope: "module",
            _description: "Initialize the music player view after XVM renders it."
        },
        "init-admin-view": {
            _name: "init-admin-view",
            _scope: "module",
            _description: "Initialize admin playlists, schedules, and selected playlist details."
        },
        "create-playlist": {
            _name: "create-playlist",
            _scope: "module",
            _description: "Create a playlist on the server and refresh playlists in XData."
        },
        "open-create-playlist-modal": {
            _name: "open-create-playlist-modal",
            _scope: "module",
            _description: "Reset create playlist validation and open the create playlist modal."
        },
        "cancel-create-playlist": {
            _name: "cancel-create-playlist",
            _scope: "module",
            _description: "Close the create playlist modal without creating a playlist."
        },
        "prepare-edit-playlist": {
            _name: "prepare-edit-playlist",
            _scope: "module",
            _description: "Populate playlist edit fields and open the edit modal."
        },
        "edit-playlist": {
            _name: "edit-playlist",
            _scope: "module",
            _description: "Update the selected playlist and refresh playlist data."
        },
        "list-playlists": {
            _name: "list-playlists",
            _scope: "module",
            _description: "Load persisted playlists from the server into XData."
        },
        "open-add-tracks-modal": {
            _name: "open-add-tracks-modal",
            _scope: "module",
            _description: "Validate selected playlist, load tracks, and open the add tracks modal."
        },
        "add-track-to-playlist": {
            _name: "add-track-to-playlist",
            _scope: "module",
            _description: "Add the selected track to the selected playlist."
        },
        "list-playlist-items": {
            _name: "list-playlist-items",
            _scope: "module",
            _description: "Load resolved playlist details for the selected playlist into XData."
        },
        "get-playlist-details": {
            _name: "get-playlist-details",
            _scope: "module",
            _description: "Load playlist details with resolved track data into XData."
        },
        "start-playlist": {
            _name: "start-playlist",
            _scope: "module",
            _description: "Start playback for the selected playlist."
        },
        "get-current-playlist-state": {
            _name: "get-current-playlist-state",
            _scope: "module",
            _description: "Load current runtime playlist playback state into XData."
        },
        "remove-playlist-item": {
            _name: "remove-playlist-item",
            _scope: "module",
            _description: "Remove a playlist item and refresh current playlist items."
        },
        "create-schedule": {
            _name: "create-schedule",
            _scope: "module",
            _description: "Create a playlist schedule on the server and refresh schedules in XData."
        },
        "prepare-edit-schedule": {
            _name: "prepare-edit-schedule",
            _scope: "module",
            _description: "Populate schedule edit fields and open the edit schedule modal."
        },
        "edit-schedule": {
            _name: "edit-schedule",
            _scope: "module",
            _description: "Update a playlist schedule and refresh schedule state."
        },
        "list-schedules": {
            _name: "list-schedules",
            _scope: "module",
            _description: "Load persisted playlist schedules from the server into XData."
        },
        "get-schedule-runtime-state": {
            _name: "get-schedule-runtime-state",
            _scope: "module",
            _description: "Load current runtime schedule status into XData."
        },
        "set-schedule-enabled": {
            _name: "set-schedule-enabled",
            _scope: "module",
            _description: "Enable or disable a playlist schedule and refresh schedule state."
        },
        "delete-schedule": {
            _name: "delete-schedule",
            _scope: "module",
            _description: "Delete a playlist schedule and refresh schedules in XData."
        },
        "prepare-delete-schedule": {
            _name: "prepare-delete-schedule",
            _scope: "module",
            _description: "Open delete confirmation for a playlist schedule."
        },
        "confirm-delete-schedule": {
            _name: "confirm-delete-schedule",
            _scope: "module",
            _description: "Delete the pending schedule after confirmation."
        },
        "play-first-track": {
            _name: "play-first-track",
            _scope: "module",
            _description: "Play the first available track from XData."
        },
        "play-track": {
            _name: "play-track",
            _scope: "module",
            _description: "Play one persisted track by id."
        },
        "next-track": {
            _name: "next-track",
            _scope: "module",
            _description: "Play the next persisted track."
        },
        "previous-track": {
            _name: "previous-track",
            _scope: "module",
            _description: "Play the previous persisted track."
        },
        "stop-playback": {
            _name: "stop-playback",
            _scope: "module",
            _description: "Stop server-side playback."
        },
        "pause-playback": {
            _name: "pause-playback",
            _scope: "module",
            _description: "Pause server-side playback."
        },
        "resume-playback": {
            _name: "resume-playback",
            _scope: "module",
            _description: "Resume server-side playback."
        },
        "set-volume": {
            _name: "set-volume",
            _scope: "module",
            _description: "Set server-side playback volume."
        },
        "get-player-state": {
            _name: "get-player-state",
            _scope: "module",
            _description: "Load server-side player state into XData."
        }
    };


    constructor() {
        super({ _name: MusicPlayerClient._name });
    }

    private _player_state_timer?: any;
    private _schedule_state_timer?: any;
    private _schedule_state_polling_enabled = false;
    private _youtube_download_id = "";

    async onLoad() {
        _xem.removeOwner("music-player-client:youtube");
        _xem.on(
            "music-youtube-download-progress",
            (payload: any) => {
                void this.handleYouTubeDownloadProgress(payload);
            },
            { _owner: "music-player-client:youtube" }
        );
        _xem.fire("music-player-client:loaded");
    }

    private readTracksFromResult(result: any) {
        const candidates = [
            result?._tracks,
            result?._result?._tracks,
            result?._data?._tracks,
            result?._result?._data?._tracks,
            result?._records?._data,
            result?._records,
            result?._result?._records?._data,
            result?._result?._records,
            result?._data,
            result?._result?._data,
            result?.rows,
            result?._result?.rows
        ];

        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                return candidate;
            }
        }

        return [];
    }

    private readPlaylistsFromResult(result: any) {
        const candidates = [
            result?._playlists,
            result?._result?._playlists,
            result?._data?._playlists,
            result?._result?._data?._playlists
        ];

        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                return candidate;
            }
        }

        return [];
    }

    private storeTracks(tracks: any[], source: string) {
        _xd.set("music-tracks", this.formatLibraryTracks(tracks), { source });
        _xd.set("music-tracks-count", tracks.length, { source });
        this.setStringXData("music-tracks-status", `Loaded ${tracks.length} tracks.`, source, "Tracks loaded.");
        _xlog.log("[music-player-client] stored music-tracks count:", tracks.length);
    }

    private formatLibraryTracks(tracks: any[]) {
        return tracks.map((track) => {
            const extension = this.toDisplayString(track?._ext || track?._type, "").replace(/^\./, "");
            const status = track?._enabled === false
                ? "Unavailable"
                : this.formatStatusLabel(track?._status, "Available");

            return {
                ...track,
                _library_title: this.toDisplayString(
                    track?._title || track?._name || track?._file_name,
                    "Untitled track"
                ),
                _library_type_label: extension ? extension.toUpperCase() : "Audio",
                _library_status_label: status
            };
        });
    }

    private storeYouTubeDownloadProgress(result: any, source: string) {
        const download_id = this.readResultString(result, "_download_id");
        const title = this.readResultString(result, "_title");
        const status = this.readResultString(result, "_status", "preparing");
        const filename = this.readResultString(result, "_filename");
        const message = this.getResultMessage(result, "Preparing download...");
        const error = this.readResultString(result, "_error");
        const progress = Math.max(0, Math.min(100, this.readResultNumber(result, "_progress", 0)));
        const progress_label = status === "complete"
            ? "100%"
            : progress > 0
                ? `${Math.round(progress)}%`
                : "0%";
        const title_label = title
            ? `Downloading: ${title}`
            : status === "complete"
                ? "Download complete."
                : status === "error"
                    ? "Download failed."
                    : "Preparing YouTube download...";

        if (download_id) {
            this._youtube_download_id = download_id;
            _xd.set("music-youtube-download-id", download_id, { source });
        }

        _xd.set("music-youtube-download-title", title_label, { source });
        _xd.set("music-youtube-download-status", message, { source });
        _xd.set("music-youtube-download-progress", progress, { source });
        _xd.set("music-youtube-download-progress-label", progress_label, { source });
        _xd.set("music-youtube-download-filename", filename, { source });
        _xd.set("music-youtube-download-message", message, { source });
        _xd.set("music-youtube-download-error", error, { source });
        this.updateYouTubeDownloadProgressBar();
    }

    private updateYouTubeDownloadProgressBar() {
        const percent = Math.max(0, Math.min(100, this.readXDataNumber("music-youtube-download-progress", 0)));
        const progress_fill = (XUI as any).getObject("youtube-download-progress-fill");
        const width = `${percent}%`;

        if (progress_fill?.dom?.style) {
            progress_fill.dom.style.width = width;
            return;
        }

        const dom_object = progress_fill?.getDOMObject?.();

        if (dom_object?.style) {
            dom_object.style.width = width;
            return;
        }

        if (progress_fill?.update) {
            progress_fill.update({ style: `width:${width}` });
        }
    }

    private async handleYouTubeDownloadProgress(payload: any) {
        const source = "music-player-client.youtube-progress";
        const download_id = this.readResultString(payload, "_download_id");

        if (download_id && this._youtube_download_id && download_id !== this._youtube_download_id) {
            return;
        }

        this.storeYouTubeDownloadProgress(payload, source);

        const status = this.readResultString(payload, "_status");
        if (status === "complete") {
            _xd.delete("music-error", { source });
            await this._list_tracks();
            return;
        }

        if (status === "error") {
            const message = this.readResultString(payload, "_error", this.getResultMessage(payload, "YouTube download failed."));
            this.setStringXData("music-error", message, source, "YouTube download failed.");
        }
    }

    async _download_youtube() {
        const source = "music-player-client.download-youtube";
        const url = this.readXDataString("music-youtube-url");
        const track_name = this.readXDataString("music-youtube-track-name");

        if (!url) {
            const result = {
                _ok: false,
                _message: "YouTube URL is required."
            };

            this.setStringXData("music-youtube-download-error", result._message, source, "YouTube URL is required.");
            this.setStringXData("music-youtube-download-status", result._message, source, "YouTube URL is required.");
            return result;
        }

        if (!track_name) {
            const result = {
                _ok: false,
                _message: "Track name is required."
            };

            this.setStringXData("music-youtube-download-error", result._message, source, "Track name is required.");
            this.setStringXData("music-youtube-download-status", result._message, source, "Track name is required.");
            return result;
        }

        try {
            _xd.delete("music-error", { source });
            _xd.set("music-youtube-download-error", "", { source });
            _xd.set("music-youtube-download-progress", 0, { source });
            _xd.set("music-youtube-download-progress-label", "0%", { source });
            _xd.set("music-youtube-download-status", "Preparing download...", { source });
            _xd.set("music-youtube-download-title", "Preparing YouTube download...", { source });
            this.updateYouTubeDownloadProgressBar();

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "youtube-downloader",
                _op: "download",
                _url: url,
                _track_name: track_name,
                _params: {
                    _url: url,
                    _track_name: track_name
                }
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "YouTube download failed.");
                this.setStringXData("music-youtube-download-error", message, source, "YouTube download failed.");
                this.setStringXData("music-youtube-download-status", message, source, "YouTube download failed.");
                this.setStringXData("music-error", message, source, "YouTube download failed.");
                return result;
            }

            this.storeYouTubeDownloadProgress(result, source);
            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `YouTube download failed: ${message}`
            };

            _xlog.error("[music-player-client] youtube download failed:", err);
            this.setStringXData("music-youtube-download-error", result._message, source, "YouTube download failed.");
            this.setStringXData("music-youtube-download-status", result._message, source, "YouTube download failed.");
            this.setStringXData("music-error", result._message, source, "YouTube download failed.");

            return result;
        }
    }

    async _get_youtube_download_status() {
        const source = "music-player-client.get-youtube-download-status";
        const download_id = this.readXDataString("music-youtube-download-id") || this._youtube_download_id;

        if (!download_id) {
            return {
                _ok: false,
                _message: "No YouTube download is active."
            };
        }

        try {
            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "youtube-downloader",
                _op: "status",
                _params: {
                    _download_id: download_id
                }
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "YouTube download status failed.");
                this.setStringXData("music-youtube-download-error", message, source, "YouTube download status failed.");
                return result;
            }

            this.storeYouTubeDownloadProgress(result, source);
            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `YouTube download status failed: ${message}`
            };

            this.setStringXData("music-youtube-download-error", result._message, source, "YouTube download status failed.");
            return result;
        }
    }

    async _scan_music_folder() {
        const source = "music-player-client.scan-music-folder";

        try {
            _xlog.log("[music-player-client] scan started");

            _xd.set(
                "music-scan-result",
                {
                    _message: "Scanning music folder...",
                    _tracks: []
                },
                { source }
            );

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "scan-music-folder",
                _params: {}
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Scan music folder failed.");

                _xlog.error("[music-player-client] error received:", message);
                _xd.set("music-error", message, { source });
                _xd.set("music-scan-result", result, { source });

                return result;
            }

            _xd.delete("music-error", { source });
            _xd.set("music-scan-result", result, { source });

            _xlog.log("[music-player-client] scan completed:", result);

            const scanTracks = this.readTracksFromResult(result);
            if (scanTracks.length > 0) {
                this.storeTracks(scanTracks, source);
            }

            const refreshed = await this._list_tracks();
            const refreshedTracks = this.readTracksFromResult(refreshed);

            if (refreshedTracks.length > 0) {
                this.storeTracks(refreshedTracks, source);
            } else if (scanTracks.length > 0) {
                this.storeTracks(scanTracks, source);
            }

            _xlog.log(
                "[music-player-client] library refreshed:",
                refreshedTracks.length || scanTracks.length
            );

            return {
                ...result,
                _tracks: refreshedTracks.length > 0 ? refreshedTracks : scanTracks
            };
        } catch (err: any) {
            const message = err?._error?._message ?? err?.message ?? String(err);
            const result = {
                _ok: false,
                _message: `Scan music folder failed: ${message}`,
                _tracks: []
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Scan music folder failed.");
            _xd.set("music-scan-result", result, { source });

            return result;
        }
    }

    async _list_tracks(xcmd?: ClientXCommand) {
        const source = "music-player-client.list-tracks";
        const suppress_wormhole_not_ready =
            xcmd?._params?._suppress_wormhole_not_ready === true;

        try {
            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "list-tracks",
                _params: {}
            });

            _xlog.log("[music-player-client] list-tracks raw result:", result);

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "List tracks failed.");

                if (suppress_wormhole_not_ready && this.isWormholeNotReadyError(result)) {
                    return result;
                }

                _xlog.error("[music-player-client] error received:", message);
                _xd.set("music-error", message, { source });

                return result;
            }

            const tracks = this.readTracksFromResult(result);

            _xd.delete("music-error", { source });
            this.storeTracks(tracks, source);

            _xlog.log("[music-player-client] tracks loaded:", tracks.length);

            return {
                ...result,
                _tracks: tracks
            };
        } catch (err: any) {
            const error_code = this.readErrorCode(err);
            const message = error_code || err?._error?._message || err?.message || String(err);
            const result = {
                _ok: false,
                _message: `List tracks failed: ${message}`,
                _code: error_code,
                _tracks: []
            };

            if (suppress_wormhole_not_ready && this.isWormholeNotReadyError(result)) {
                return result;
            }

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "List tracks failed.");

            return result;
        }
    }

    private readXDataString(key: string) {
        const value = _xd.get(key);

        return typeof value === "string" ? value.trim() : "";
    }

    private readControlString(object_id: string) {
        const control = (XUI as any).getObject?.(object_id);

        if (control?.getValue) {
            return this.toDisplayString(control.getValue(), "").trim();
        }

        const dom = control?.dom ?? control?.getDOMObject?.();
        const value = dom && "value" in dom ? dom.value : "";

        return typeof value === "string" ? value.trim() : "";
    }

    private readXDataOrControlString(key: string, object_id: string) {
        return this.readXDataString(key) || this.readControlString(object_id);
    }

    private readParamString(xcmd: ClientXCommand | undefined, field: string) {
        const value = xcmd?._params?.[field];

        return typeof value === "string" ? value.trim() : "";
    }

    private readParamBoolean(xcmd: ClientXCommand | undefined, field: string, fallback: boolean) {
        const value = xcmd?._params?.[field];

        if (typeof value === "boolean") {
            return value;
        }

        if (value === "true") {
            return true;
        }

        if (value === "false") {
            return false;
        }

        return fallback;
    }

    private readXDataArray(key: string) {
        const value = _xd.get(key);

        return Array.isArray(value) ? value : [];
    }

    private readXDataNumber(key: string, fallback: number) {
        const value = _xd.get(key);

        if (value === undefined || value === null || value === "") {
            return fallback;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    private readXDataOptionalNumber(key: string) {
        const value = _xd.get(key);

        if (value === undefined || value === null || value === "") {
            return undefined;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    private readXDataBoolean(key: string, fallback: boolean) {
        const value = _xd.get(key);

        if (typeof value === "boolean") {
            return value;
        }

        if (value === "true") {
            return true;
        }

        if (value === "false") {
            return false;
        }

        return fallback;
    }

    private getErrorMessage(err: any) {
        return this.toDisplayString(err, "Unknown error.");
    }

    private toDisplayString(value: any, fallback: string) {
        if (typeof value === "string") {
            return value.trim() || fallback;
        }

        if (value === undefined || value === null) {
            return fallback;
        }

        const candidates = [
            value?._message,
            value?.message,
            value?._error?._message,
            value?._result?._message,
            value?._result?._error?._message
        ];

        for (const candidate of candidates) {
            if (typeof candidate === "string" && candidate.trim()) {
                return candidate.trim();
            }
        }

        if (typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }

        try {
            return JSON.stringify(value);
        } catch {
            return fallback;
        }
    }

    private getResultMessage(result: any, fallback: string) {
        return this.toDisplayString(result, fallback);
    }

    private getResultStatus(result: any, fallback: string) {
        return this.toDisplayString(result?._status, fallback);
    }

    private readErrorCode(value: any) {
        const candidates = [
            value?._code,
            value?.code,
            value?._error?._code,
            value?._result?._code,
            value?._result?._error?._code
        ];

        for (const candidate of candidates) {
            if (typeof candidate === "string" && candidate.trim()) {
                return candidate.trim();
            }
        }

        return "";
    }

    private isWormholeNotReadyError(value: any) {
        return this.readErrorCode(value) === "E_WORMHOLE_NOT_READY";
    }

    private isTransientPlayerStateError(value: any) {
        if (this.isWormholeNotReadyError(value)) {
            return true;
        }

        const message = this.getResultMessage(value, "").toLowerCase();

        return (
            message.includes("timeout") ||
            message.includes("timed out") ||
            message.includes("network") ||
            message.includes("connection") ||
            message.includes("not ready")
        );
    }

    private delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private normalizePlaybackStatus(status: any) {
        const value = typeof status === "string"
            ? status.trim().toLowerCase()
            : "";

        return value === "playing" || value === "paused" || value === "stopped"
            ? value
            : "unknown";
    }

    private showObject(object_id: string) {
        XUI.show(object_id);
    }

    private bindButtonClick(object_id: string, binding_key: string, handler: () => Promise<any>) {
        const object = (XUI as any).getObject?.(object_id);
        const dom = object?.dom ?? object?.getDOMObject?.();

        if (!dom?.addEventListener || dom.dataset?.[binding_key] === "true") {
            return;
        }

        if (dom.dataset) {
            dom.dataset[binding_key] = "true";
        }

        dom.addEventListener(
            "click",
            (event: Event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                void handler();
            },
            true
        );
    }

    private bindCreatePlaylistModalControls() {
        this.bindButtonClick(
            "open-create-playlist-button",
            "musicCreatePlaylistOpenBound",
            () => this._open_create_playlist_modal()
        );
        this.bindButtonClick(
            "cancel-create-playlist-button",
            "musicCreatePlaylistCancelBound",
            () => this._cancel_create_playlist()
        );
        this.bindButtonClick(
            "create-playlist-button",
            "musicCreatePlaylistSubmitBound",
            () => this._create_playlist()
        );
    }

    private hideObject(object_id: string) {
        XUI.hide(object_id);
    }

    private closeObject(object_id: string) {
        const object = (XUI as any).getObject?.(object_id);

        if (object?.close) {
            object.close();
            return;
        }

        XUI.hide(object_id);
    }

    private isPollingPlaybackStatus() {
        const status = this.normalizePlaybackStatus(_xd.get("music-player-status"));

        return status === "playing" || status === "paused";
    }

    private stopPlayerStatePolling() {
        if (this._player_state_timer) {
            clearInterval(this._player_state_timer);
        }

        this._player_state_timer = undefined;
    }

    private stopScheduleStatePolling() {
        this._schedule_state_polling_enabled = false;

        if (this._schedule_state_timer) {
            clearTimeout(this._schedule_state_timer);
        }

        this._schedule_state_timer = undefined;
    }

    private startScheduleStatePolling() {
        if (this._schedule_state_polling_enabled) {
            return;
        }

        this._schedule_state_polling_enabled = true;

        const poll = async () => {
            this._schedule_state_timer = undefined;

            if (!this._schedule_state_polling_enabled) {
                return;
            }

            await this._get_schedule_runtime_state({
                _params: {
                    _suppress_transient_errors: true
                }
            });

            if (this._schedule_state_polling_enabled) {
                this._schedule_state_timer = setTimeout(poll, 5000);
            }
        };

        this._schedule_state_timer = setTimeout(poll, 0);
    }

    private startPlayerStatePolling() {
        this.stopPlayerStatePolling();

        this._player_state_timer = setInterval(() => {
            if (!this.isPollingPlaybackStatus()) {
                this.stopPlayerStatePolling();
                return;
            }

            void this._get_player_state({
                _params: {
                    _suppress_transient_errors: true
                }
            }).then((result: any) => {
                if (result?._ok === false && !this.isTransientPlayerStateError(result)) {
                    this.stopPlayerStatePolling();
                    return;
                }

                if (!this.isPollingPlaybackStatus()) {
                    this.stopPlayerStatePolling();
                    return;
                }

                this.updatePlaybackUI();
            }).catch((err: any) => {
                if (!this.isTransientPlayerStateError(err)) {
                    this.stopPlayerStatePolling();
                }
            });
        }, 1000);
    }

    private updatePlaybackUI() {
        const status = this.normalizePlaybackStatus(_xd.get("music-player-status"));

        if (status === "playing") {
            this.hideObject("play-button");
            this.showObject("pause-button");
            this.hideObject("resume-button");
            this.showObject("stop-button");
            this.showObject("previous-button");
            this.showObject("next-button");
            return;
        }

        if (status === "paused") {
            this.hideObject("play-button");
            this.hideObject("pause-button");
            this.showObject("resume-button");
            this.showObject("stop-button");
            this.showObject("previous-button");
            this.showObject("next-button");
            return;
        }

        this.showObject("play-button");
        this.hideObject("pause-button");
        this.hideObject("resume-button");
        this.hideObject("stop-button");
        this.hideObject("previous-button");
        this.hideObject("next-button");
    }

    private setStringXData(key: string, value: any, source: string, fallback: string) {
        _xd.set(key, this.toDisplayString(value, fallback), { source });
    }

    private storePlaybackResult(result: any, source: string, fallback: string) {
        const message = this.getResultMessage(result, fallback);

        _xd.set("music-playback-result", result, { source });
        _xd.set("music-playback-result-message", message, { source });

        return message;
    }

    private readResultString(result: any, field: string, fallback = "") {
        const value = result?.[field];

        return typeof value === "string" && value.trim()
            ? value.trim()
            : fallback;
    }

    private storeScheduleRuntimeState(result: any, source: string) {
        const active_label = this.readResultString(result, "_active_label", "-");
        const next_label = this.readResultString(result, "_next_label", "-");
        const status_label = this.readResultString(result, "_status_label", "No active schedule");
        const state = {
            ...result,
            _active_label: active_label,
            _next_label: next_label,
            _status_label: status_label
        };

        _xd.set("music-schedule-runtime-state", state, { source });
        _xd.set("music-active-schedule-id", this.readResultString(result, "_active_schedule_id"), { source });
        _xd.set("music-active-schedule-name", this.readResultString(result, "_active_schedule_name"), { source });
        _xd.set("music-active-schedule-playlist-id", this.readResultString(result, "_active_schedule_playlist_id"), { source });
        _xd.set("music-active-schedule-label", active_label, { source });
        _xd.set("music-next-schedule-label", next_label, { source });
        _xd.set("music-schedule-runtime-status", status_label, { source });
    }

    private readResultNumber(result: any, field: string, fallback = 0) {
        const parsed = Number(result?.[field]);

        return Number.isFinite(parsed) ? parsed : fallback;
    }

    private formatSeconds(value: any) {
        const total_seconds = Math.max(0, Math.floor(Number(value) || 0));
        const hours = Math.floor(total_seconds / 3600);
        const minutes = Math.floor((total_seconds % 3600) / 60);
        const seconds = total_seconds % 60;
        const padded_minutes = hours > 0
            ? String(minutes).padStart(2, "0")
            : String(minutes);
        const padded_seconds = String(seconds).padStart(2, "0");

        return hours > 0
            ? `${hours}:${padded_minutes}:${padded_seconds}`
            : `${padded_minutes}:${padded_seconds}`;
    }

    private updateProgressBar() {
        const percent = Math.max(0, Math.min(100, this.readXDataNumber("music-player-percent", 0)));
        const progress_fill = (XUI as any).getObject("progress-fill");
        const width = `${percent}%`;

        if (progress_fill?.dom?.style) {
            progress_fill.dom.style.width = width;
            return;
        }

        const dom_object = progress_fill?.getDOMObject?.();

        if (dom_object?.style) {
            dom_object.style.width = width;
            return;
        }

        if (progress_fill?.update) {
            progress_fill.update({ style: `width:${width}` });
        }
    }

    private storePlaybackProgress(result: any, source: string) {
        const position_sec = this.readResultNumber(result, "_position_sec");
        const duration_sec = this.readResultNumber(result, "_duration_sec");
        const percent = this.readResultNumber(result, "_percent");

        _xd.set("music-player-position-sec", position_sec, { source });
        _xd.set("music-player-duration-sec", duration_sec, { source });
        _xd.set("music-player-percent", percent, { source });
        _xd.set("music-player-position-label", this.formatSeconds(position_sec), { source });
        _xd.set("music-player-duration-label", this.formatSeconds(duration_sec), { source });
        _xd.set("music-player-percent-label", `${Math.round(percent)}%`, { source });
        this.updateProgressBar();
    }

    private formatPlaylistPosition(index: number, count: number) {
        return count > 0 && index >= 0
            ? `Track ${index + 1} of ${count}`
            : "";
    }

    private clearCurrentPlaylistXData(source: string) {
        _xd.set("music-current-playlist-id", "", { source });
        _xd.set("music-current-playlist-name", "", { source });
        _xd.set("music-current-playlist-index", -1, { source });
        _xd.set("music-current-playlist-count", 0, { source });
        _xd.set("music-current-playlist-items", [], { source });
        _xd.set("music-current-playlist-position", "", { source });
    }

    private storeCurrentPlaylistState(result: any, source: string, clear_when_missing = false) {
        const playlist_id = typeof result?._playlist_id === "string"
            ? result._playlist_id.trim()
            : "";

        if (!playlist_id) {
            if (clear_when_missing) {
                this.clearCurrentPlaylistXData(source);
            }
            return;
        }

        const playlist_name = typeof result?._playlist_name === "string"
            ? result._playlist_name.trim()
            : "";
        const playlist_index = this.readResultNumber(result, "_playlist_index", -1);
        const playlist_count = this.readResultNumber(result, "_playlist_count", 0);
        const items = Array.isArray(result?._items)
            ? result._items
            : this.readXDataArray("music-current-playlist-items");

        _xd.set("music-current-playlist-id", playlist_id, { source });
        _xd.set("music-current-playlist-name", playlist_name, { source });
        _xd.set("music-current-playlist-index", playlist_index, { source });
        _xd.set("music-current-playlist-count", playlist_count, { source });
        _xd.set("music-current-playlist-items", items, { source });
        _xd.set(
            "music-current-playlist-position",
            this.formatPlaylistPosition(playlist_index, playlist_count),
            { source }
        );
    }

    private resetPlaybackProgress(source: string) {
        this.storePlaybackProgress(
            {
                _position_sec: 0,
                _duration_sec: 0,
                _percent: 0
            },
            source
        );
        this.updateProgressBar();
    }

    private findTrackById(track_id: string) {
        const tracks = this.readXDataArray("music-tracks");

        return tracks.find((track: any) => track?._id === track_id) ?? null;
    }

    private getFilePathTitle(file_path: any) {
        if (typeof file_path !== "string") {
            return "";
        }

        const normalized = file_path.trim().replaceAll("\\", "/");
        const parts = normalized.split("/");

        return parts[parts.length - 1]?.trim() ?? "";
    }

    private storePlayingTrackResult(result: any, source: string, fallback_message: string) {
        this.storePlaybackResult(result, source, fallback_message);

        const status = this.getResultStatus(result, "playing");
        const track_id = typeof result?._track_id === "string" ? result._track_id.trim() : "";
        const file_path = typeof result?._file_path === "string" ? result._file_path.trim() : "";
        const result_title = typeof result?._title === "string" ? result._title.trim() : "";
        const file_path_title = this.getFilePathTitle(file_path);
        const track = track_id ? this.findTrackById(track_id) : null;
        const fallback_track = {
            _id: track_id,
            _file_path: file_path,
            _title: result_title || file_path_title || "Playing track"
        };

        _xd.delete("music-error", { source });
        _xd.set("music-player-status", status, { source });
        _xd.set("music-current-track-id", track_id, { source });
        _xd.set("music-current-track", track ?? fallback_track, { source });
        this.storeCurrentPlaylistState(result, source, true);
        _xd.set(
            "music-current-track-title",
            track?._title ?? track?._file_name ?? (result_title || file_path_title || "Playing track"),
            { source }
        );
        this.resetPlaybackProgress(source);
    }

    private updateCurrentTrackTitleFromTracks(source: string) {
        const track_id = this.readXDataString("music-current-track-id");
        const track = track_id ? this.findTrackById(track_id) : null;

        if (!track) {
            return;
        }

        _xd.set("music-current-track", track, { source });
        _xd.set("music-current-track-title", track?._title ?? track?._file_name ?? "Playing track", { source });
    }

    private syncSelectedPlaylist(playlist_id: string, source: string) {
        if (!playlist_id) {
            this.updateSelectedPlaylistDisplay(null, source);
            this.updatePlaylistDisplay(source);
            return;
        }

        _xd.set("music-selected-playlist-id", playlist_id, { source });

        const playlists = _xd.get("music-playlists");

        if (!Array.isArray(playlists)) {
            return;
        }

        const selected_playlist = playlists.find(
            (playlist: any) => playlist?._id === playlist_id
        );

        if (selected_playlist) {
            _xd.set("music-selected-playlist", selected_playlist, { source });
            this.updateSelectedPlaylistDisplay(selected_playlist, source);
        }

        this.updatePlaylistDisplay(source);
    }

    private formatStatusLabel(value: any, fallback = "Active") {
        const status = typeof value === "string"
            ? value.trim().toLowerCase()
            : "";

        if (!status) {
            return fallback;
        }

        if (status === "active") {
            return "Active";
        }

        if (status === "disabled" || status === "inactive") {
            return "Disabled";
        }

        return status
            .split(/[-_\s]+/u)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
    }

    private updateSelectedPlaylistDisplay(playlist: any, source: string, item_count?: number) {
        if (!playlist || typeof playlist !== "object") {
            _xd.set("music-selected-playlist-name", "No playlist selected.", { source });
            _xd.set("music-selected-playlist-status-label", "No selection", { source });
            _xd.set("music-selected-playlist-mood-label", "Mood not set.", { source });
            _xd.set("music-selected-playlist-description-label", "Select a playlist to review tracks.", { source });
            return;
        }

        const name = this.toDisplayString(playlist?._name, "Untitled playlist");
        const mood = this.toDisplayString(playlist?._mood, "");
        const status = this.formatStatusLabel(playlist?._status);
        const description = this.toDisplayString(playlist?._description, "No description provided.");
        const track_count_label = item_count === undefined
            ? ""
            : `${item_count} track${item_count === 1 ? "" : "s"}`;
        const meta = [
            mood ? `Mood: ${mood}` : "",
            track_count_label
        ].filter(Boolean).join(" - ");

        _xd.set("music-selected-playlist-name", name, { source });
        _xd.set("music-selected-playlist-status-label", status, { source });
        _xd.set("music-selected-playlist-mood-label", meta || "Mood not set.", { source });
        _xd.set("music-selected-playlist-description-label", description, { source });
    }

    private updatePlaylistDisplay(source: string) {
        const playlists = this.readXDataArray("music-playlists");
        const selected_playlist_id = this.readXDataString("music-selected-playlist-id");
        const display_playlists = playlists.map((playlist: any) => {
            const playlist_id = typeof playlist?._id === "string" ? playlist._id.trim() : "";
            const mood = this.toDisplayString(playlist?._mood, "");
            const status = this.formatStatusLabel(playlist?._status);
            const is_selected = Boolean(playlist_id && playlist_id === selected_playlist_id);
            const subtitle = [
                mood || "Mood not set",
                status
            ].filter(Boolean).join(" - ");

            return {
                ...playlist,
                _admin_subtitle: subtitle,
                _admin_badge: is_selected ? "Selected" : ""
            };
        });

        _xd.set("music-playlist-cards", display_playlists, { source });
    }

    private formatPlaylistItems(items: any[]) {
        return items.map((item: any) => {
            const raw_order = Number(item?._order);
            const order_label = Number.isFinite(raw_order)
                ? String(raw_order + 1)
                : "";
            const track_title = this.toDisplayString(
                item?._title || item?._file_name,
                "Missing track"
            );
            const track_status_label = item?._enabled === false
                ? "Disabled"
                : "Ready";

            return {
                ...item,
                _order_label: order_label,
                _track_title: track_title,
                _track_status_label: track_status_label
            };
        });
    }

    private storePlaylistItems(items: any[], source: string) {
        _xd.set("music-playlist-items", items, { source });
        _xd.set("music-playlist-items-display", this.formatPlaylistItems(items), { source });
    }

    private findPlaylistById(playlist_id: string) {
        const playlists = this.readXDataArray("music-playlists");

        return playlists.find((playlist: any) => playlist?._id === playlist_id) ?? null;
    }

    private findScheduleById(schedule_id: string) {
        const schedules = this.readXDataArray("music-schedules");
        const target_id = String(schedule_id ?? "").trim();

        return schedules.find((schedule: any) => (
            schedule?._id === schedule_id ||
            schedule?._schedule_id === schedule_id ||
            String(schedule?._id ?? "").trim() === target_id ||
            String(schedule?._schedule_id ?? "").trim() === target_id
        )) ?? null;
    }

    private getScheduleIds(schedules: any[]) {
        return schedules.map((schedule: any) => ({
            _id: schedule?._id ?? "",
            _schedule_id: schedule?._schedule_id ?? ""
        }));
    }

    private formatScheduleDays(value: any) {
        const day_labels: Record<string, string> = {
            sun: "Sun",
            mon: "Mon",
            tue: "Tue",
            wed: "Wed",
            thu: "Thu",
            fri: "Fri",
            sat: "Sat"
        };

        const days = Array.isArray(value)
            ? value
                .map((day: any) => typeof day === "string" ? day.trim().toLowerCase() : "")
                .filter(Boolean)
            : [];

        if (days.length === 0) {
            return "No days";
        }

        return days.map((day) => day_labels[day] ?? day).join(" ");
    }

    private formatScheduleVolume(value: any) {
        if (value === undefined || value === null || value === "") {
            return "Volume: default";
        }

        const parsed = Number(value);

        return Number.isFinite(parsed)
            ? `Volume: ${parsed}`
            : "Volume: default";
    }

    private formatScheduleCards(schedules: any[]) {
        return schedules.map((schedule: any) => {
            const days_label = this.formatScheduleDays(schedule?._days);
            const start = this.toDisplayString(schedule?._start_time, "--:--");
            const end = this.toDisplayString(schedule?._end_time, "--:--");
            const playlist = this.toDisplayString(schedule?._playlist_name, "No playlist");
            const enabled = schedule?._enabled !== false;
            const shuffle_label = schedule?._shuffle === true ? "Shuffle on" : "Shuffle off";
            const priority = this.toDisplayString(schedule?._priority, "0");

            return {
                ...schedule,
                _schedule_time_label: `${days_label} - ${start} to ${end}`,
                _schedule_description: `Playlist: ${playlist}`,
                _schedule_meta: `Status: ${enabled ? "Enabled" : "Disabled"} - ${this.formatScheduleVolume(schedule?._volume)} - ${shuffle_label} - Priority ${priority}`,
                _schedule_status_label: enabled ? "Enabled" : ""
            };
        });
    }

    private storeSchedules(schedules: any[], source: string) {
        _xd.set("music-schedules", schedules, { source });
        _xd.set("music-schedule-cards", this.formatScheduleCards(schedules), { source });
    }

    private clearCreatePlaylistValidation(source: string) {
        _xd.set("music-create-playlist-status", "", { source });

        if (this.readXDataString("music-playlist-status") === "Playlist name is required.") {
            _xd.set("music-playlist-status", "Select a playlist to manage its tracks.", { source });
        }
    }

    private resetCreatePlaylistForm(source: string) {
        _xd.set("music-playlist-name", "", { source });
        _xd.set("music-playlist-description", "", { source });
        _xd.set("music-playlist-mood", "", { source });
        this.setControlValue("playlist-name-input", "");
        this.setControlValue("playlist-description-input", "");
        this.setControlValue("playlist-mood-input", "");
    }

    private setControlValue(object_id: string, value: string) {
        const control = (XUI as any).getObject?.(object_id);

        if (control?.setValue) {
            control.setValue(value, true);
        }

        const dom = control?.dom ?? control?.getDOMObject?.();

        if (dom && "value" in dom) {
            dom.value = value;
        }
    }

    private setControlChecked(object_id: string, checked: boolean) {
        const control = (XUI as any).getObject?.(object_id);
        const dom = control?.dom ?? control?.getDOMObject?.();

        if (dom && "checked" in dom) {
            dom.checked = checked;
        }
    }

    private syncEditPlaylistForm(source: string, playlist: any) {
        const values = {
            "music-edit-playlist-name": this.toDisplayString(playlist?._name, ""),
            "music-edit-playlist-description": this.toDisplayString(playlist?._description, ""),
            "music-edit-playlist-mood": this.toDisplayString(playlist?._mood, ""),
            "music-edit-playlist-status": this.toDisplayString(playlist?._status, "active")
        };

        for (const [key, value] of Object.entries(values)) {
            _xd.set(key, value, { source });
        }

        this.setControlValue("edit-playlist-name-input", values["music-edit-playlist-name"]);
        this.setControlValue("edit-playlist-description-input", values["music-edit-playlist-description"]);
        this.setControlValue("edit-playlist-mood-input", values["music-edit-playlist-mood"]);
        this.setControlValue("edit-playlist-status-select", values["music-edit-playlist-status"]);
    }

    private getScheduleDayConfigs() {
        return [
            { _day: "sun", _xdata_key: "music-schedule-day-sun", _object_id: "schedule-day-sun-checkbox" },
            { _day: "mon", _xdata_key: "music-schedule-day-mon", _object_id: "schedule-day-mon-checkbox" },
            { _day: "tue", _xdata_key: "music-schedule-day-tue", _object_id: "schedule-day-tue-checkbox" },
            { _day: "wed", _xdata_key: "music-schedule-day-wed", _object_id: "schedule-day-wed-checkbox" },
            { _day: "thu", _xdata_key: "music-schedule-day-thu", _object_id: "schedule-day-thu-checkbox" },
            { _day: "fri", _xdata_key: "music-schedule-day-fri", _object_id: "schedule-day-fri-checkbox" },
            { _day: "sat", _xdata_key: "music-schedule-day-sat", _object_id: "schedule-day-sat-checkbox" }
        ];
    }

    private getEditScheduleDayConfigs() {
        return [
            { _day: "sun", _xdata_key: "music-edit-schedule-day-sun", _object_id: "edit-schedule-day-sun-checkbox" },
            { _day: "mon", _xdata_key: "music-edit-schedule-day-mon", _object_id: "edit-schedule-day-mon-checkbox" },
            { _day: "tue", _xdata_key: "music-edit-schedule-day-tue", _object_id: "edit-schedule-day-tue-checkbox" },
            { _day: "wed", _xdata_key: "music-edit-schedule-day-wed", _object_id: "edit-schedule-day-wed-checkbox" },
            { _day: "thu", _xdata_key: "music-edit-schedule-day-thu", _object_id: "edit-schedule-day-thu-checkbox" },
            { _day: "fri", _xdata_key: "music-edit-schedule-day-fri", _object_id: "edit-schedule-day-fri-checkbox" },
            { _day: "sat", _xdata_key: "music-edit-schedule-day-sat", _object_id: "edit-schedule-day-sat-checkbox" }
        ];
    }

    private readScheduleDaySelected(key: string) {
        const value = _xd.get(key);

        return value === true || value === "true";
    }

    private readScheduleDaysFromConfigs(configs: Array<{ _day: string; _xdata_key: string }>) {
        return configs
            .filter((day) => this.readScheduleDaySelected(day._xdata_key))
            .map((day) => day._day);
    }

    private readScheduleDays() {
        return this.readScheduleDaysFromConfigs(this.getScheduleDayConfigs());
    }

    private readEditScheduleDays() {
        return this.readScheduleDaysFromConfigs(this.getEditScheduleDayConfigs());
    }

    private syncScheduleDayCheckboxesFor(configs: Array<{ _xdata_key: string; _object_id: string }>) {
        for (const day of configs) {
            this.setControlChecked(day._object_id, this.readScheduleDaySelected(day._xdata_key));
        }
    }

    private syncScheduleDayCheckboxes() {
        this.syncScheduleDayCheckboxesFor(this.getScheduleDayConfigs());
    }

    private syncEditScheduleDayCheckboxes() {
        this.syncScheduleDayCheckboxesFor(this.getEditScheduleDayConfigs());
    }

    private syncEditScheduleForm(source: string, schedule: any) {
        const schedule_id = this.toDisplayString(schedule?._id, "");
        const playlist_id = this.toDisplayString(schedule?._playlist_id, "");
        const priority = schedule?._priority === undefined || schedule?._priority === null
            ? "0"
            : this.toDisplayString(schedule._priority, "0");
        const volume = schedule?._volume === undefined || schedule?._volume === null
            ? ""
            : this.toDisplayString(schedule._volume, "");
        const enabled = schedule?._enabled === false ? "false" : "true";
        const shuffle = schedule?._shuffle === true ? "true" : "false";
        const values = {
            "music-edit-schedule-id": schedule_id,
            "music-edit-schedule-name": this.toDisplayString(schedule?._name, ""),
            "music-edit-schedule-playlist-id": playlist_id,
            "music-edit-schedule-start-time": this.toDisplayString(schedule?._start_time, ""),
            "music-edit-schedule-end-time": this.toDisplayString(schedule?._end_time, ""),
            "music-edit-schedule-priority": priority,
            "music-edit-schedule-volume": volume,
            "music-edit-schedule-shuffle": shuffle,
            "music-edit-schedule-enabled": enabled
        };

        for (const [key, value] of Object.entries(values)) {
            _xd.set(key, value, { source });
        }

        const selected_days = new Set(
            Array.isArray(schedule?._days)
                ? schedule._days.filter((day: any) => typeof day === "string")
                : []
        );

        for (const day of this.getEditScheduleDayConfigs()) {
            const checked = selected_days.has(day._day);

            _xd.set(day._xdata_key, checked, { source });
            this.setControlChecked(day._object_id, checked);
        }

        this.setControlValue("edit-schedule-name-input", values["music-edit-schedule-name"]);
        this.setControlValue("edit-schedule-playlist-select", playlist_id);
        this.setControlValue("edit-schedule-start-time-input", values["music-edit-schedule-start-time"]);
        this.setControlValue("edit-schedule-end-time-input", values["music-edit-schedule-end-time"]);
        this.setControlValue("edit-schedule-priority-input", priority);
        this.setControlValue("edit-schedule-volume-input", volume);
        this.setControlValue("edit-schedule-shuffle-input", shuffle);
        this.setControlValue("edit-schedule-enabled-input", enabled);
    }

    private initializeDefaultScheduleDay(source: string) {
        const days = this.getScheduleDayConfigs();
        const has_day_value = days.some((day) => {
            const value = _xd.get(day._xdata_key);

            return value !== undefined && value !== null && value !== "";
        });

        if (has_day_value) {
            this.syncScheduleDayCheckboxes();
            return;
        }

        const current_day = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
        const day = days.find((candidate) => candidate._day === current_day);

        if (day) {
            _xd.set(day._xdata_key, true, { source });
        }

        this.syncScheduleDayCheckboxes();
    }

    buildPlaylistOptions(source = "music-player-client.build-playlist-options") {
        const playlists = this.readXDataArray("music-playlists");
        const options = playlists
            .map((playlist: any) => {
                const value = typeof playlist?._id === "string" ? playlist._id.trim() : "";
                const label = typeof playlist?._name === "string" ? playlist._name.trim() : "";

                if (!value) {
                    return null;
                }

                return {
                    value,
                    label
                };
            })
            .filter(Boolean);

        _xd.set("music-playlist-options", options, { source });

        return options;
    }

    private syncPlaylistSelector(source: string) {
        const options = this.buildPlaylistOptions(source);
        let playlist_id = this.readXDataString("music-selected-playlist-id");
        let schedule_playlist_id = this.readXDataString("music-schedule-playlist-id");

        if (!playlist_id && options.length > 0) {
            playlist_id = options[0].value;
            _xd.set("music-selected-playlist-id", playlist_id, { source });
            this.syncSelectedPlaylist(playlist_id, source);
        }

        if (schedule_playlist_id && !options.some((option: any) => option?.value === schedule_playlist_id)) {
            schedule_playlist_id = "";
            _xd.set("music-schedule-playlist-id", "", { source });
        }

        if (!schedule_playlist_id && options.length === 1) {
            schedule_playlist_id = options[0].value;
            _xd.set("music-schedule-playlist-id", schedule_playlist_id, { source });
        }

        const selectors = [
            {
                _id: "playlist-select",
                _value: playlist_id
            },
            {
                _id: "schedule-playlist-select",
                _value: schedule_playlist_id
            },
            {
                _id: "edit-schedule-playlist-select",
                _value: this.readXDataString("music-edit-schedule-playlist-id")
            }
        ];

        for (const selector_config of selectors) {
            const selector = (XUI as any).getObject?.(selector_config._id);

            if (selector?.setOptions) {
                selector.setOptions(options, true);
            }

            if (selector?.setValue) {
                selector.setValue(selector_config._value, true);
            }
        }
    }

    async _list_playlists() {
        const source = "music-player-client.list-playlists";

        try {
            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "list-playlists",
                _params: {}
            });

            const playlists = this.readPlaylistsFromResult(result);

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "List playlists failed.");

                _xlog.error("[music-player-client] error received:", message);
                _xd.set("music-error", message, { source });
                _xd.set("music-playlist-status", message, { source });
                _xd.set("music-playlists", playlists, { source });
                this.syncPlaylistSelector(source);
                this.updatePlaylistDisplay(source);

                return {
                    ...result,
                    _playlists: playlists
                };
            }

            _xd.delete("music-error", { source });
            _xd.set("music-playlists", playlists, { source });
            this.syncPlaylistSelector(source);
            this.updatePlaylistDisplay(source);

            _xlog.log("[music-player-client] playlists loaded:", playlists.length);

            return {
                ...result,
                _playlists: playlists
            };
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `List playlists failed: ${message}`,
                _playlists: []
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "List playlists failed.");
            this.setStringXData("music-playlist-status", result._message, source, "List playlists failed.");
            _xd.set("music-playlists", [], { source });
            this.syncPlaylistSelector(source);
            this.updatePlaylistDisplay(source);

            return result;
        }
    }

    async _init_admin_view() {
        const source = "music-player-client.init-admin-view";

        try {
            const playlists_result = await this._list_playlists();
            this.buildPlaylistOptions(source);
            const schedules_result = await this._list_schedules();
            this.initializeDefaultScheduleDay(source);
            const playlists = Array.isArray(playlists_result?._playlists)
                ? playlists_result._playlists
                : [];
            let playlist_id = this.readXDataString("music-selected-playlist-id");
            let schedule_playlist_id = this.readXDataString("music-schedule-playlist-id");

            if (!playlist_id && playlists.length > 0) {
                const selected_playlist = playlists[0];
                playlist_id = typeof selected_playlist?._id === "string"
                    ? selected_playlist._id.trim()
                    : "";

                if (playlist_id) {
                    _xd.set("music-selected-playlist-id", playlist_id, { source });
                    _xd.set("music-selected-playlist", selected_playlist, { source });
                }
            }

            if (!schedule_playlist_id && playlists.length === 1) {
                schedule_playlist_id = typeof playlists[0]?._id === "string"
                    ? playlists[0]._id.trim()
                    : "";

                if (schedule_playlist_id) {
                    _xd.set("music-schedule-playlist-id", schedule_playlist_id, { source });
                    this.syncPlaylistSelector(source);
                }
            }

            let playlist_details;
            if (playlist_id) {
                playlist_details = await this._get_playlist_details({
                    _params: {
                        _playlist_id: playlist_id
                    }
                });
            }

            this.bindCreatePlaylistModalControls();

            return {
                _ok: playlists_result?._ok !== false && schedules_result?._ok !== false,
                _playlists: playlists,
                _schedules: Array.isArray(schedules_result?._schedules) ? schedules_result._schedules : [],
                _selected_playlist_id: playlist_id,
                _playlist_details: playlist_details
            };
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Init admin view failed: ${message}`
            };

            _xlog.error("[music-player-client] init admin view failed:", err);
            this.setStringXData("music-error", result._message, source, "Init admin view failed.");
            this.setStringXData("music-playlist-status", result._message, source, "Init admin view failed.");

            return result;
        }
    }

    async _open_create_playlist_modal() {
        const source = "music-player-client.open-create-playlist-modal";

        this.clearCreatePlaylistValidation(source);
        XUI.show("create-playlist-modal");

        return {
            _ok: true,
            _modal_open: true
        };
    }

    async _cancel_create_playlist() {
        const source = "music-player-client.cancel-create-playlist";

        this.clearCreatePlaylistValidation(source);
        this.resetCreatePlaylistForm(source);
        this.closeObject("create-playlist-modal");

        return {
            _ok: true,
            _cancelled: true
        };
    }

    async _create_playlist() {
        const source = "music-player-client.create-playlist";

        try {
            const name = this.readXDataOrControlString("music-playlist-name", "playlist-name-input");
            const description = this.readXDataOrControlString(
                "music-playlist-description",
                "playlist-description-input"
            );
            const mood = this.readXDataOrControlString("music-playlist-mood", "playlist-mood-input");

            this.clearCreatePlaylistValidation(source);

            if (!name) {
                const result = {
                    _ok: false,
                    _message: "Playlist name is required."
                };

                this.setStringXData(
                    "music-create-playlist-status",
                    result._message,
                    source,
                    "Playlist name is required."
                );

                return result;
            }

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "create-playlist",
                _params: {
                    _name: name,
                    _description: description,
                    _mood: mood
                }
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Create playlist failed.");

                _xlog.error("[music-player-client] error received:", message);
                _xd.set("music-error", message, { source });
                _xd.set("music-create-playlist-status", message, { source });

                return result;
            }

            const status = this.getResultMessage(result, "Playlist created.");

            _xd.delete("music-error", { source });
            this.clearCreatePlaylistValidation(source);
            _xd.set("music-playlist-status", status, { source });
            this.resetCreatePlaylistForm(source);

            const created_playlist_id = typeof result?._playlist?._id === "string"
                ? result._playlist._id.trim()
                : "";

            if (created_playlist_id) {
                _xd.set("music-selected-playlist-id", created_playlist_id, { source });
                _xd.set("music-selected-playlist", result._playlist, { source });
            }

            await this._list_playlists();
            if (created_playlist_id) {
                await this._get_playlist_details({
                    _params: {
                        _playlist_id: created_playlist_id
                    }
                });
            }
            this.closeObject("create-playlist-modal");

            _xlog.log("[music-player-client] playlist created:", result?._playlist?._id);

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Create playlist failed: ${message}`
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Create playlist failed.");
            this.setStringXData("music-create-playlist-status", result._message, source, "Create playlist failed.");

            return result;
        }
    }

    async _prepare_edit_playlist() {
        const source = "music-player-client.prepare-edit-playlist";
        const playlist_id = this.readXDataString("music-selected-playlist-id");
        const selected_playlist = _xd.get("music-selected-playlist");
        const playlist = selected_playlist && typeof selected_playlist === "object"
            ? selected_playlist
            : this.findPlaylistById(playlist_id);

        if (!playlist_id || !playlist) {
            const result = {
                _ok: false,
                _message: "Select a playlist before editing."
            };

            this.setStringXData("music-error", result._message, source, "Select a playlist before editing.");
            this.setStringXData("music-playlist-status", result._message, source, "Select a playlist before editing.");

            return result;
        }

        this.syncEditPlaylistForm(source, playlist);
        XUI.show("edit-playlist-modal");

        return {
            _ok: true,
            _playlist: playlist,
            _modal_open: true
        };
    }

    async _edit_playlist() {
        const source = "music-player-client.edit-playlist";

        try {
            const playlist_id = this.readXDataString("music-selected-playlist-id");

            if (!playlist_id) {
                const result = {
                    _ok: false,
                    _message: "Select a playlist before editing."
                };

                this.setStringXData("music-error", result._message, source, "Select a playlist before editing.");
                this.setStringXData("music-playlist-status", result._message, source, "Select a playlist before editing.");

                return result;
            }

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "update-playlist",
                _params: {
                    _playlist_id: playlist_id,
                    _name: this.readXDataString("music-edit-playlist-name"),
                    _description: this.readXDataString("music-edit-playlist-description"),
                    _mood: this.readXDataString("music-edit-playlist-mood"),
                    _status: this.readXDataString("music-edit-playlist-status")
                }
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Update playlist failed.");

                _xlog.error("[music-player-client] error received:", message);
                _xd.set("music-error", message, { source });
                _xd.set("music-playlist-status", message, { source });

                return result;
            }

            _xd.delete("music-error", { source });
            if (result?._playlist) {
                _xd.set("music-selected-playlist", result._playlist, { source });
            }

            await this._list_playlists();
            await this._get_playlist_details({
                _params: {
                    _playlist_id: playlist_id
                }
            });
            _xd.set("music-playlist-status", "Playlist updated.", { source });
            XUI.hide("edit-playlist-modal");

            _xlog.log("[music-player-client] playlist updated:", playlist_id);

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Update playlist failed: ${message}`
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Update playlist failed.");
            this.setStringXData("music-playlist-status", result._message, source, "Update playlist failed.");

            return result;
        }
    }

    async _add_track_to_playlist(xcmd?: ClientXCommand) {
        const source = "music-player-client.add-track-to-playlist";

        try {
            const playlist_id = this.readXDataString("music-selected-playlist-id");
            const track_id = this.readParamString(xcmd, "_track_id");

            _xlog.log("[music-player-client] add-track-to-playlist selected playlist id:", playlist_id);
            _xlog.log("[music-player-client] add-track-to-playlist received _track_id:", track_id);

            if (!playlist_id) {
                const result = {
                    _ok: false,
                    _message: "Select a playlist before adding tracks."
                };

                this.setStringXData("music-error", result._message, source, "Select a playlist before adding tracks.");
                this.setStringXData("music-playlist-status", result._message, source, "Select a playlist before adding tracks.");
                _xlog.error("[music-player-client] add-track-to-playlist result:", result);

                return result;
            }

            if (!track_id) {
                const result = {
                    _ok: false,
                    _message: "Track id is missing."
                };

                this.setStringXData("music-error", result._message, source, "Track id is missing.");
                this.setStringXData("music-playlist-status", result._message, source, "Track id is missing.");
                _xlog.error("[music-player-client] add-track-to-playlist result:", result);

                return result;
            }

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "add-track-to-playlist",
                _params: {
                    _playlist_id: playlist_id,
                    _track_id: track_id
                }
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Add track to playlist failed.");

                _xlog.error("[music-player-client] error received:", message);
                _xlog.error("[music-player-client] add-track-to-playlist result:", result);
                _xd.set("music-error", message, { source });
                _xd.set("music-playlist-status", message, { source });

                return result;
            }

            _xd.delete("music-error", { source });
            _xd.set("music-playlist-status", "Track added to playlist.", { source });
            await this._get_playlist_details({
                _params: {
                    _playlist_id: playlist_id
                }
            });

            _xlog.log("[music-player-client] add-track-to-playlist result:", result);
            _xlog.log("[music-player-client] track added to playlist:", {
                _playlist_id: playlist_id,
                _track_id: track_id
            });

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Add track to playlist failed: ${message}`
            };

            _xlog.error("[music-player-client] error received:", err);
            _xlog.error("[music-player-client] add-track-to-playlist error:", err);
            this.setStringXData("music-error", result._message, source, "Add track to playlist failed.");
            this.setStringXData("music-playlist-status", result._message, source, "Add track to playlist failed.");

            return result;
        }
    }

    async _open_add_tracks_modal() {
        const source = "music-player-client.open-add-tracks-modal";
        const playlist_id = this.readXDataString("music-selected-playlist-id");

        _xlog.log("[music-player-client] open-add-tracks-modal selected playlist id:", playlist_id);

        if (!playlist_id) {
            const result = {
                _ok: false,
                _message: "Select a playlist before adding tracks."
            };

            this.setStringXData("music-error", result._message, source, "Select a playlist before adding tracks.");
            this.setStringXData("music-playlist-status", result._message, source, "Select a playlist before adding tracks.");
            _xlog.error("[music-player-client] open-add-tracks-modal result:", result);

            return result;
        }

        const result = await this._list_tracks();

        _xlog.log("[music-player-client] open-add-tracks-modal list-tracks result:", result);

        if (result?._ok === false) {
            return result;
        }

        XUI.show("music-library-modal");

        return {
            ...result,
            _modal_open: true
        };
    }

    async _list_playlist_items(xcmd?: ClientXCommand) {
        return this._get_playlist_details(xcmd);
    }

    async _get_playlist_details(xcmd?: ClientXCommand) {
        const source = "music-player-client.get-playlist-details";

        try {
            const playlist_id =
                this.readParamString(xcmd, "_playlist_id") ||
                this.readXDataString("music-selected-playlist-id");

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "get-playlist-details",
                _params: {
                    _playlist_id: playlist_id
                }
            });

            const playlist_items = Array.isArray(result?._items)
                ? result._items
                : [];

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Get playlist details failed.");

                _xlog.error("[music-player-client] error received:", message);
                _xd.set("music-error", message, { source });
                _xd.set("music-playlist-status", message, { source });
                this.storePlaylistItems(playlist_items, source);
                _xd.set("music-selected-playlist", result?._playlist ?? null, { source });
                this.updateSelectedPlaylistDisplay(result?._playlist ?? null, source, playlist_items.length);

                return {
                    ...result,
                    _items: playlist_items
                };
            }

            _xd.delete("music-error", { source });
            this.syncSelectedPlaylist(playlist_id, source);
            if (result?._playlist) {
                _xd.set("music-selected-playlist", result._playlist, { source });
            }
            this.storePlaylistItems(playlist_items, source);
            this.updateSelectedPlaylistDisplay(result?._playlist ?? _xd.get("music-selected-playlist"), source, playlist_items.length);

            _xlog.log("[music-player-client] playlist items loaded:", playlist_items.length);

            return {
                ...result,
                _items: playlist_items
            };
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Get playlist details failed: ${message}`,
                _items: []
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Get playlist details failed.");
            this.setStringXData("music-playlist-status", result._message, source, "Get playlist details failed.");
            this.storePlaylistItems([], source);

            return result;
        }
    }

    async _start_playlist(xcmd?: ClientXCommand) {
        const source = "music-player-client.start-playlist";

        try {
            const playlist_id = this.readXDataString("music-selected-playlist-id");

            if (!playlist_id) {
                const result = {
                    _ok: false,
                    _message: "Playlist id is required."
                };

                this.setStringXData("music-error", result._message, source, "Start playlist failed.");
                this.storePlaybackResult(result, source, "Start playlist failed.");

                return result;
            }

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "start-playlist",
                _params: {
                    _playlist_id: playlist_id
                }
            });

            this.storePlaybackResult(result, source, "Playing playlist.");

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Start playlist failed.");

                _xlog.error("[music-player-client] error received:", message);
                this.setStringXData("music-error", message, source, "Start playlist failed.");
                _xd.set("music-player-status", "error", { source });

                return result;
            }

            _xd.delete("music-error", { source });
            this.storePlayingTrackResult(result, source, "Playing playlist.");
            this.updatePlaybackUI();
            this.startPlayerStatePolling();

            _xlog.log("[music-player-client] playlist started:", playlist_id);

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Start playlist failed: ${message}`
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Start playlist failed.");
            _xd.set("music-player-status", "error", { source });
            this.storePlaybackResult(result, source, "Start playlist failed.");

            return result;
        }
    }

    async _get_current_playlist_state() {
        const source = "music-player-client.get-current-playlist-state";

        try {
            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "get-current-playlist-state",
                _params: {}
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Get playlist state failed.");

                _xlog.error("[music-player-client] error received:", message);
                this.setStringXData("music-error", message, source, "Get playlist state failed.");

                return result;
            }

            this.storeCurrentPlaylistState(result, source, true);

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Get playlist state failed: ${message}`
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Get playlist state failed.");

            return result;
        }
    }

    async _remove_playlist_item(xcmd?: ClientXCommand) {
        const source = "music-player-client.remove-playlist-item";

        try {
            const playlist_item_id = this.readParamString(xcmd, "_playlist_item_id");

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "remove-playlist-item",
                _params: {
                    _playlist_item_id: playlist_item_id
                }
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Remove playlist item failed.");

                _xlog.error("[music-player-client] error received:", message);
                _xd.set("music-error", message, { source });
                _xd.set("music-playlist-status", message, { source });

                return result;
            }

            const status = this.getResultMessage(result, "Playlist item removed.");

            _xd.delete("music-error", { source });
            _xd.set("music-playlist-status", status, { source });
            await this._get_playlist_details();

            _xlog.log("[music-player-client] playlist item removed:", playlist_item_id);

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Remove playlist item failed: ${message}`
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Remove playlist item failed.");
            this.setStringXData("music-playlist-status", result._message, source, "Remove playlist item failed.");

            return result;
        }
    }

    async _create_schedule() {
        const source = "music-player-client.create-schedule";

        try {
            const volume = this.readXDataOptionalNumber("music-schedule-volume");
            let playlist_id = this.readXDataString("music-schedule-playlist-id");
            const playlists = this.readXDataArray("music-playlists");
            const playlist_options = this.readXDataArray("music-playlist-options");
            let playlist = playlist_id ? this.findPlaylistById(playlist_id) : null;
            let playlist_id_valid_by_playlists = Boolean(playlist);
            let playlist_id_valid_by_options = playlist_id
                ? playlist_options.some((option: any) => option?.value === playlist_id)
                : false;
            let playlist_id_valid_by_server = false;

            _xlog.log("[music-player-client] create-schedule playlist selection:", {
                _music_schedule_playlist_id: playlist_id,
                _music_playlist_options: playlist_options,
                _music_playlists_length: playlists.length
            });

            if (!playlist_id && playlists.length === 1) {
                playlist_id = typeof playlists[0]?._id === "string"
                    ? playlists[0]._id.trim()
                    : "";

                if (playlist_id) {
                    _xd.set("music-schedule-playlist-id", playlist_id, { source });
                    this.syncPlaylistSelector(source);
                    playlist = playlists[0];
                    playlist_id_valid_by_playlists = true;
                    playlist_id_valid_by_options = playlist_options.some((option: any) => option?.value === playlist_id);
                }
            }

            if (playlist_id && !playlist_id_valid_by_playlists && !playlist_id_valid_by_options) {
                await this._list_playlists();
                playlist = this.findPlaylistById(playlist_id);
                playlist_id_valid_by_playlists = Boolean(playlist);
                playlist_id_valid_by_options = this.readXDataArray("music-playlist-options").some(
                    (option: any) => option?.value === playlist_id
                );
                playlist_id_valid_by_server = playlist_id_valid_by_playlists;
            }

            _xlog.log("[music-player-client] selected id valid by playlists/options/server:", {
                _playlist_id: playlist_id,
                _valid_by_playlists: playlist_id_valid_by_playlists,
                _valid_by_options: playlist_id_valid_by_options,
                _valid_by_server: playlist_id_valid_by_server
            });

            if (!playlist_id || (!playlist_id_valid_by_playlists && !playlist_id_valid_by_options)) {
                const result = {
                    _ok: false,
                    _message: "Select a valid playlist before creating a schedule."
                };

                this.setStringXData("music-error", result._message, source, "Create schedule failed.");
                this.setStringXData("music-schedule-status", result._message, source, "Create schedule failed.");

                return result;
            }

            const days = this.readScheduleDays();

            if (days.length === 0) {
                const result = {
                    _ok: false,
                    _message: "Select at least one day."
                };

                this.setStringXData("music-error", result._message, source, "Create schedule failed.");
                this.setStringXData("music-schedule-status", result._message, source, "Create schedule failed.");

                return result;
            }

            const params: Record<string, any> = {
                _playlist_id: playlist_id,
                _name: this.readXDataString("music-schedule-name"),
                _days: days,
                _start_time: this.readXDataString("music-schedule-start-time"),
                _end_time: this.readXDataString("music-schedule-end-time"),
                _priority: this.readXDataNumber("music-schedule-priority", 0),
                _enabled: this.readXDataBoolean("music-schedule-enabled", true),
                _shuffle: this.readXDataBoolean("music-schedule-shuffle", false)
            };

            if (volume !== undefined) {
                params._volume = volume;
            }

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "create-schedule",
                _params: params
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Create schedule failed.");

                _xlog.error("[music-player-client] error received:", message);
                _xd.set("music-error", message, { source });
                _xd.set("music-schedule-status", message, { source });

                return result;
            }

            const status = this.getResultMessage(result, "Schedule created.");

            _xd.delete("music-error", { source });
            _xd.set("music-schedule-status", status, { source });
            await this._list_schedules();

            _xlog.log("[music-player-client] schedule created:", result?._schedule?._id);

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Create schedule failed: ${message}`
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Create schedule failed.");
            this.setStringXData("music-schedule-status", result._message, source, "Create schedule failed.");

            return result;
        }
    }

    async _prepare_edit_schedule(xcmd?: ClientXCommand) {
        const source = "music-player-client.prepare-edit-schedule";
        const schedule_id = this.readParamString(xcmd, "_schedule_id");

        if (!schedule_id) {
            const result = {
                _ok: false,
                _message: "Schedule id is required."
            };

            this.setStringXData("music-error", result._message, source, "Schedule id is required.");
            this.setStringXData("music-schedule-status", result._message, source, "Schedule id is required.");

            return result;
        }

        const schedules = this.readXDataArray("music-schedules");
        _xlog.log("[music-player-client] prepare-edit-schedule received:", {
            _schedule_id: schedule_id
        });
        _xlog.log("[music-player-client] prepare-edit-schedule schedules:", {
            _count: schedules.length,
            _ids: this.getScheduleIds(schedules)
        });

        let schedule = this.findScheduleById(schedule_id);

        if (!schedule) {
            await this._list_schedules();
            const refreshed_schedules = this.readXDataArray("music-schedules");
            _xlog.log("[music-player-client] prepare-edit-schedule refreshed schedules:", {
                _count: refreshed_schedules.length,
                _ids: this.getScheduleIds(refreshed_schedules)
            });
            schedule = this.findScheduleById(schedule_id);
        }

        if (!schedule) {
            const result = {
                _ok: false,
                _message: "Schedule not found."
            };

            this.setStringXData("music-error", result._message, source, "Schedule not found.");
            this.setStringXData("music-schedule-status", result._message, source, "Schedule not found.");

            return result;
        }

        this.buildPlaylistOptions(source);
        this.syncEditScheduleForm(source, schedule);
        this.syncPlaylistSelector(source);
        XUI.show("edit-schedule-modal");

        return {
            _ok: true,
            _schedule: schedule,
            _modal_open: true
        };
    }

    async _edit_schedule() {
        const source = "music-player-client.edit-schedule";

        try {
            const schedule_id = this.readXDataString("music-edit-schedule-id");
            const playlist_id = this.readXDataString("music-edit-schedule-playlist-id");
            const name = this.readXDataString("music-edit-schedule-name");
            const start_time = this.readXDataString("music-edit-schedule-start-time");
            const end_time = this.readXDataString("music-edit-schedule-end-time");
            const days = this.readEditScheduleDays();

            if (!schedule_id) {
                const result = {
                    _ok: false,
                    _message: "Schedule id is required."
                };

                this.setStringXData("music-error", result._message, source, "Edit schedule failed.");
                this.setStringXData("music-schedule-status", result._message, source, "Edit schedule failed.");

                return result;
            }

            if (!name) {
                const result = {
                    _ok: false,
                    _message: "Schedule name is required."
                };

                this.setStringXData("music-error", result._message, source, "Edit schedule failed.");
                this.setStringXData("music-schedule-status", result._message, source, "Edit schedule failed.");

                return result;
            }

            if (!playlist_id || !this.findPlaylistById(playlist_id)) {
                const result = {
                    _ok: false,
                    _message: "Select a valid playlist."
                };

                this.setStringXData("music-error", result._message, source, "Edit schedule failed.");
                this.setStringXData("music-schedule-status", result._message, source, "Edit schedule failed.");

                return result;
            }

            if (days.length === 0) {
                const result = {
                    _ok: false,
                    _message: "Select at least one day."
                };

                this.setStringXData("music-error", result._message, source, "Edit schedule failed.");
                this.setStringXData("music-schedule-status", result._message, source, "Edit schedule failed.");

                return result;
            }

            if (!start_time || !end_time) {
                const result = {
                    _ok: false,
                    _message: "Schedule start and end time are required."
                };

                this.setStringXData("music-error", result._message, source, "Edit schedule failed.");
                this.setStringXData("music-schedule-status", result._message, source, "Edit schedule failed.");

                return result;
            }

            const volume = this.readXDataOptionalNumber("music-edit-schedule-volume");
            const params: Record<string, any> = {
                _schedule_id: schedule_id,
                _name: name,
                _playlist_id: playlist_id,
                _days: days,
                _start_time: start_time,
                _end_time: end_time,
                _priority: this.readXDataNumber("music-edit-schedule-priority", 0),
                _enabled: this.readXDataBoolean("music-edit-schedule-enabled", true),
                _shuffle: this.readXDataBoolean("music-edit-schedule-shuffle", false)
            };

            if (volume !== undefined) {
                params._volume = volume;
            }

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "update-schedule",
                _params: params
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Edit schedule failed.");

                _xlog.error("[music-player-client] error received:", message);
                _xd.set("music-error", message, { source });
                _xd.set("music-schedule-status", message, { source });

                return result;
            }

            _xd.delete("music-error", { source });
            await this._list_schedules();
            await this._get_schedule_runtime_state();
            _xd.set("music-schedule-status", "Schedule updated.", { source });
            XUI.hide("edit-schedule-modal");

            _xlog.log("[music-player-client] schedule updated:", schedule_id);

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Edit schedule failed: ${message}`
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Edit schedule failed.");
            this.setStringXData("music-schedule-status", result._message, source, "Edit schedule failed.");

            return result;
        }
    }

    async _list_schedules() {
        const source = "music-player-client.list-schedules";

        try {
            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "list-schedules",
                _params: {}
            });

            const schedules = Array.isArray(result?._schedules) ? result._schedules : [];

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "List schedules failed.");

                _xlog.error("[music-player-client] error received:", message);
                _xd.set("music-error", message, { source });
                _xd.set("music-schedule-status", message, { source });
                this.storeSchedules(schedules, source);

                return {
                    ...result,
                    _schedules: schedules
                };
            }

            _xd.delete("music-error", { source });
            this.storeSchedules(schedules, source);

            _xlog.log("[music-player-client] schedules loaded:", schedules.length);

            return {
                ...result,
                _schedules: schedules
            };
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `List schedules failed: ${message}`,
                _schedules: []
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "List schedules failed.");
            this.setStringXData("music-schedule-status", result._message, source, "List schedules failed.");
            this.storeSchedules([], source);

            return result;
        }
    }

    async _get_schedule_runtime_state(xcmd?: ClientXCommand) {
        const source = "music-player-client.get-schedule-runtime-state";
        const suppress_transient_errors =
            xcmd?._params?._suppress_transient_errors === true;

        try {
            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "get-schedule-runtime-state",
                _params: {}
            });

            if (result?._ok === false) {
                if (suppress_transient_errors && this.isTransientPlayerStateError(result)) {
                    return result;
                }

                const message = this.getResultMessage(result, "Get schedule runtime state failed.");

                _xlog.error("[music-player-client] error received:", message);
                this.storeScheduleRuntimeState({}, source);

                return result;
            }

            this.storeScheduleRuntimeState(result, source);

            return result;
        } catch (err: any) {
            const error_code = this.readErrorCode(err);
            const message = error_code || this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Get schedule runtime state failed: ${message}`,
                _code: error_code
            };

            if (suppress_transient_errors && this.isTransientPlayerStateError(result)) {
                return result;
            }

            _xlog.error("[music-player-client] error received:", err);
            this.storeScheduleRuntimeState({}, source);

            return result;
        }
    }

    async _set_schedule_enabled(xcmd?: ClientXCommand) {
        const source = "music-player-client.set-schedule-enabled";

        try {
            const schedule_id = this.readParamString(xcmd, "_schedule_id");
            const enabled = this.readParamBoolean(xcmd, "_enabled", false);

            if (!schedule_id) {
                const result = {
                    _ok: false,
                    _message: "Schedule id is required."
                };

                this.setStringXData("music-error", result._message, source, "Set schedule enabled failed.");
                this.setStringXData("music-schedule-status", result._message, source, "Set schedule enabled failed.");

                return result;
            }

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "set-schedule-enabled",
                _params: {
                    _schedule_id: schedule_id,
                    _enabled: enabled
                }
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Set schedule enabled failed.");

                _xlog.error("[music-player-client] error received:", message);
                _xd.set("music-error", message, { source });
                _xd.set("music-schedule-status", message, { source });

                return result;
            }

            const status = this.getResultMessage(
                result,
                enabled ? "Schedule enabled." : "Schedule disabled."
            );

            _xd.delete("music-error", { source });
            _xd.set("music-schedule-status", status, { source });
            await this._list_schedules();
            await this._get_schedule_runtime_state();

            _xlog.log("[music-player-client] schedule enabled updated:", {
                _schedule_id: schedule_id,
                _enabled: enabled
            });

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Set schedule enabled failed: ${message}`
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Set schedule enabled failed.");
            this.setStringXData("music-schedule-status", result._message, source, "Set schedule enabled failed.");

            return result;
        }
    }

    async _prepare_delete_schedule(xcmd?: ClientXCommand) {
        const source = "music-player-client.prepare-delete-schedule";
        const schedule_id = this.readParamString(xcmd, "_schedule_id");

        if (!schedule_id) {
            const result = {
                _ok: false,
                _message: "Schedule id is required."
            };

            this.setStringXData("music-error", result._message, source, "Schedule id is required.");
            this.setStringXData("music-schedule-status", result._message, source, "Schedule id is required.");

            return result;
        }

        let schedule = this.findScheduleById(schedule_id);

        if (!schedule) {
            await this._list_schedules();
            schedule = this.findScheduleById(schedule_id);
        }

        _xd.set("music-delete-schedule-id", schedule_id, { source });
        _xd.set(
            "music-delete-schedule-name",
            this.toDisplayString(schedule?._name, ""),
            { source }
        );
        XUI.show("delete-schedule-confirm-modal");

        return {
            _ok: true,
            _schedule_id: schedule_id,
            _schedule: schedule,
            _modal_open: true
        };
    }

    async _confirm_delete_schedule() {
        const source = "music-player-client.confirm-delete-schedule";
        const schedule_id = this.readXDataString("music-delete-schedule-id");

        if (!schedule_id) {
            const result = {
                _ok: false,
                _message: "Schedule id is required."
            };

            this.setStringXData("music-error", result._message, source, "Schedule id is required.");
            this.setStringXData("music-schedule-status", result._message, source, "Schedule id is required.");

            return result;
        }

        const result = await this._delete_schedule({
            _params: {
                _schedule_id: schedule_id
            }
        });

        if (result?._ok === false) {
            return result;
        }

        _xd.set("music-delete-schedule-id", "", { source });
        _xd.set("music-delete-schedule-name", "", { source });
        XUI.hide("delete-schedule-confirm-modal");

        return result;
    }

    async _delete_schedule(xcmd?: ClientXCommand) {
        const source = "music-player-client.delete-schedule";

        try {
            const schedule_id = this.readParamString(xcmd, "_schedule_id");

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "delete-schedule",
                _params: {
                    _schedule_id: schedule_id
                }
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Delete schedule failed.");

                _xlog.error("[music-player-client] error received:", message);
                _xd.set("music-error", message, { source });
                _xd.set("music-schedule-status", message, { source });

                return result;
            }

            const status = this.getResultMessage(result, "Schedule deleted.");

            _xd.delete("music-error", { source });
            _xd.set("music-schedule-status", status, { source });
            await this._list_schedules();

            _xlog.log("[music-player-client] schedule deleted:", schedule_id);

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Delete schedule failed: ${message}`
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Delete schedule failed.");
            this.setStringXData("music-schedule-status", result._message, source, "Delete schedule failed.");

            return result;
        }
    }

    async _init_player_view() {
        const source = "music-player-client.init-player-view";
        const max_retries = 5;
        const retry_delay_ms = 300;

        this.storeScheduleRuntimeState({}, source);
        this.startScheduleStatePolling();
        this.updatePlaybackUI();

        const list_result = await this._list_tracks({
            _params: {
                _suppress_wormhole_not_ready: true
            }
        });
        await this._list_playlists();

        let result: any;

        for (let attempt = 0; attempt <= max_retries; attempt += 1) {
            result = await this._get_player_state({
                _params: {
                    _suppress_wormhole_not_ready: true
                }
            });

            if (result?._ok !== false) {
                if (this.isWormholeNotReadyError(list_result)) {
                    await this._list_tracks({
                        _params: {
                            _suppress_wormhole_not_ready: true
                        }
                    });
                }

                this.updateCurrentTrackTitleFromTracks(source);
                this.updatePlaybackUI();
                this.startScheduleStatePolling();

                return result;
            }

            if (!this.isWormholeNotReadyError(result)) {
                this.updatePlaybackUI();

                return result;
            }

            if (attempt < max_retries) {
                await this.delay(retry_delay_ms);
            }
        }

        const message = this.getResultMessage(result, "Get player state failed.");

        _xlog.error("[music-player-client] player init failed:", message);
        this.setStringXData("music-error", message, source, "Get player state failed.");
        _xd.set("music-player-status", "error", { source });
        this.storePlaybackResult(result, source, "Get player state failed.");
        this.stopPlayerStatePolling();
        this.updatePlaybackUI();

        return result;
    }

    async _play_first_track() {
        const source = "music-player-client.play-first-track";

        try {
            if (this.readXDataString("music-player-status") === "paused") {
                return this._resume_playback();
            }

            let tracks = this.readXDataArray("music-tracks");

            if (tracks.length === 0) {
                await this._list_tracks();
                tracks = this.readXDataArray("music-tracks");
            }

            const first_track = tracks[0];
            const track_id = typeof first_track?._id === "string"
                ? first_track._id.trim()
                : "";

            if (!track_id) {
                const result = {
                    _ok: false,
                    _message: "No playable tracks found."
                };

                this.setStringXData("music-error", result._message, source, "No playable tracks found.");
                _xd.set("music-player-status", "error", { source });
                this.storePlaybackResult(result, source, "No playable tracks found.");

                return result;
            }

            const result = await this._play_track({
                _params: {
                    _track_id: track_id
                }
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Play first track failed.");

                this.setStringXData("music-error", message, source, "Play first track failed.");
                _xd.set("music-player-status", "error", { source });
                this.storePlaybackResult(result, source, message);

                return result;
            }

            _xd.delete("music-error", { source });
            _xd.set("music-current-track", first_track, { source });
            _xd.set("music-current-track-title", first_track?._title ?? first_track?._file_name ?? "Playing track", { source });
            this.clearCurrentPlaylistXData(source);
            this.storePlaybackResult(result, source, "Playing track.");
            _xd.set("music-player-status", this.getResultStatus(result, "playing"), { source });
            this.resetPlaybackProgress(source);
            this.startPlayerStatePolling();
            this.updatePlaybackUI();

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Play first track failed: ${message}`
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Play first track failed.");
            _xd.set("music-player-status", "error", { source });
            this.storePlaybackResult(result, source, "Play first track failed.");

            return result;
        }
    }

    async _play_track(xcmd?: ClientXCommand) {
        const source = "music-player-client.play-track";

        try {
            const track_id = this.readParamString(xcmd, "_track_id");

            if (!track_id) {
                const result = {
                    _ok: false,
                    _message: "Track id is required."
                };

                this.setStringXData("music-error", result._message, source, "Track id is required.");
                _xd.set("music-player-status", "error", { source });
                this.storePlaybackResult(result, source, "Track id is required.");

                return result;
            }

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "play-track",
                _params: {
                    _track_id: track_id
                }
            });

            this.storePlaybackResult(result, source, "Playing track.");

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Play track failed.");

                _xlog.error("[music-player-client] error received:", message);
                this.setStringXData("music-error", message, source, "Play track failed.");
                _xd.set("music-player-status", "error", { source });

                return result;
            }

            const track = this.findTrackById(track_id);

            this.storePlayingTrackResult(
                {
                    ...result,
                    _track_id: track_id,
                    _title: track?._title ?? track?._file_name ?? result?._title
                },
                source,
                "Playing track."
            );

            this.updatePlaybackUI();
            this.startPlayerStatePolling();

            _xlog.log("[music-player-client] playing track:", track_id);

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Play track failed: ${message}`
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Play track failed.");
            _xd.set("music-player-status", "error", { source });
            this.storePlaybackResult(result, source, "Play track failed.");

            return result;
        }
    }

    async _next_track() {
        const source = "music-player-client.next-track";

        try {
            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "next-track",
                _params: {}
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Next track failed.");

                _xlog.error("[music-player-client] error received:", message);
                this.setStringXData("music-error", message, source, "Next track failed.");
                _xd.set("music-player-status", "error", { source });
                this.storePlaybackResult(result, source, "Next track failed.");

                return result;
            }

            this.storePlayingTrackResult(result, source, "Playing next track.");
            this.updatePlaybackUI();
            this.startPlayerStatePolling();

            _xlog.log("[music-player-client] next track:", result?._track_id);

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Next track failed: ${message}`,
                _status: "error"
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Next track failed.");
            _xd.set("music-player-status", "error", { source });
            this.storePlaybackResult(result, source, "Next track failed.");

            return result;
        }
    }

    async _previous_track() {
        const source = "music-player-client.previous-track";

        try {
            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "previous-track",
                _params: {}
            });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Previous track failed.");

                _xlog.error("[music-player-client] error received:", message);
                this.setStringXData("music-error", message, source, "Previous track failed.");
                _xd.set("music-player-status", "error", { source });
                this.storePlaybackResult(result, source, "Previous track failed.");

                return result;
            }

            this.storePlayingTrackResult(result, source, "Playing previous track.");
            this.updatePlaybackUI();
            this.startPlayerStatePolling();

            _xlog.log("[music-player-client] previous track:", result?._track_id);

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Previous track failed: ${message}`,
                _status: "error"
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Previous track failed.");
            _xd.set("music-player-status", "error", { source });
            this.storePlaybackResult(result, source, "Previous track failed.");

            return result;
        }
    }

    async _stop_playback() {
        const source = "music-player-client.stop-playback";

        try {
            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "stop-playback",
                _params: {}
            });

            this.storePlaybackResult(result, source, "Playback stopped.");

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Stop playback failed.");

                _xlog.error("[music-player-client] error received:", message);
                this.setStringXData("music-error", message, source, "Stop playback failed.");
                _xd.set("music-player-status", "error", { source });

                return result;
            }

            _xd.delete("music-error", { source });
            _xd.set("music-player-status", "stopped", { source });
            _xd.set("music-current-track", null, { source });
            _xd.set("music-current-track-id", "", { source });
            _xd.set("music-current-track-title", "No track playing", { source });
            this.clearCurrentPlaylistXData(source);
            this.resetPlaybackProgress(source);
            this.stopPlayerStatePolling();
            this.updatePlaybackUI();
            this.updateProgressBar();

            _xlog.log("[music-player-client] playback stopped");

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Stop playback failed: ${message}`
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Stop playback failed.");
            _xd.set("music-player-status", "error", { source });
            this.storePlaybackResult(result, source, "Stop playback failed.");

            return result;
        }
    }

    async _pause_playback() {
        const source = "music-player-client.pause-playback";

        try {
            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "pause-playback",
                _params: {}
            });

            this.storePlaybackResult(result, source, "Playback paused.");

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Pause playback failed.");

                _xlog.error("[music-player-client] error received:", message);
                this.setStringXData("music-error", message, source, "Pause playback failed.");
                _xd.set("music-player-status", "error", { source });

                return result;
            }

            _xd.delete("music-error", { source });
            _xd.set("music-player-status", "paused", { source });
            this.updatePlaybackUI();

            _xlog.log("[music-player-client] playback paused");

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Pause playback failed: ${message}`,
                _status: "error"
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Pause playback failed.");
            _xd.set("music-player-status", "error", { source });
            this.storePlaybackResult(result, source, "Pause playback failed.");

            return result;
        }
    }

    async _resume_playback() {
        const source = "music-player-client.resume-playback";

        try {
            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "resume-playback",
                _params: {}
            });

            this.storePlaybackResult(result, source, "Playback resumed.");

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Resume playback failed.");

                _xlog.error("[music-player-client] error received:", message);
                this.setStringXData("music-error", message, source, "Resume playback failed.");
                _xd.set("music-player-status", "error", { source });

                return result;
            }

            _xd.delete("music-error", { source });
            _xd.set("music-player-status", "playing", { source });
            this.updatePlaybackUI();
            this.startPlayerStatePolling();

            _xlog.log("[music-player-client] playback resumed");

            return result;
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Resume playback failed: ${message}`,
                _status: "error"
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Resume playback failed.");
            _xd.set("music-player-status", "error", { source });
            this.storePlaybackResult(result, source, "Resume playback failed.");

            return result;
        }
    }

    async _set_volume(xcmd?: ClientXCommand) {
        const source = "music-player-client.set-volume";

        try {
            const raw_volume = xcmd?._params?._volume;
            const raw_delta = xcmd?._params?._delta;
            const base_volume = this.readXDataNumber("music-volume", 45);
            const parsed_volume = raw_volume === undefined || raw_volume === null || raw_volume === ""
                ? undefined
                : Number(raw_volume);
            const parsed_delta = raw_delta === undefined || raw_delta === null || raw_delta === ""
                ? 0
                : Number(raw_delta);

            if (parsed_volume !== undefined && !Number.isFinite(parsed_volume)) {
                const result = {
                    _ok: false,
                    _message: "Volume must be a number."
                };

                this.setStringXData("music-error", result._message, source, "Set volume failed.");
                this.storePlaybackResult(result, source, "Set volume failed.");

                return result;
            }

            if (!Number.isFinite(parsed_delta)) {
                const result = {
                    _ok: false,
                    _message: "Volume delta must be a number."
                };

                this.setStringXData("music-error", result._message, source, "Set volume failed.");
                this.storePlaybackResult(result, source, "Set volume failed.");

                return result;
            }

            const volume = Math.max(
                0,
                Math.min(100, parsed_volume ?? base_volume + parsed_delta)
            );

            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "set-volume",
                _params: {
                    _volume: volume
                }
            });

            this.storePlaybackResult(result, source, "Volume set.");

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Set volume failed.");

                _xlog.error("[music-player-client] error received:", message);
                this.setStringXData("music-error", message, source, "Set volume failed.");
                _xd.set("music-player-status", "error", { source });

                return result;
            }

            _xd.delete("music-error", { source });
            _xd.set("music-volume", volume, { source });
            _xd.set("music-player-status", this.getResultStatus(result, "playing"), { source });

            _xlog.log("[music-player-client] volume set:", volume);

            return {
                ...result,
                _volume: volume
            };
        } catch (err: any) {
            const message = this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Set volume failed: ${message}`,
                _status: "error"
            };

            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Set volume failed.");
            _xd.set("music-player-status", "error", { source });
            this.storePlaybackResult(result, source, "Set volume failed.");

            return result;
        }
    }

    async _get_player_state(xcmd?: ClientXCommand) {
        const source = "music-player-client.get-player-state";
        const suppress_wormhole_not_ready =
            xcmd?._params?._suppress_wormhole_not_ready === true;
        const suppress_transient_errors =
            xcmd?._params?._suppress_transient_errors === true;

        try {
            const client = XUIRuntime.requireClient();
            const result = await client.sendXcmd({
                _module: "music-player",
                _op: "get-player-state",
                _params: {}
            });

            _xd.set("music-player-state", result, { source });

            if (result?._ok === false) {
                const message = this.getResultMessage(result, "Get player state failed.");

                if (
                    (suppress_wormhole_not_ready && this.isWormholeNotReadyError(result)) ||
                    (suppress_transient_errors && this.isTransientPlayerStateError(result))
                ) {
                    return result;
                }

                this.stopPlayerStatePolling();
                _xlog.error("[music-player-client] error received:", message);
                this.setStringXData("music-error", message, source, "Get player state failed.");
                _xd.set("music-player-status", "error", { source });
                this.storePlaybackResult(result, source, "Get player state failed.");

                return result;
            }

            const status = this.getResultStatus(result, "stopped");
            const track_id = typeof result?._track_id === "string" ? result._track_id : "";
            const track = track_id ? this.findTrackById(track_id) : null;
            const file_path_title = this.getFilePathTitle(result?._file_path);

            _xd.delete("music-error", { source });
            _xd.set("music-player-status", status, { source });
            _xd.set("music-current-track-id", track_id, { source });
            this.storeCurrentPlaylistState(result, source, true);
            this.storePlaybackProgress(result, source);

            if (track) {
                _xd.set("music-current-track", track, { source });
                _xd.set("music-current-track-title", track?._title ?? track?._file_name ?? "Playing track", { source });
            } else if (status === "playing" || status === "paused") {
                _xd.set("music-current-track-title", file_path_title || "Playing track", { source });
            } else {
                _xd.set("music-current-track", null, { source });
                _xd.set("music-current-track-title", "No track playing", { source });
            }

            if (Number.isFinite(Number(result?._volume))) {
                _xd.set("music-volume", Number(result._volume), { source });
            }

            this.updatePlaybackUI();
            this.updateProgressBar();
            this.startScheduleStatePolling();

            if (status === "playing" || status === "paused") {
                this.startPlayerStatePolling();
            } else {
                this.stopPlayerStatePolling();
            }

            _xlog.log("[music-player-client] player state loaded:", status);

            return result;
        } catch (err: any) {
            const error_code = this.readErrorCode(err);
            const message = error_code || this.getErrorMessage(err);
            const result = {
                _ok: false,
                _message: `Get player state failed: ${message}`,
                _code: error_code,
                _status: "error"
            };

            if (
                (suppress_wormhole_not_ready && this.isWormholeNotReadyError(result)) ||
                (suppress_transient_errors && this.isTransientPlayerStateError(result))
            ) {
                return result;
            }

            this.stopPlayerStatePolling();
            _xlog.error("[music-player-client] error received:", err);
            this.setStringXData("music-error", result._message, source, "Get player state failed.");
            _xd.set("music-player-status", "error", { source });
            this.storePlaybackResult(result, source, "Get player state failed.");

            return result;
        }
    }


}
