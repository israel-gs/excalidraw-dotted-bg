(function () {
  const BASE_DOT_SPACING = 24;
  const root = document.documentElement;

  const debug = {
    fiberFound: false,
    fiberKind: null,
    rafTicks: 0,
    updates: 0,
    fallbackToLS: false,
    lastZoom: null,
    lastScrollX: null,
    lastScrollY: null,
    lastError: null,
  };
  window.__excdDebug = debug;

  function findReactFiber(domNode) {
    if (!domNode) return null;
    const key = Object.keys(domNode).find(
      (k) =>
        k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance")
    );
    return key ? domNode[key] : null;
  }

  function isAppState(o) {
    return (
      o &&
      typeof o === "object" &&
      typeof o.scrollX === "number" &&
      typeof o.scrollY === "number" &&
      o.zoom &&
      typeof o.zoom.value === "number"
    );
  }

  let cachedAccess = null;

  function findAppStateAccess(rootFiber) {
    const queue = [rootFiber];
    const visited = new WeakSet();
    let safety = 0;
    while (queue.length && safety < 5000) {
      safety++;
      const f = queue.shift();
      if (!f || visited.has(f)) continue;
      visited.add(f);

      if (
        f.stateNode &&
        f.stateNode.state &&
        isAppState(f.stateNode.state)
      ) {
        return { fiber: f, kind: "class" };
      }

      let h = f.memoizedState;
      let i = 0;
      while (h && i < 200) {
        if (isAppState(h.memoizedState)) {
          return { fiber: f, kind: "hook", index: i };
        }
        if (h.memoizedState && typeof h.memoizedState === "object") {
          for (const k in h.memoizedState) {
            try {
              if (isAppState(h.memoizedState[k])) {
                return { fiber: f, kind: "hookProp", index: i, prop: k };
              }
            } catch (_) {}
          }
        }
        h = h.next;
        i++;
      }

      if (f.child) queue.push(f.child);
      if (f.sibling) queue.push(f.sibling);
    }
    return null;
  }

  function discoverAccess() {
    const excEl = document.querySelector(".excalidraw");
    if (!excEl) return null;
    let f = findReactFiber(excEl);
    if (!f) return null;
    while (f.return) f = f.return;
    return findAppStateAccess(f);
  }

  function readAppStateViaFiber() {
    if (!cachedAccess) {
      cachedAccess = discoverAccess();
      if (cachedAccess) {
        debug.fiberFound = true;
        debug.fiberKind = cachedAccess.kind;
      }
    }
    if (!cachedAccess) return null;

    try {
      if (cachedAccess.kind === "class") {
        const s = cachedAccess.fiber.stateNode.state;
        if (isAppState(s)) return s;
      } else if (cachedAccess.kind === "hook") {
        let h = cachedAccess.fiber.memoizedState;
        for (let i = 0; i < cachedAccess.index && h; i++) h = h.next;
        if (h && isAppState(h.memoizedState)) return h.memoizedState;
      } else if (cachedAccess.kind === "hookProp") {
        let h = cachedAccess.fiber.memoizedState;
        for (let i = 0; i < cachedAccess.index && h; i++) h = h.next;
        if (h && h.memoizedState && isAppState(h.memoizedState[cachedAccess.prop])) {
          return h.memoizedState[cachedAccess.prop];
        }
      }
    } catch (e) {
      debug.lastError = String(e);
    }

    cachedAccess = null;
    return null;
  }

  function readAppStateViaLS() {
    try {
      const raw = localStorage.getItem("excalidraw-state");
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (isAppState(s)) return s;
    } catch (_) {}
    return null;
  }

  let lastZoom = -1;
  let lastSx = NaN;
  let lastSy = NaN;

  function tick() {
    debug.rafTicks++;

    let s = readAppStateViaFiber();
    if (!s) {
      s = readAppStateViaLS();
      debug.fallbackToLS = true;
    } else {
      debug.fallbackToLS = false;
    }

    if (s) {
      const zoom = s.zoom.value;
      const scrollX = s.scrollX;
      const scrollY = s.scrollY;

      if (zoom !== lastZoom || scrollX !== lastSx || scrollY !== lastSy) {
        lastZoom = zoom;
        lastSx = scrollX;
        lastSy = scrollY;

        const size = BASE_DOT_SPACING * zoom;
        const screenX = scrollX * zoom;
        const screenY = scrollY * zoom;
        const offX = (((screenX % size) + size) % size);
        const offY = (((screenY % size) + size) % size);

        root.style.setProperty("--excd-size", size + "px");
        root.style.setProperty("--excd-offset-x", offX + "px");
        root.style.setProperty("--excd-offset-y", offY + "px");

        debug.updates++;
        debug.lastZoom = zoom;
        debug.lastScrollX = scrollX;
        debug.lastScrollY = scrollY;
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
  console.log("[excd] react-fiber poll started");
})();
