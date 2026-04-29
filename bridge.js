const DEFAULTS = { spacing: 24, dotSize: 1.2 };

function applySettings(settings) {
  const root = document.documentElement;
  root.style.setProperty("--excd-base-spacing", `${settings.spacing}px`);
  root.style.setProperty("--excd-dot-radius", `${settings.dotSize}px`);
}

chrome.storage.local.get(DEFAULTS).then(applySettings);

chrome.storage.onChanged.addListener((_changes, area) => {
  if (area !== "local") return;
  chrome.storage.local.get(DEFAULTS).then(applySettings);
});
