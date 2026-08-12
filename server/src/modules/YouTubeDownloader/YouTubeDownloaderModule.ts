import {
    _x,
    XModule,
    type XCommand,
    XResponseOK,
    _xu,
    type XpellSkill,
    type XpellSkillCommand,
    _xlog
} from "@xpell/node";

import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import path from "path";

const xu = _xu as any;
const MUSIC_APP_ID = "music-player";
const MUSIC_ENV = "default";
const PROGRESS_EVENT = "music-youtube-download-progress";
const SUPPORTED_HOSTS = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be"
]);

type DownloadStatus = "preparing" | "downloading" | "converting" | "complete" | "error";

type DownloadState = {
    _download_id: string;
    _status: DownloadStatus;
    _progress: number;
    _title: string;
    _filename: string;
    _file?: string;
    _message: string;
    _error: string;
    _created_at: string;
    _updated_at: string;
};

type ValidatedYouTubeUrl = {
    _url: string;
    _video_id: string;
};

type ValidatedTrackName = {
    _track_name: string;
    _filename: string;
    _file_path: string;
};

export class YouTubeDownloaderModule extends XModule {
    static _name = "youtube-downloader";
    static _ops: Record<string, XpellSkillCommand> = {
        "download": {
            _name: "download",
            _scope: "module",
            _description: "Download one YouTube video's audio as MP3 into the Reut music folder.",
            _params: {
                _url: "Required YouTube video URL. Playlists are rejected.",
                _track_name: "Required final track name. The server appends .mp3."
            }
        },
        "status": {
            _name: "status",
            _scope: "module",
            _description: "Read the current status for a YouTube download.",
            _params: {
                _download_id: "Required download id."
            }
        }
    };

    static _skill: XpellSkill = {
        _id: "youtube-downloader",
        _title: "YouTube Downloader",
        _version: "1.0.0",
        _active: true,
        _type: "server-module-api",
        _requires: ["xmodule", "yt-dlp", "ffmpeg"],
        _description: "Downloads YouTube audio into the existing Reut music folder.",
        _exports: {
            _modules: [
                {
                    _name: "youtube-downloader",
                    _scope: "server",
                    _description: "Download one YouTube video's audio as MP3.",
                    _ops: Object.values(YouTubeDownloaderModule._ops)
                }
            ]
        },
        _core_rules: [
            "Only accept a source URL from the browser.",
            "Server controls binaries, options, destination folder, and filename template.",
            "Reuse the existing music-player scan operation after download."
        ]
    };

    private _work_folder: string;
    private _music_folder: string;
    private _yt_dlp_bin: string;
    private _ffmpeg_bin: string;
    private _ffmpeg_location: string;
    private _downloads = new Map<string, DownloadState>();

    constructor(work_folder?: string) {
        super({ _name: YouTubeDownloaderModule._name });

        this._work_folder = work_folder || "work";
        this._music_folder = path.join(this._work_folder, "music");
        this._yt_dlp_bin = process.env.YTDLP_PATH || "yt-dlp";
        this._ffmpeg_bin = this.resolveFfmpegBinary(process.env.FFMPEG_PATH);
        this._ffmpeg_location = this.resolveFfmpegLocation(process.env.FFMPEG_PATH);
        fs.mkdirSync(this._music_folder, { recursive: true });
    }

    async onLoad() {
        const yt_dlp_ready = await this.commandExists(this._yt_dlp_bin, ["--version"]);
        const ffmpeg_ready = await this.commandExists(this._ffmpeg_bin, ["-version"]);

        if (!yt_dlp_ready || !ffmpeg_ready) {
            _xlog.log("[youtube-downloader] missing runtime dependency", {
                _yt_dlp: yt_dlp_ready,
                _ffmpeg: ffmpeg_ready,
                _message: "Install yt-dlp and ffmpeg on PATH before using YouTube downloads."
            });
        }
    }

