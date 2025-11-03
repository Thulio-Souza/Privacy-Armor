document.addEventListener('DOMContentLoaded', async () => {
  const toggleBlock = document.getElementById('toggleBlock');
  const toggleSpoof = document.getElementById('toggleSpoof');
  const reinstall = document.getElementById('reinstall');
  const reset = document.getElementById('reset');
  const list = document.getElementById('list');
  const last = document.getElementById('last');

  const s = await chrome.storage.local.get({ settings: { blockers: true, spoof: true } });
  toggleBlock.checked = s.settings.blockers;
  toggleSpoof.checked = s.settings.spoof;

  toggleBlock.addEventListener('change', async () => {
    const newSettings = { settings: { blockers: toggleBlock.checked, spoof: toggleSpoof.checked } };
    await chrome.storage.local.set(newSettings);
    if (toggleBlock.checked) {
      chrome.runtime.sendMessage({ type: 'reinstall_rules' }, resp => {
        if (!resp?.ok) alert('Failed to reinstall rules');
      });
    } else {
      chrome.declarativeNetRequest.getDynamicRules(rules => {
        const ids = rules.map(r => r.id);
        chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ids });
      });
    }
  });

  toggleSpoof.addEventListener('change', async () => {
    await chrome.storage.local.set({ settings: { blockers: toggleBlock.checked, spoof: toggleSpoof.checked } });
    alert('Spoof toggle saved. Page reload required for full effect change.');
  });

  reinstall.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'reinstall_rules' }, resp => {
      alert(resp?.ok ? 'rules reinstalled' : 'failed to reinstall');
    });
  });

  reset.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'reset_counters' }, resp => {
      if (resp?.ok) updateView({ counters: {}, lastBlocked: null });
    });
  });

  function updateView(data) {
    const counters = data.counters || {};
    const entries = Object.entries(counters).sort((a,b)=>b[1]-a[1]);
    list.innerHTML = entries.length ? entries.map(e => `<div><b>${e[0]}</b>: ${e[1]}</div>`).join('') : '<div>None yet</div>';
    if (data.lastBlocked) {
      const d = new Date(data.lastBlocked.ts);
      last.textContent = `${data.lastBlocked.domain} — ${d.toLocaleString()}\n${data.lastBlocked.url}`;
    } else {
      last.textContent = '—';
    }
  }

  async function refresh() {
    chrome.runtime.sendMessage({ type: 'get_counters' }, resp => {
      if (resp) updateView(resp);
    });
  }

  refresh();
  setInterval(refresh, 2500);
});
