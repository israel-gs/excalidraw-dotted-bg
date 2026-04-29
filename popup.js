const DEFAULTS = { spacing: 24, dotSize: 1.2 };

const spacingEl = document.getElementById("spacing");
const spacingValEl = document.getElementById("spacing-val");
const dotSizeEl = document.getElementById("dot-size");
const dotSizeValEl = document.getElementById("dot-size-val");
const resetEl = document.getElementById("reset");

function renderLabels() {
  spacingValEl.textContent = `${spacingEl.value}px`;
  dotSizeValEl.textContent = `${Number(dotSizeEl.value).toFixed(1)}px`;
}

async function load() {
  const stored = await chrome.storage.local.get(DEFAULTS);
  spacingEl.value = stored.spacing;
  dotSizeEl.value = stored.dotSize;
  renderLabels();
}

spacingEl.addEventListener("input", async () => {
  renderLabels();
  await chrome.storage.local.set({ spacing: Number(spacingEl.value) });
});

dotSizeEl.addEventListener("input", async () => {
  renderLabels();
  await chrome.storage.local.set({ dotSize: Number(dotSizeEl.value) });
});

resetEl.addEventListener("click", async () => {
  await chrome.storage.local.set(DEFAULTS);
  await load();
});

load();
