const TRACKER_DOMAINS = [
  "google-analytics.com",
  "www.google-analytics.com",
  "analytics.google.com",
  "googletagmanager.com",
  "doubleclick.net",
  "adservice.google.com",
  "ads.google.com",
  "facebook.com",
  "connect.facebook.net",
  "facebook.net",
  "pixel.wp.com",
  "static.hotjar.com",
  "cdn.segment.com"
];

function buildRules() {
  const rules = [];
  let id = 1000;
  for (const domain of TRACKER_DOMAINS) {
    rules.push({
      id: id++,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: `||${domain}^`,
        resourceTypes: ["script", "image", "xmlhttprequest", "other"]
      }
    });
  }
  return rules;
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const rules = buildRules();
    const removeIds = rules.map(r => r.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeIds,
      addRules: rules
    });
    console.log("Privacy Armor: dynamic rules installed:", rules.length);
  } catch (err) {
    console.error("Privacy Armor: failed to install dynamic rules", err);
  }

  const stored = await chrome.storage.local.get({ counters: {} });
  await chrome.storage.local.set({ counters: stored.counters || {} });
});

async function incrementCounter(domain, url) {
  const data = await chrome.storage.local.get({ counters: {}, lastBlocked: null });
  const counters = data.counters || {};
  counters[domain] = (counters[domain] || 0) + 1;
  await chrome.storage.local.set({ counters, lastBlocked: { domain, url, ts: Date.now() } });
}

try {
  chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
      try {
        const url = details.url || "";
        for (const d of TRACKER_DOMAINS) {
          if (url.includes(d)) {
            incrementCounter(d, url).catch(()=>{});
            break;
          }
        }
      } catch (e) {}
    },
    { urls: ["<all_urls>"] },
    []
  );
} catch (e) {
  console.warn("Privacy Armor: webRequest listener not available", e);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "get_counters") {
    chrome.storage.local.get({ counters: {}, lastBlocked: null }, (data) => {
      sendResponse({ counters: data.counters || {}, lastBlocked: data.lastBlocked || null });
    });
    return true;
  }
  if (msg?.type === "reset_counters") {
    chrome.storage.local.set({ counters: {}, lastBlocked: null }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg?.type === "reinstall_rules") {
    const rules = buildRules();
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id),
      addRules: rules
    }).then(() => sendResponse({ ok: true })).catch(err => sendResponse({ ok: false, err: String(err) }));
    return true;
  }
});
