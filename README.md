# Excalidraw Dotted Background

Chrome extension that adds a dotted background to [excalidraw.com](https://excalidraw.com) that scales and pans in real-time with the canvas.

## Install

1. Clone this repo (or download as ZIP).
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the project folder.

The extension auto-injects on `https://excalidraw.com/*` and any subdomain.

## How it works

Excalidraw's static canvas applies the zoom via `setTransform`, but **does not** apply `scrollX/scrollY` at viewport scope — scroll is baked into per-element `translate()` calls. `localStorage["excalidraw-state"]` carries the full state (`zoom.value`, `scrollX`, `scrollY`) but Excalidraw debounces saves ~300 ms, which is too slow for real-time tracking.

To get real-time pan and zoom, `content.js` (loaded in the page's `MAIN` world) walks the React fiber tree from the `.excalidraw` element to locate the class component that holds `appState`, then reads `state.scrollX`, `state.scrollY`, and `state.zoom.value` every animation frame. Falls back to `localStorage` polling if the fiber path is not found.

The dots render as a CSS `radial-gradient` background on the `.excalidraw` wrapper. `mix-blend-mode: multiply` on the static canvas lets the pattern show through Excalidraw's opaque `viewBackgroundColor` fillRect.

### Coordinate math

Scene origin `(0, 0)` renders at screen position `(scrollX * zoom, scrollY * zoom)`. The dot pattern aligns by setting:

- `background-size: BASE * zoom`
- `background-position: ((scrollX * zoom) mod size, (scrollY * zoom) mod size)` — with `((x % size) + size) % size` to handle negative scrolls.

`BASE` is the dot spacing in scene units (24 by default).

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | MV3 manifest. Two content scripts: CSS in the default isolated world, JS in `world: "MAIN"` (required for React fiber access). |
| `content.css` | Dotted pattern via `radial-gradient`. Uses CSS variables (`--excd-size`, `--excd-offset-x/y`) updated by JS. |
| `content.js` | Fiber traversal + `requestAnimationFrame` loop. Updates CSS variables when state changes. |

## Limitations

- **React fiber brittleness.** If Excalidraw moves `appState` to a hook, an external store, or renames its component, the BFS won't find it. The script falls back to localStorage with the ~300 ms debounce lag.
- **Blend mode side effect.** `mix-blend-mode: multiply` slightly tints drawings where the dot pattern overlaps. Acceptable at low dot alpha; visible if you crank the dot color.
- **Tested only on standalone Excalidraw.** Embedded Excalidraw (Notion, etc.) is untested and probably needs different selectors.

## Debug

In the DevTools console on `excalidraw.com`:

```js
window.__excdDebug
```

Returns the current tracked state (zoom, scrollX, scrollY), the fiber kind that was discovered, whether it fell back to localStorage, and update counters. Useful for diagnosing whether the React internals changed.

## License

MIT.