    async _download(xcmd: XCommand) {
        try {
            const params = this.readParams(xcmd);
            const validated = this.validateYouTubeUrl(this.readRequiredString(params, "_url"));
            const track_name = this.validateTrackName(this.readRequiredString(params, "_track_name"));

            const yt_dlp_ready = await this.commandExists(this._yt_dlp_bin, ["--version"]);
            if (!yt_dlp_ready) {
                return this.fail("yt-dlp is not installed or is not available on PATH.", "E_YOUTUBE_YT_DLP_MISSING");
            }

            const ffmpeg_ready = await this.commandExists(this._ffmpeg_bin, ["-version"]);
            if (!ffmpeg_ready) {
                return this.fail("ffmpeg is not installed or is not available on PATH.", "E_YOUTUBE_FFMPEG_MISSING");
            }

            const state = this.createState();
            this._downloads.set(state._download_id, state);
            await this.emitProgress(state);

            void this.runDownload(state._download_id, validated, track_name);

            return new XResponseOK(state).toXData();
        } catch (err: any) {
            _xlog.warn("[youtube-downloader] rejected download request:", this.safeErrorMessage(err));
            return this.fail(this.safeErrorMessage(err), err?._code || "E_YOUTUBE_DOWNLOAD_REJECTED");
        }
    }

    async _status(xcmd: XCommand) {
        const params = this.readParams(xcmd);
        const download_id = this.readRequiredString(params, "_download_id");

        if (!download_id) {
            return this.fail("Download id is required.", "E_YOUTUBE_DOWNLOAD_ID_REQUIRED");
        }

        const state = this._downloads.get(download_id);
        if (!state) {
            return this.fail("Download not found.", "E_YOUTUBE_DOWNLOAD_NOT_FOUND");
        }

        return new XResponseOK(state).toXData();
    }

    private readParams(xcmd: XCommand) {
        const command = xcmd as XCommand & Record<string, any>;
        return {
            ...(command?._params ?? {}),
            ...(typeof command?._url === "string" ? { _url: command._url } : {}),
            ...(typeof command?._track_name === "string" ? { _track_name: command._track_name } : {})
        };
    }

    private readRequiredString(params: any, field: string) {
        const value = params?.[field];
        return typeof value === "string" ? value.trim() : "";
    }

    private fail(message: string, code = "E_YOUTUBE_DOWNLOAD_FAILED") {
        return new XResponseOK({
            _ok: false,
            _code: code,
            _message: message
        }).toXData();
    }

    private createState(): DownloadState {
        const now = new Date().toISOString();
        return {
            _download_id: xu.guid(),
            _status: "preparing",
            _progress: 0,
            _title: "",
            _filename: "",
            _message: "Preparing download...",
            _error: "",
            _created_at: now,
            _updated_at: now
        };
    }

    private updateState(download_id: string, patch: Partial<DownloadState>) {
        const current = this._downloads.get(download_id);
        if (!current) {
            return undefined;
        }

        const next: DownloadState = {
            ...current,
            ...patch,
            _updated_at: new Date().toISOString()
        };

        this._downloads.set(download_id, next);
        return next;
    }

    private async emitProgress(state: DownloadState) {
        try {
            await _x.execute({
                _module: "wormholes",
                _op: "broadcast",
                _params: {
                    _app_id: MUSIC_APP_ID,
                    _env: MUSIC_ENV,
                    _event: PROGRESS_EVENT,
                    _payload: state
                }
            });
        } catch (err) {
            _xlog.warn("[youtube-downloader] progress broadcast failed:", this.safeErrorMessage(err));
        }
    }

    private async setProgress(download_id: string, patch: Partial<DownloadState>) {
        const state = this.updateState(download_id, patch);
        if (state) {
            await this.emitProgress(state);
        }
        return state;
    }

    private validateYouTubeUrl(value: string): ValidatedYouTubeUrl {
        if (!value) {
            throw this.validationError("YouTube URL is required.", "E_YOUTUBE_URL_REQUIRED");
        }

        let url: URL;
        try {
            url = new URL(value);
        } catch {
            throw this.validationError("Enter a valid YouTube URL.", "E_YOUTUBE_URL_INVALID");
        }

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw this.validationError("YouTube URL must use http or https.", "E_YOUTUBE_URL_PROTOCOL");
        }

        const host = url.hostname.toLowerCase();
        if (!SUPPORTED_HOSTS.has(host)) {
            throw this.validationError("Only YouTube video URLs are supported.", "E_YOUTUBE_URL_UNSUPPORTED");
        }

        if (url.pathname === "/playlist" || url.searchParams.has("list")) {
            throw this.validationError("YouTube playlists are not supported yet. Paste a single video URL.", "E_YOUTUBE_PLAYLIST_UNSUPPORTED");
        }

        const video_id = this.extractVideoId(url);
        if (!video_id) {
            throw this.validationError("Enter a supported YouTube video URL.", "E_YOUTUBE_URL_INVALID");
        }

