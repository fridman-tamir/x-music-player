# Reut Music Player Visual Xpell Migration Investigation

## 1. Executive Summary

ReutMusicPlayer should not be rebuilt inside `xpell-vibe-starter`. Its music-player app, entities, server module, client module, persisted views, and local music assets are already in the current ServerXVM shape and should be preserved.

The main migration gap is the legacy `vibe-system` app UI and its opening/editing flow. Current Visual Xpell expects the system app to provide a project explorer with `Open` and `Edit` actions that call `xvm.load-server-app` with an explicit `_edit` flag. Reut's current system app can list and open apps, but it lacks the `Edit` action and still carries older starter-card creation UX.

The smallest safe migration is:

- Keep Reut's current project as the base.
- Migrate only the current `vibe-system` infrastructure needed for App Explorer, Open/Edit, toolbar, AI status, and Visual Xpell entry behavior.
- Keep Reut's `MusicPlayer` server module and `MusicPlayerClient` client module.
- Preserve `server/work/xvm/apps/default/music-player/**`.
- Exclude starter apps and starter creation flows unless Reut explicitly needs new-project creation.

## 2. Current Reut Architecture

Repository inspected: `/Users/tamirfridman/Documents/projects/xpell.ai/reut-music-player`.

Current Reut structure:

- `server/src/main.ts`
  - Starts `XNode`.
  - Uses `_work_folder: ./work`.
  - Uses `_system_xapps_path: ./system-xapps`.
  - Enables filesystem XDB.
  - Loads `XVibeModule`.
  - Registers AIME provider.
  - Loads `XTestModule`.
  - Loads Reut-specific `MusicPlayer(work_folder)`.
- `client/src/xapp.ts`
  - Uses `XUIRuntime.loadApp`.
  - Defaults to `vibe-system` unless `XDB.getString("xvibe.active_app")` exists.
  - Loads `XDashboardPack`.
  - Loads Reut-specific `MusicPlayerClient`.
  - Creates `XStudioEditor`.
  - Keeps a keyboard toggle for Studio using `Cmd/Ctrl+E`.
- `server/work/xvm/apps/default/music-player/app.json`
  - ServerXVM app file.
  - `_app_id: music-player`.
  - `_env: default`.
  - `_meta._entry_view_id: main`.
  - `_meta._version: 47`.
- `server/work/xvm/apps/default/music-player/views/main.json`
  - Main music-player runtime UI.
  - Uses `music-player-client` commands.
  - Has two legacy `_on_change` handlers.
- `server/work/xvm/apps/default/music-player/views/admin.json`
  - Admin UI for tracks, playlists, schedules.
  - Uses `music-player-client` commands.
  - Uses current `_on: { click: ... }` handlers in recent edits.
- `server/work/xvm/apps/default/music-player/entities/*.json`
  - `audio_track`
  - `playlist`
  - `playlist_item`
  - `playlist_schedule`
- `server/src/modules/Test/MusicPlayer.ts`
  - Owns music scanning, playback, playlists, schedule execution, and entity-manager integration.
- `client/src/MPClient/MusicPlayerClient.ts`
  - Owns music-player UI operations, XData refreshes, modals, and calls to server `music-player`.

Current Reut `vibe-system`:

- `server/system-xapps/vibe-system/app.json` is identical to the current starter app file.
- `server/system-xapps/vibe-system/views/xvibe-sys-main.json` is legacy/older.
- `server/system-xapps/vibe-system/flows/flow-create-app-from-starter.json` calls `xvibe.create_app_from_starter`.
- `flow-generate-app.json` and `flow-open-generated-app.json` match the current starter.

## 3. Current `vibe-system-app` Architecture

Current reference project inspected: `/Users/tamirfridman/Documents/projects/xpell.ai/xpell-vibe-starter`.

Current `server/system-xapps/vibe-system` responsibilities:

- Provides the system home view.
- Lists non-system apps through `xvm.list-apps`.
- Opens an app in runtime mode through `xvm.load-server-app` with `_edit: false`.
- Opens an app in Visual Xpell edit mode through `xvm.load-server-app` with `_edit: true`.
- Sets the default app through `xvm.set-default-app`.
- Displays AI connection status through `xai-client.get-provider-status`.
- Opens API key modal and stores provider key through `xai-client.set-api-key`.
- Uses `xvm-view` to compose system UI pieces:
  - `page-toolbar`
  - `ai-card`
