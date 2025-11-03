(function inject() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("src/content-hook.js");
  script.type = "text/javascript";
  script.async = false;
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();
})();

