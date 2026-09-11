# Novelist

A focused, browser-based story workspace that grows a collapsible outliner into a writing studio for novels, screenplays, and graphic novels.

## Run on your computer or LAN

```bash
npm start
```

The server listens on all network interfaces by default. Open
<http://localhost:4173> on the host computer, or use the `LAN:` address printed
at startup from another phone, tablet, or computer on the same network.

```text
Novelist is listening on http://localhost:4173
LAN: http://192.168.1.25:4173
```

If needed, allow TCP port `4173` through the host firewall. The host and client
must be on the same network, and guest Wi-Fi/client isolation must be disabled.
To choose another port, run `NOVELIST_PORT=8080 npm start`. To deliberately make
the app reachable only from the host computer, use `npm run start:local`.

Projects autosave in each browser's local storage; LAN access does not synchronize
projects between devices. Use the project JSON download/import controls to move a
project between browsers.

## Features

- Nested, collapsible acts, chapters, and scenes
- Fully editable acts, chapters, scenes, and color-coded characters, places, objects, and music/sound tags
- Multi-project library with create, switch, delete, JSON backup, and import
- Rich-text formatting, find, undo/redo, fullscreen, focus, dark, and extra-dark midnight modes
- Adjustable typeface, page width, text size, line spacing, typewriter scrolling, and paragraph focus
- Dropdown-selected Novel, Screenplay, and Graphic Novel formats with distinct editing syntax and styled exports
- Persistent scene tags and metadata, filtering, tension, POV, draft progress, duplicate/delete, and TXT/HTML export

## Test

```bash
npm test
```