- Triggers starter-based project creation through `flow-client.trigger` -> `flow-create-app-from-starter`.

Current system-app files:

- `server/system-xapps/vibe-system/app.json`
  - Minimal manifest.
  - Entry view is `xvibe-sys-main`.
- `server/system-xapps/vibe-system/views/xvibe-sys-main.json`
  - Main system page.
  - Contains `My Projects` App Explorer table.
  - Adds `Edit` table action.
  - References `toolbar.json` and `ai-card.json` through `xvm-view`.
- `server/system-xapps/vibe-system/views/toolbar.json`
  - Visual Xpell title/header.
  - Theme selector.
  - Uses `xui.set-theme`.
- `server/system-xapps/vibe-system/views/ai-card.json`
  - AI provider status card.
  - Developer console link reads `env.dev_console_url` from XData.
  - API key modal trigger.
- `server/system-xapps/vibe-system/flows/flow-create-app-from-starter.json`
  - Current starter version calls `starter.create_app_from_starter`.
  - Reut legacy version calls `xvibe.create_app_from_starter`.
- `server/system-xapps/vibe-system/flows/flow-generate-app.json`
  - Calls `xvibe.generate_app`.
- `server/system-xapps/vibe-system/flows/flow-open-generated-app.json`
  - Legacy/simple load-app flow; not central to current App Explorer behavior.

Current supporting runtime:

- Current `@xpell/node` `XNode` loads:
  - `XDB`
  - `WormholesModule`
  - `XAI`
  - `XModuleCreatorModule`
  - `XMutatorModule`
  - host `_modules`
  - `FlowManagerModule`
  - `XEntityManager`
  - `XPlanningModule`
  - `XStudioModule`
  - `ServerXVMModule`
- Current `@xpell/ui` `XVMClient` owns:
  - `load_server_app(app_id, env, { _edit })`
  - current app/env scope
  - view hydration and caching
  - server-xvm subscribe
  - edit-mode integration with `XStudioModule`
  - App Explorer data through `xvm.list-apps`

## 4. Important Architectural Differences

### App Explorer and edit mode

What changed:

- Current starter system app has both `Open` and `Edit` table actions.
- `Open` calls `xvm.load-server-app` with `_edit: false`.
- `Edit` calls `xvm.load-server-app` with `_edit: true`.
- Reut only has `Open` and `Set Default`.

Why it changed:

- Current Visual Xpell uses `XVMClient` edit mode to wrap the target app in the XStudio editing shell. Opening in runtime mode intentionally does not enable object inspection/editing.

Does Reut need it:

- Yes. This is required for opening existing Reut views in Visual Xpell canvas/editor mode.

What breaks if not migrated:

- Reut may appear in the app list and run normally, but users cannot open it in Visual Xpell edit mode from App Explorer.

### System app composition

What changed:

- Current system app splits toolbar and AI status into `xvm-view` references:
  - `views/toolbar.json`
  - `views/ai-card.json`
- Reut's system app is monolithic.

Why it changed:

- Current XVM supports referenced persisted views. This makes system UI components independently editable and reusable.

Does Reut need it:

- Should migrate for parity with current Visual Xpell shell, but it is not required for music playback.

What breaks if not migrated:

- Main App Explorer can still work if `Edit` action is added directly, but Reut remains behind the current system UI structure and may miss AI/dev-console status improvements.

### Starter creation moved out of XVibe in the current starter

What changed:

- Current `flow-create-app-from-starter.json` calls:
  - `_module: "starter"`
  - `_op: "create_app_from_starter"`
- Reut legacy flow calls:
  - `_module: "xvibe"`
  - `_op: "create_app_from_starter"`
- Current starter has `server/src/modules/Starter/StarterModule.ts`.
- Reut does not have `StarterModule`.

Why it changed:

- Starter expansion is now a host-app module concern in the starter project, separated from XVibe's broader generation/editing responsibilities.

Does Reut need it:

- No, not for existing ReutMusicPlayer functionality or Visual Xpell editing of the existing app.
- Only needed if Reut should create new projects from starter cards.

What breaks if not migrated:

- Starter creation cards fail if they call `starter.create_app_from_starter` and `StarterModule` is not loaded.
- Existing Reut app loading/editing does not break.

### Client bootstrap and active app switching

