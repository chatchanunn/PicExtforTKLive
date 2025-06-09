document.addEventListener('DOMContentLoaded', () => {
  const videoToggle = document.getElementById('videoToggle');
  const statusDiv = document.getElementById('status');
  let currentTabId = null;

  function updateStatus(videoEnabled) {
    videoToggle.checked = videoEnabled;
    statusDiv.textContent = `Live Video: ${videoEnabled ? 'ON' : 'OFF'}`;
    statusDiv.style.backgroundColor = videoEnabled ? '#e6f7e6' : '#ffe6e6';
    statusDiv.style.fontWeight = '500';
  }

  function sendMessage(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs || !tabs.length) return;
      currentTabId = tabs[0].id;
      
      // Check if we're on a TikTok page before sending message
      const url = tabs[0].url;
      if (!url || !url.includes('tiktok.com')) {
        console.log('Not on a TikTok page, skipping message');
        if (callback) callback({ success: false, error: 'Not on TikTok page' });
        return;
      }
      
      // Send message with error handling
      try {
        chrome.tabs.sendMessage(currentTabId, message, response => {
          // Handle response if callback exists
          if (chrome.runtime.lastError) {
            // Ignore errors when content script isn't available
            if (chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
              console.log('Content script not available on this page');
              if (callback) callback({ success: false, error: 'Content script not available' });
              return;
            }
            console.error('Error sending message:', chrome.runtime.lastError);
            statusDiv.textContent = 'Error: TikTok page not responding. Please refresh the page.';
            statusDiv.style.backgroundColor = '#ffebee';
            return;
          }
          if (callback) callback(response);
        });
      } catch (error) {
        console.error('Error in sendMessage:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });
  }

  videoToggle.addEventListener('change', () => {
    const enabled = videoToggle.checked;
    // Toggle both video and audio together
    chrome.storage.sync.set({ videoEnabled: enabled }, () => {
      sendMessage({ 
        action: 'toggleVideoAndAudio', 
        enabled: enabled 
      }, res => {
        if (!res || !res.success) {
          updateStatus(!enabled);
        }
      });
    });
  });

  // Initialize from storage
  chrome.storage.sync.get(['videoEnabled'], result => {
    const videoEnabled = result.videoEnabled !== false; // Default to true
    
    // Update UI first
    updateStatus(videoEnabled);
    
    // Then send message to content script
    sendMessage({ 
      action: 'toggleVideoAndAudio', 
      enabled: videoEnabled 
    });
  });

  // Periodically check if the content script is responding
  setInterval(() => {
    sendMessage({ action: 'ping' }, (response) => {
      if (!response || !response.pong) {
        statusDiv.textContent = 'Error: Please refresh the TikTok Live page';
        statusDiv.style.backgroundColor = '#fff3e0';
        statusDiv.style.color = '#d32f2f';
      }
    });
  }, 2000);
});
