const toggle = document.getElementById("toggle");
const savedEl = document.getElementById("saved");

function showSaved() {
  savedEl.textContent = "Saved";
  setTimeout(() => (savedEl.textContent = ""), 1200);
}

chrome.storage.sync.get({ privacyArmorEnabled: true }, (data) => {
  toggle.checked = Boolean(data.privacyArmorEnabled);
});

toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ privacyArmorEnabled: enabled }, showSaved);
});