What changed:

- Current starter's `studio:open-app` handler calls `client.load_server_app(app_id, env)` when available instead of always reloading the page.
- Reut still reloads the window for `studio:open-app`.
- Current starter also sets `env.dev_console_url` in XData for `ai-card`.
- Reut does not set `env.dev_console_url`.

Why it changed:

- Current Visual Xpell can switch apps in place through `XVMClient.load_server_app`.
- `ai-card` uses XData-driven link binding for the developer console.

Does Reut need it:

- Should migrate.
- Required if current `ai-card.json` is adopted.
- In-place app switching improves App Explorer behavior but Reut can still function with reload fallback.

What breaks if not migrated:

- `ai-card` developer console link cannot bind to `env.dev_console_url`.
- Opening apps from some Studio events may be less smooth and may lose runtime state due to reload.

### CSS

What changed:

- Current starter CSS adds:
  - `home-content-grid`
  - `home-side-rail`
  - `empty-projects-helper`
  - `getting-started-*`
  - `ai-card*`
  - updated page toolbar styling
- Reut CSS has extensive Reut-specific music-player and admin styles not present in the starter.

Why it changed:

- Current system app UI has a side rail and split panels.

Does Reut need it:

- Yes, only the current system-app CSS additions if the current system view is adopted.
- Do not overwrite Reut CSS wholesale.

What breaks if not migrated:

- The current system app may render poorly or inconsistently.

## 5. File-by-File Migration Matrix

### Must migrate

| File | What changed | Why | Reut need | If not migrated |
| --- | --- | --- | --- | --- |
| `server/system-xapps/vibe-system/views/xvibe-sys-main.json` | App Explorer adds `Edit`, uses current labels/layout, references toolbar and AI card. | Visual Xpell edit-mode entry is exposed from system UI. | Yes, at least the App Explorer `Edit` action and compatible `Open` action. | App opens in runtime but not Visual Xpell edit mode from App Explorer. |
| `server/system-xapps/vibe-system/views/toolbar.json` | New referenced toolbar view. | Current system shell composition. | Yes if current `xvibe-sys-main.json` is copied as-is. | `xvm-view` reference fails or toolbar is blank/missing. |
| `server/system-xapps/vibe-system/views/ai-card.json` | New referenced AI status card. | Current system shell composition and AI status UX. | Yes if current `xvibe-sys-main.json` is copied as-is. | `xvm-view` reference fails or AI side card is missing. |
| `client/src/xapp.ts` | Add `_xd` import, `DEV_CONSOLE_URL`, `_xd.set("env.dev_console_url", ...)`, and prefer `client.load_server_app` in `studio:open-app`. | Supports current `ai-card` and in-place Visual Xpell app switching. | Yes if adopting current system UI; should migrate regardless. | AI card link binding missing; app switching falls back to reload. |
| `client/src/style/xvibe-app.css` | Current system UI classes differ from Reut CSS. | New system layout and `ai-card` require styles. | Additive migration only. | Current system app may look broken. |

### Should migrate

| File | What changed | Why | Reut need | If not migrated |
| --- | --- | --- | --- | --- |
| `server/package.json` | Current starter uses workspace package ranges and has starter test scripts. Reut uses `@xpell/xai-providers: ^2.0.4`, `@xpell/core: ^2.0.3`. | Local workspace alignment in starter. | Align only if Reut should stay on local Visual Xpell workspace packages. | Possible version skew when testing against local current packages. |
| `client/package.json` | Current starter uses workspace ranges for `@xpell/ui` and `@xpell/core`; Vite patch differs. | Local workspace alignment. | Align only if Reut should consume local workspace packages. | Possible UI/XVMClient feature skew if npm package lacks current Visual Xpell features. |
| `server/system-xapps/vibe-system/flows/flow-create-app-from-starter.json` | Current starter calls `starter.create_app_from_starter`; Reut calls `xvibe.create_app_from_starter`. | Starter creation split. | Only if starter creation remains in the system UI. | Create Project cards fail depending on which module is loaded. |

### Optional

