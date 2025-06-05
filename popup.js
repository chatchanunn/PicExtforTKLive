document.addEventListener('DOMContentLoaded', () => {
  const videoToggle = document.getElementById('videoToggle');
  const audioToggle = document.getElementById('audioToggle');
  const statusDiv = document.getElementById('status');
  let currentTabId = null;

  function updateStatus(videoEnabled, audioEnabled) {
    videoToggle.checked = videoEnabled;
    audioToggle.checked = audioEnabled;
    statusDiv.textContent = `Video: ${videoEnabled ? 'ON' : 'OFF'} | Audio: ${audioEnabled ? 'ON' : 'MUTED'}`;
    statusDiv.style.backgroundColor = videoEnabled ? '#e6f7e6' : '#ffe6e6';
  }

  function sendMessage(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs || !tabs.length) return;
      currentTabId = tabs[0].id;
      chrome.tabs.sendMessage(currentTabId, message, response => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          statusDiv.textContent = 'Error: TikTok page not responding. Please refresh the page.';
          statusDiv.style.backgroundColor = '#ffebee';
          return;
        }
        if (callback) callback(response);
      });
    });
  }

  videoToggle.addEventListener('change', () => {
    const enabled = videoToggle.checked;
    chrome.storage.sync.set({ videoEnabled: enabled }, () => {
      sendMessage({ action: 'toggleVideo', enabled }, res => {
        if (!res || !res.success) {
          updateStatus(!enabled, audioToggle.checked);
        }
      });
    });
  });

  audioToggle.addEventListener('change', () => {
    const enabled = audioToggle.checked;
    chrome.storage.sync.set({ audioEnabled: enabled }, () => {
      sendMessage({ action: 'toggleAudio', enabled }, res => {
        if (!res || !res.success) {
          updateStatus(videoToggle.checked, !enabled);
        }
      });
    });
  });

  // Initialize toggles from storage
  chrome.storage.sync.get(['videoEnabled', 'audioEnabled'], result => {
    const videoEnabled = result.videoEnabled !== false; // Default to true
    const audioEnabled = result.audioEnabled !== false; // Default to true
    
    // Update UI first
    updateStatus(videoEnabled, audioEnabled);
    
    // Then send messages to content script
    sendMessage({ action: 'toggleVideo', enabled: videoEnabled });
    sendMessage({ action: 'toggleAudio', enabled: audioEnabled });
  });

  // Periodically check if the content script is responding
  setInterval(() => {
    sendMessage({ action: 'ping' }, (response) => {
      if (!response || !response.pong) {
        statusDiv.textContent = 'Error: Content script not responding. Try refreshing the page.';
        statusDiv.style.backgroundColor = '#fff3e0';
      }
    });
  }, 2000);
});
