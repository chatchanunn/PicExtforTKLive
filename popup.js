document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('videoToggle');
  const statusDiv = document.getElementById('status');
  let currentTabId = null;

  function updateStatus(enabled) {
    toggle.checked = enabled;
    statusDiv.textContent = enabled ? 'Video feed: ON' : 'Video feed: OFF';
    statusDiv.style.backgroundColor = enabled ? '#e6f7e6' : '#ffe6e6';
  }

  function sendMessage(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs || !tabs.length) return;
      currentTabId = tabs[0].id;
      chrome.tabs.sendMessage(currentTabId, message, response => {
        if (callback) callback(response);
      });
    });
  }

  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.sync.set({ videoEnabled: enabled });
    sendMessage({ action: 'toggleVideo', enabled }, res => {
      if (!res || !res.success) updateStatus(!enabled);
    });
  });

  chrome.storage.sync.get(['videoEnabled'], result => {
    const enabled = result.videoEnabled !== false;
    updateStatus(enabled);
    sendMessage({ action: 'toggleVideo', enabled });
  });
});