| File | What changed | Why | Reut need | If not migrated |
| --- | --- | --- | --- | --- |
| `server/src/modules/Starter/StarterModule.ts` | Current starter-only module for expanding app starters. | Host-owned starter creation. | Optional; not required for Reut. | Only starter creation is unavailable. |
| `server/src/test-starter-contract.ts` | Tests starter metadata/placeholder behavior. | Starter quality gate. | Optional; only with `StarterModule`. | No impact on Reut music app. |
| `server/system-xapps/app-starters/Empty/**` | Current empty starter. | New-project creation. | Optional. | No impact on existing Reut app. |
| `server/system-xapps/app-starters/list/**` | Current list/tracker starter. | New-project creation. | Optional. | No impact on existing Reut app. |
| `server/system-xapps/app-starters/dashboard/assets/**` and `style/custom.css` | Current dashboard starter has assets/style metadata. Reut has only dashboard `app.json` and `views/main.json`. | Better starter expansion. | Optional unless preserving dashboard starter creation. | Only starter creation quality is affected. |

### Irrelevant to ReutMusicPlayer

| File/Area | Reason |
| --- | --- |
| Current generated apps under `xpell-vibe-starter/server/work/xvm/apps/default/ap*` | Generated test/demo projects, not Reut functionality. |
| Current starter `server/work/public/ap*/style/custom.css` | Public assets for generated demo apps. |
| Current starter `server/work/xdb/entities/...shopping_item...` | Demo entity data. |
| Current starter conversations under generated app folders | XVibe demo conversation state. |
| Current starter `server/work/music/Beethoven - Moonlight Sonata (FULL).mp3` | Sample music asset, not Reut's full local library. |

### Starter-only

| File/Area | Reason |
| --- | --- |
| `server/src/modules/Starter/StarterModule.ts` | Only needed for starter creation. |
| `server/src/test-starter-contract.ts` | Only validates starters. |
| `server/system-xapps/app-starters/**` | Starter definitions/assets. |
| Current system-app Create Project modal/cards | Starter UX, not required to run or edit ReutMusicPlayer. |
| `flow-create-app-from-starter.json` | Starter creation flow. |

## 6. Starter-App Dependencies and What Can Be Excluded

Current `vibe-system` has hard starter dependency only in the Create Project path:

- `+ Create Project` opens `generate-app-modal`.
- Starter cards trigger `flow-client.trigger`.
- Triggered flow is `flow-create-app-from-starter`.
- Current starter flow calls `starter.create_app_from_starter`.
- That requires `StarterModule` and app starter folders.

The App Explorer path does not require starters:

- `Refresh` -> `xvm.list-apps`
- `Open` -> `xvm.load-server-app`
- `Edit` -> `xvm.load-server-app` with `_edit: true`
- `Set Default` -> `xvm.set-default-app`

Cleanest exclusion strategy:

1. Keep current App Explorer, toolbar, AI card, and Open/Edit behavior.
2. Remove or hide the Create Project button and `generate-app-modal`.
3. Exclude `flow-create-app-from-starter.json`.
4. Do not load `StarterModule`.
5. Do not copy `server/system-xapps/app-starters/**`.

Alternative if Reut wants starter creation later:

1. Copy `StarterModule`.
2. Copy only the specific starter folders Reut wants.
3. Keep `flow-create-app-from-starter.json` pointing to `starter.create_app_from_starter`.
4. Add starter tests if maintaining starter behavior.

## 7. Reut-Specific Files That Must Be Preserved

Do not overwrite these with starter equivalents:

- `server/src/modules/Test/MusicPlayer.ts`
  - Music scan, mpv playback, playlists, schedules, entity-manager integration.
- `client/src/MPClient/MusicPlayerClient.ts`
  - Client ops for playback, tracks, playlists, schedules, modals, and XData state.
- `server/work/xvm/apps/default/music-player/app.json`
  - Reut app identity/version/entry metadata.
- `server/work/xvm/apps/default/music-player/views/main.json`
  - Main audio player UI.
- `server/work/xvm/apps/default/music-player/views/admin.json`
  - Music admin UI.
- `server/work/xvm/apps/default/music-player/entities/audio_track.json`
- `server/work/xvm/apps/default/music-player/entities/playlist.json`
- `server/work/xvm/apps/default/music-player/entities/playlist_item.json`
- `server/work/xvm/apps/default/music-player/entities/playlist_schedule.json`
- `server/work/music/**`
  - Local music files used by scan/playback.
- `server/work/xdb/**`
  - Existing entity data.
