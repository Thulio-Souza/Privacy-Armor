(function() {
  const injected = '(' + function() {
    'use strict';

    function originSeed() {
      try {
        const origin = location.hostname || location.origin || 'no-origin';
        let h = 2166136261 >>> 0;
        for (let i = 0; i < origin.length; i++) {
          h ^= origin.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        return Math.abs(h);
      } catch (e) { return Math.floor(Math.random()*1e9); }
    }
    const SEED = originSeed();

    function defineSafe(obj, prop, value) {
      try {
        Object.defineProperty(obj, prop, {
          configurable: true,
          enumerable: true,
          writable: false,
          value: value
        });
      } catch (e) {}
    }

    try {
      defineSafe(navigator, 'languages', ['en-US', 'en']);
      defineSafe(navigator, 'webdriver', false);
      try {
        const ua = navigator.userAgent.replace(/(Headless|PhantomJS)/gi, '');
        defineSafe(navigator, 'userAgent', ua);
      } catch(e){}
      defineSafe(navigator, 'plugins', { length: 0 });
      defineSafe(navigator, 'mimeTypes', { length: 0 });
    } catch (e) {}

    try {
      const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function() {
        try {
          const ctx = this.getContext('2d');
          if (ctx) {
            const w = Math.max(1, this.width | 0);
            const h = Math.max(1, this.height | 0);
            const sampleW = Math.min(4, w);
            const sampleH = Math.min(4, h);
            const img = ctx.getImageData(0, 0, sampleW, sampleH);
            const delta = (SEED % 7) - 3;
            for (let i = 0; i < img.data.length; i += 4) {
              img.data[i] = (img.data[i] + delta) & 255;
              img.data[i+1] = (img.data[i+1] + delta) & 255;
            }
            try { ctx.putImageData(img, 0, 0); } catch(e){}
          }
        } catch (err) { }
        return origToDataURL.apply(this, arguments);
      };
    } catch(e) {}

    try {
      const proto = WebGLRenderingContext && WebGLRenderingContext.prototype;
      if (proto) {
        const origGet = proto.getParameter;
        proto.getParameter = function(param) {
          if (param === 37445) return 'Intel Inc.';
          if (param === 37446) return 'Intel(R) HD Graphics';
          return origGet.apply(this, arguments);
        };
      }
    } catch(e){}

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const origCreateAnalyser = AudioCtx.prototype.createAnalyser;
        AudioCtx.prototype.createAnalyser = function() {
          const analyser = origCreateAnalyser.apply(this, arguments);
          if (analyser && analyser.getFloatFrequencyData) {
            const origGet = analyser.getFloatFrequencyData.bind(analyser);
            analyser.getFloatFrequencyData = function(array) {
              try {
                origGet(array);
                const bias = ((SEED % 13) - 6) * 1e-7;
                for (let i = 0; i < Math.min(4, array.length); ++i) {
                  array[i] = array[i] + bias;
                }
              } catch(e){}
            };
          }
          return analyser;
        };
      }
    } catch(e){}

    try {
      const origResolved = Intl.DateTimeFormat.prototype.resolvedOptions;
      Intl.DateTimeFormat.prototype.resolvedOptions = function() {
        const ro = origResolved.apply(this, arguments);
        if (ro && ro.timeZone) {
          ro.timeZone = 'UTC';
        }
        return ro;
      };
      const tz = new Date().getTimezoneOffset();
      Date.prototype.getTimezoneOffset = function() { return tz; };
    } catch(e){}

    try {
      if (navigator.permissions) {
        const origQuery = navigator.permissions.query.bind(navigator.permissions);
        navigator.permissions.query = function(desc) {
          if (desc && (desc.name === 'clipboard-read' || desc.name === 'clipboard-write')) {
            return Promise.resolve({ state: 'denied', onchange: null });
          }
          return origQuery(desc);
        };
      }
    } catch(e){}

  } + ')();';

  const script = document.createElement('script');
  script.textContent = injected;
  script.async = false;
  (document.documentElement || document.head || document.body || document).appendChild(script);
  script.remove();
})();
