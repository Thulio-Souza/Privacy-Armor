# Privacy Armor
=============

Privacy Armor is a Chrome Manifest V3 extension that blocks common trackers and reduces browser fingerprinting surfaces. It combines declarativeNetRequest rules with lightweight in-page mitigations.

Features
- Tracker blocking via static and dynamic DNR rules (e.g., Google Analytics, DoubleClick, common pixels)
- Fingerprinting surface reduction in-page (navigator hints, Canvas, WebGL, AudioContext, timezone normalization)
- Live counters in the popup: recent tracker domains seen and last blocked request
- Quick actions: reinstall rules, reset counters, toggle blocking/spoofing

What it does
- Uses `declarativeNetRequest` with `rules_dynamic.json` and dynamically generated rules to block tracker requests
- Observes requests with `webRequest` to maintain per-domain counters (not used to block)
- Injects a page-context script that normalizes or lightly perturbs high-entropy signals (Canvas/WebGL/Audio) deterministically per-origin
- Persists state in `chrome.storage.local`

Install (Load Unpacked)
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top-right)
3. Click "Load unpacked"
4. Select the `Privacy-Armor` folder (the folder containing `manifest.json`)
5. The extension appears in your toolbar; open the popup to verify

Usage
- Popup
  - Tracker blocking: enable/disable dynamic rules
  - Fingerprint spoofing: toggle in-page mitigations (reload pages to apply changes)
  - Reinstall rules: reapply dynamic rules if needed
  - Reset counters: clear tracked domain counts and last blocked entry
- Options page: simple enable toggle (reserved for future expansion)

Permissions
- `declarativeNetRequest`: apply blocking and header modification rules
- `webRequest`: observe requests for counters only
- `scripting`: inject page-context spoofing logic
- `storage`: persist settings and counters
- `tabs`, `host_permissions: <all_urls>`: operate on all sites

Files
- `manifest.json`: MV3 config, permissions, content script, DNR rules
- `rules_dynamic.json`: baseline ruleset
- `src/background.js`: installs/updates dynamic rules, tracks counters, handles popup messages
- `src/inject.js`: injects `src/content-hook.js` into page context
- `src/content-hook.js`: spoofing/mitigations for high-entropy APIs
- `src/popup.html` / `src/popup.js`: UI to view counters and toggles
- `src/options.html` / `src/options.js`: basic settings
- `src/icon.png`: extension icon

Troubleshooting
- If blocking seems off, click "Reinstall rules" in the popup
- After changing spoofing, reload affected pages
- Check `chrome://extensions/` → Privacy Armor → "Service worker" logs for errors