- Reut-specific CSS in `client/src/style/xvibe-app.css`
  - `.music-*`
  - `.rehab-admin-app`
  - `.admin-content`
  - playlist/schedule/admin table styles.
- `client/index.html`
  - Title `Reut Music Player`.
- `server/src/main.ts`
  - Must continue loading `MusicPlayer(work_folder)`.
- `client/src/xapp.ts`
  - Must continue loading `new MusicPlayerClient()`.

## 8. Visual Xpell Compatibility Gaps

Expected to work after targeted sync:

- Reut appears in App Explorer because `server-xvm.list-apps` lists non-system apps from the loaded `work/xvm/apps/default` registry.
- Existing views are exposed because `ServerXVMModule._get_app` returns `_view_ids` and `_entities`.
- Existing views can open because `XVMClient.load_server_app` hydrates all view ids and renders the entry view.
- Existing entities are exposed because `ServerXVMModule._get_app` returns `_entity_ids` and `_entities`.
- Save/update behavior can work because `XStudioModule` and `XVMClient` route view persistence through `server-xvm` commands and update handling.
- Music runtime can continue because `MusicPlayer` and `MusicPlayerClient` are host modules loaded outside the system app.

Gaps or risks:

- Reut's system app lacks App Explorer `Edit`; must be migrated.
- Reut's main music view still has two `_on_change` handlers. Current XUI prefers `_on: { change: ... }`. These may continue under compatibility behavior, but Visual Xpell editing should normalize future changes to `_on`.
- Some typed objects in Reut `admin.json` lack `_id` values, mostly table action definitions and modal buttons. Runtime works, but object-tree inspection/editing is less precise for those controls.
- Current `XStudioEditor` wrapper is identical between projects and only toggles the built-in XStudio region. Actual Visual Xpell behavior comes from `@xpell/ui` `XStudioModule`.
- If `@xpell/ui` is not the current workspace/package version, `xvm.load-server-app` `_edit` behavior may not exist. Reut's `package.json` should be aligned with the package source used for validation.
- If current `xvibe-sys-main.json` is copied as-is but `toolbar.json` and `ai-card.json` are not copied, referenced views will be missing.
- If current `xvibe-sys-main.json` is copied as-is and Create Project remains, `StarterModule` is required for starter creation.
- If Create Project is removed, `flow-create-app-from-starter.json` and starters can be excluded safely.

## 9. Minimal Migration Plan

Preferred migration:

1. Keep ReutMusicPlayer as the base repository.
2. Update `server/system-xapps/vibe-system/views/xvibe-sys-main.json` with current App Explorer Open/Edit behavior.
3. Add `server/system-xapps/vibe-system/views/toolbar.json`.
4. Add `server/system-xapps/vibe-system/views/ai-card.json`.
5. Decide whether to keep or remove Create Project:
   - For smallest Reut migration, remove/hide it and do not copy starters.
   - If kept, add `StarterModule` and only required starter folders.
6. Add only required current system CSS classes into `client/src/style/xvibe-app.css`; do not replace Reut CSS.
7. Update `client/src/xapp.ts`:
   - Import `_xd`.
   - Add `DEV_CONSOLE_URL`.
   - Set `env.dev_console_url`.
   - Use `client.load_server_app(app_id, env)` in `studio:open-app` when available.
   - Preserve `new MusicPlayerClient()`.
8. Keep `server/src/main.ts` loading `MusicPlayer(work_folder)`.
9. Optionally align package ranges to the same current workspace packages used by Visual Xpell validation.
10. Validate:
   - JSON parse all system and music app JSON.
   - `pnpm -C server build`.
   - `pnpm -C client build`.
   - Browser test App Explorer Open/Edit and music playback.

## 10. Risks

- Copying the full current starter would overwrite Reut-specific music behavior and/or introduce irrelevant starter/demo state.
- Copying current `vibe-system` as-is without `toolbar.json` and `ai-card.json` creates broken `xvm-view` references.
- Copying current `vibe-system` as-is while excluding `StarterModule` leaves Create Project buttons wired to a missing module.
- Keeping Reut's legacy system UI without adding `Edit` leaves Visual Xpell inaccessible from App Explorer.
- Overwriting `client/src/style/xvibe-app.css` loses Reut player/admin styles.
- Overwriting `server/work/xvm/apps/default/music-player/**` loses Reut persisted app, views, entities, and version history.
- Package version skew can hide or break current `XVMClient.load_server_app` edit behavior.
- Visual Xpell object editing works best with stable `_id` values; action buttons without `_id` in `admin.json` may be harder to inspect individually.