        return {
            _url: url.toString(),
            _video_id: video_id
        };
    }

    private validationError(message: string, code: string) {
        return {
            _message: message,
            _code: code
        };
    }

    private validateTrackName(value: string): ValidatedTrackName {
        if (!value) {
            throw this.validationError("Track name is required.", "E_YOUTUBE_TRACK_NAME_REQUIRED");
        }

        if (/[\u0000-\u001F\u007F]/u.test(value)) {
            throw this.validationError("Track name contains unsafe control characters.", "E_YOUTUBE_TRACK_NAME_UNSAFE");
        }

        if (value.includes("/") || value.includes("\\")) {
            throw this.validationError("Track name cannot contain directory separators.", "E_YOUTUBE_TRACK_NAME_PATH");
        }

        let base_name = value.replace(/\.mp3$/iu, "").trim();
        if (!base_name) {
            throw this.validationError("Track name is required.", "E_YOUTUBE_TRACK_NAME_REQUIRED");
        }

        if (base_name === "." || base_name === ".." || base_name.includes("..")) {
            throw this.validationError("Track name cannot contain path traversal segments.", "E_YOUTUBE_TRACK_NAME_PATH");
        }

        base_name = base_name.replace(/[<>:"|?*]/g, "-").replace(/\s+/g, " ").trim();
        if (!base_name) {
            throw this.validationError("Track name is required.", "E_YOUTUBE_TRACK_NAME_REQUIRED");
        }

        const target = this.buildUniqueTarget(base_name);
        return {
            _track_name: base_name,
            _filename: path.basename(target),
            _file_path: target
        };
    }

    private buildUniqueTarget(base_name: string) {
        const resolved_music_folder = path.resolve(this._music_folder);
        let index = 1;

        while (index < 10_000) {
            const suffix = index === 1 ? "" : ` (${index})`;
            const filename = `${base_name}${suffix}.mp3`;
            const candidate = path.resolve(this._music_folder, filename);

            if (!candidate.startsWith(`${resolved_music_folder}${path.sep}`)) {
                throw this.validationError("Track name cannot escape the music folder.", "E_YOUTUBE_TRACK_NAME_PATH");
            }

            if (!fs.existsSync(candidate)) {
                return candidate;
            }

            index += 1;
        }

        throw this.validationError("Could not create a unique filename for this track.", "E_YOUTUBE_FILENAME_COLLISION");
    }

    private extractVideoId(url: URL) {
        const host = url.hostname.toLowerCase();

        if (host === "youtu.be") {
            return this.cleanVideoId(url.pathname.slice(1).split("/")[0] ?? "");
        }

        if (url.pathname === "/watch") {
            return this.cleanVideoId(url.searchParams.get("v") ?? "");
        }

        const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/);
        return this.cleanVideoId(match?.[1] ?? "");
    }

    private cleanVideoId(value: string) {
        const trimmed = value.trim();
        return /^[A-Za-z0-9_-]{6,}$/.test(trimmed) ? trimmed : "";
    }

    private commandExists(command: string, args: string[]) {
        return new Promise<boolean>((resolve) => {
            let settled = false;
            const child = spawn(command, args, {
                stdio: ["ignore", "ignore", "ignore"]
            });
            const timeout = setTimeout(() => {
                if (settled) {
                    return;
                }
                settled = true;
                child.kill("SIGTERM");
                resolve(false);
            }, 5000);

            child.once("error", () => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(timeout);
                resolve(false);
            });

            child.once("close", (code) => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(timeout);
                resolve(code === 0);
            });
        });
    }

    private runDownload(download_id: string, validated: ValidatedYouTubeUrl, track_name: ValidatedTrackName) {
        void this.runDownloadInternal(download_id, validated, track_name).catch(async (err) => {
            const message = this.safeErrorMessage(err);
            _xlog.error("[youtube-downloader] download failed:", message);
            await this.setProgress(download_id, {
                _status: "error",
                _error: message,
                _message: message
            });
        });
    }

    private async runDownloadInternal(
        download_id: string,
        validated: ValidatedYouTubeUrl,
        track_name: ValidatedTrackName
    ) {
        await this.setProgress(download_id, {
            _status: "downloading",
            _title: track_name._track_name,
            _filename: track_name._filename,
            _message: "Downloading audio..."
        });

        const started_at = Date.now();
        const parsed_target = path.parse(track_name._file_path);
        const output_template = path.join(parsed_target.dir, `${parsed_target.name}.%(ext)s`);
        const args = [
            "--no-playlist",
            "--extract-audio",
            "--audio-format",
            "mp3",
            "--audio-quality",
            "0",
            "--newline",
            "--no-overwrites",
            "--print",
            "after_move:filepath",
            "-o",
            output_template,
            validated._url
        ];

        if (this._ffmpeg_location) {
            args.splice(6, 0, "--ffmpeg-location", this._ffmpeg_location);
        }

        const child = spawn(this._yt_dlp_bin, args, {
            stdio: ["ignore", "pipe", "pipe"]
        });

        const emitted_paths: string[] = [];
        const output_lines: string[] = [];

        this.bindDownloadOutput(child, download_id, output_lines, emitted_paths);

        const code = await new Promise<number | null>((resolve, reject) => {
            child.once("error", reject);
            child.once("close", resolve);
        });

        const combined_output = output_lines.join("\n");
        const collision = this.isCollisionOutput(combined_output);

        if (code !== 0 && !(collision && fs.existsSync(track_name._file_path))) {
            _xlog.error("[youtube-downloader] yt-dlp failed:", {
                _exit_code: code,
                _detail: this.sanitizeOutputTail(combined_output)
            });
            throw new Error(this.classifyFailure(combined_output));
        }

        await this.setProgress(download_id, {
            _status: "converting",
            _progress: 100,
            _message: "Importing downloaded audio..."
        });

        const output_file = this.resolveOutputFile(emitted_paths, validated._video_id, started_at, track_name._file_path);
        if (!output_file) {
            throw new Error(collision
                ? "Output file already exists, but the existing MP3 could not be resolved."
                : "Download finished, but the MP3 file could not be found.");
        }

        const filename = path.basename(output_file);
        const scan_result = await _x.execute({
            _module: "music-player",
            _op: "scan-music-folder",
            _params: {}
        });

        if (scan_result?._ok === false) {
            const message = this.resultMessage(scan_result, "Download completed, but library scan failed.");
            await this.setProgress(download_id, {
                _status: "error",
                _filename: filename,
                _error: message,
                _message: message
            });
            return;
        }

        await this.setProgress(download_id, {
            _status: "complete",
            _progress: 100,
            _filename: filename,
            _file: filename,
            _message: `${filename} downloaded successfully`
        });
    }

    private bindDownloadOutput(
        child: ChildProcess,
        download_id: string,
        output_lines: string[],
        emitted_paths: string[]
    ) {
        const handle_chunk = (chunk: Buffer) => {
            const text = chunk.toString("utf8");
            const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

            for (const line of lines) {
                output_lines.push(line);
                this.captureOutputFile(line, emitted_paths);
                void this.captureProgress(download_id, line);
            }
        };

        child.stdout?.on("data", handle_chunk);
        child.stderr?.on("data", handle_chunk);
    }

    private captureOutputFile(line: string, emitted_paths: string[]) {
        const resolved_music_folder = path.resolve(this._music_folder);
        const candidates = [
            line,
            line.replace(/^Destination:\s+/i, ""),
            line.replace(/^\[download\]\s+Destination:\s+/i, ""),
            line.replace(/^\[ExtractAudio\]\s+Destination:\s+/i, "")
        ];

        for (const candidate of candidates) {
            const resolved = path.resolve(candidate);
            if (
                resolved.endsWith(".mp3") &&
                (resolved === resolved_music_folder || resolved.startsWith(`${resolved_music_folder}${path.sep}`))
            ) {
                emitted_paths.push(resolved);
            }
        }
    }

    private async captureProgress(download_id: string, line: string) {
        const progress_match = line.match(/\[download\]\s+([0-9]+(?:\.[0-9]+)?)%/);
        if (progress_match?.[1]) {
            const progress = Math.max(0, Math.min(100, Number(progress_match[1])));
            await this.setProgress(download_id, {
                _status: "downloading",
                _progress: Number.isFinite(progress) ? progress : 0,
                _message: "Downloading audio..."
            });
            return;
        }

        if (line.includes("[ExtractAudio]")) {
            await this.setProgress(download_id, {
                _status: "converting",
                _progress: 100,
                _message: "Converting audio to MP3..."
            });
            return;
        }

        const destination_match = line.match(/Destination:\s+(.+)$/i);
        if (destination_match?.[1]) {
            const title = path.basename(destination_match[1]).replace(/\.[^.]+$/, "");
            if (title) {
                await this.setProgress(download_id, {
                    _title: title
                });
            }
        }
    }

    private resolveOutputFile(
        emitted_paths: string[],
        video_id: string,
        started_at: number,
        expected_file_path?: string
    ) {
        if (expected_file_path && this.isSafeExistingMp3(expected_file_path)) {
            return expected_file_path;
        }

        for (const emitted_path of [...emitted_paths].reverse()) {
            if (this.isSafeExistingMp3(emitted_path)) {
                return emitted_path;
            }
        }

        return this.findExistingMp3ForVideo(video_id) ?? this.findNewestMp3(started_at);
    }

    private isSafeExistingMp3(file_path: string) {
        const resolved = path.resolve(file_path);
        const resolved_music_folder = path.resolve(this._music_folder);

        return (
            resolved.endsWith(".mp3") &&
            resolved.startsWith(`${resolved_music_folder}${path.sep}`) &&
            fs.existsSync(resolved) &&
            fs.statSync(resolved).isFile()
        );
    }

    private findExistingMp3ForVideo(video_id: string) {
        const files = this.listMusicMp3s();
        return files.find((file_path) => path.basename(file_path).includes(`[${video_id}]`));
    }

    private findNewestMp3(started_at: number) {
        const files = this.listMusicMp3s()
            .map((file_path) => ({
                _file_path: file_path,
                _mtime_ms: fs.statSync(file_path).mtimeMs
            }))
            .filter((entry) => entry._mtime_ms >= started_at - 1000)
            .sort((a, b) => b._mtime_ms - a._mtime_ms);

        return files[0]?._file_path;
    }

    private listMusicMp3s() {
        if (!fs.existsSync(this._music_folder)) {
            return [];
        }

        return fs.readdirSync(this._music_folder, { withFileTypes: true })
            .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".mp3"))
            .map((entry) => path.join(this._music_folder, entry.name));
    }

    private isCollisionOutput(output: string) {
        const normalized = output.toLowerCase();
        return normalized.includes("already been downloaded") ||
            normalized.includes("already exists") ||
            normalized.includes("file exists");
    }

    private resolveFfmpegBinary(configured_path: string | undefined) {
        const value = typeof configured_path === "string" ? configured_path.trim() : "";

        if (!value) {
            return "ffmpeg";
        }

        if (fs.existsSync(value) && fs.statSync(value).isDirectory()) {
            return path.join(value, "ffmpeg");
        }

        return value;
    }

    private resolveFfmpegLocation(configured_path: string | undefined) {
        const value = typeof configured_path === "string" ? configured_path.trim() : "";

        if (!value) {
            return "";
        }

        if (fs.existsSync(value) && fs.statSync(value).isDirectory()) {
            return value;
        }

        return path.dirname(value);
    }

    private sanitizeOutputTail(output: string) {
        const music_folder = path.resolve(this._music_folder);
        const home = typeof process.env.HOME === "string" ? process.env.HOME : "";

        return output
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(-12)
            .map((line) => line
                .replaceAll(music_folder, "<music-folder>")
                .replaceAll(home, "<home>")
            )
            .join("\n");
    }

    private classifyFailure(output: string) {
        const normalized = output.toLowerCase();

        if (normalized.includes("private video")) {
            return "This video is private or unavailable.";
        }

        if (
            normalized.includes("video unavailable") ||
            normalized.includes("not available") ||
            normalized.includes("has been removed") ||
            normalized.includes("sign in to confirm") ||
            normalized.includes("copyright")
        ) {
            return "This video is unavailable for download.";
        }

        if (normalized.includes("ffmpeg")) {
            return "ffmpeg failed while converting the audio.";
        }

        if (this.isCollisionOutput(output)) {
            return "Output file already exists.";
        }

        return "YouTube download failed.";
    }

    private resultMessage(result: any, fallback: string) {
        const candidates = [
            result?._message,
            result?._result?._message,
            result?._data?._message,
            result?._result?._data?._message
        ];

        for (const candidate of candidates) {
            if (typeof candidate === "string" && candidate.trim()) {
                return candidate.trim();
            }
        }

        return fallback;
    }

    private safeErrorMessage(err: any) {
        if (typeof err === "string" && err.trim()) {
            return err.trim();
        }

        const candidates = [
            err?._message,
            err?.message,
            err?._error?._message,
            err?._result?._message,
            err?._result?._error?._message
        ];

        for (const candidate of candidates) {
            if (typeof candidate === "string" && candidate.trim()) {
                return candidate.trim();
            }
        }

        return "YouTube download failed.";
    }
}

export default YouTubeDownloaderModule;