## 11. Recommended Implementation Sequence

1. Add current `toolbar.json` and `ai-card.json` to Reut `server/system-xapps/vibe-system/views/`.
2. Patch Reut `xvibe-sys-main.json` App Explorer actions:
   - Keep `Refresh`.
   - Use current `Open` with `_edit: false`.
   - Add `Edit` with `_edit: true`.
   - Keep `Set Default`.
3. Decide on Create Project:
   - Smallest path: remove/hide Create Project button/modal and exclude starter flow.
   - Optional path: add `StarterModule` and current starter folders.
4. Patch `client/src/xapp.ts` for `_xd`, `DEV_CONSOLE_URL`, `env.dev_console_url`, and in-place app switching.
5. Add current system UI CSS classes into Reut CSS without deleting music/admin styles.
6. Validate JSON and builds.
7. Manual test:
   - Start server/client.
   - Confirm App Explorer lists `music-player`.
   - Click `Open`; music app runs.
   - Return to system app.
   - Click `Edit`; Visual Xpell opens around `music-player`.
   - Open `main` and `admin` in App Explorer.
   - Select objects in canvas/object tree.
   - Save a harmless text/style edit.
   - Confirm playback and admin schedule/playlist operations still work.

## 12. Exact Files Expected to Change

Expected required implementation files:

- `server/system-xapps/vibe-system/views/xvibe-sys-main.json`
  - Update system UI/App Explorer to current Open/Edit behavior.
  - Optionally remove starter creation UI for Reut.
- `server/system-xapps/vibe-system/views/toolbar.json`
  - Add from current starter if using current referenced system view.
- `server/system-xapps/vibe-system/views/ai-card.json`
  - Add from current starter if using current referenced system view.
- `client/src/xapp.ts`
  - Add current XData dev-console URL and in-place app switching behavior.
  - Preserve `MusicPlayerClient`.
- `client/src/style/xvibe-app.css`
  - Add current system UI classes.
  - Preserve Reut music/admin classes.

Expected optional files only if starter creation is kept:

- `server/src/modules/Starter/StarterModule.ts`
- `server/src/test-starter-contract.ts`
- `server/system-xapps/app-starters/Empty/**`
- `server/system-xapps/app-starters/dashboard/**`
- `server/system-xapps/app-starters/list/**`
- `server/system-xapps/vibe-system/flows/flow-create-app-from-starter.json`
- `server/package.json`
  - Add starter test script only if adopting tests.

Files expected to remain untouched:

- `server/src/modules/Test/MusicPlayer.ts`
- `client/src/MPClient/MusicPlayerClient.ts`
- `server/work/xvm/apps/default/music-player/**`
- `server/work/music/**`
- `server/work/xdb/**`
- `client/index.html` unless only title/metadata is intentionally changed.

## Concise Recommendation

Can Reut be upgraded mostly by syncing `vibe-system-app`?

Yes. The existing Reut music app is already ServerXVM-based. The needed migration is mostly system-app/UI-shell sync plus small client bootstrap updates.

What else is actually required?

- Keep current Visual Xpell-capable `@xpell/ui`, `@xpell/node`, and `@xpell/vibe` versions aligned.
- Preserve loading `MusicPlayer` on the server and `MusicPlayerClient` on the client.
- Add current App Explorer `Edit` wiring.
- Add referenced system views and matching CSS if adopting current system view composition.

What should explicitly not be copied from `xpell-vibe-starter`?

- Generated demo apps under `server/work/xvm/apps/default/ap*`.
- Demo XDB data and public generated app assets.
- Starter folders and `StarterModule` unless Reut wants new-project starter creation.
- Current starter `client/src/xapp.ts` wholesale, because it lacks `MusicPlayerClient`.
- Current starter CSS wholesale, because it would drop Reut music/admin styles.
- Any replacement for Reut `server/work/xvm/apps/default/music-player/**`.

Smallest first implementation task:

Add the `Edit` action to Reut's App Explorer and patch `client/src/xapp.ts` to support current in-place `client.load_server_app(...)` behavior while preserving `MusicPlayerClient`. This is the narrowest change that directly tests whether existing Reut views can open in Visual Xpell edit mode.
