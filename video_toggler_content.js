(function() {
  'use strict';
  if (window.__tiktokVideoTogglerInjected) return;
  window.__tiktokVideoTogglerInjected = true;
  
  // Initialize state with default values
  window.__tiktokVideoTogglerState = window.__tiktokVideoTogglerState || {
    videoEnabled: true,
    audioEnabled: true,
    isInitialized: false
  };

  const currentState = window.__tiktokVideoTogglerState;

  function toggleVideoContainer(show) {
    const videoSelectors = [
      '.live-room-video-container',
      '.video-feed-container',
      'video',
      'iframe[src*="tiktok.com"]',
      '.video-container',
      '[class*="video"][class*="container"], [class*="player"][class*="container"]'
    ];

    videoSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        try {
          el.style.display = show ? '' : 'none';
          if (el.tagName === 'VIDEO') {
            if (show) {
              el.play().catch(err => console.debug('Video play failed:', err));
            } else {
              el.pause();
            }
          }
        } catch (err) {
          console.debug('Error toggling video element:', err);
        }
      });
    });
  }

  function toggleAudio(enable) {
    const audioSelectors = [
      'audio',
      'video',
      'iframe[src*="tiktok.com"]',
      '[class*="audio"], [class*="volume"]'
    ];

    audioSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        try {
          if (el.muted !== undefined) {
            el.muted = !enable;
          }
          // If audio is being disabled, also pause the video
          if (!enable && el.tagName === 'VIDEO') {
            el.pause();
          }
        } catch (err) {
          console.debug('Error toggling audio element:', err);
        }
      });
    });
  }

  // Handle messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      switch (request.action) {
        case 'toggleVideo':
          currentState.videoEnabled = request.enabled;
          toggleVideoContainer(request.enabled);
          sendResponse({ success: true });
          return true;
          
        case 'toggleAudio':
          currentState.audioEnabled = request.enabled;
          toggleAudio(request.enabled);
          sendResponse({ success: true });
          return true;
          
        case 'getState':
          sendResponse({
            videoEnabled: currentState.videoEnabled,
            audioEnabled: currentState.audioEnabled
          });
          return true;
          
        case 'ping':
          sendResponse({ pong: true });
          return true;
      }
    } catch (err) {
      console.error('Error handling message:', err);
      sendResponse({ success: false, error: err.message });
      return false;
    }
    return false;
  });

  // Initialize the page with saved states
  function initialize() {
    if (currentState.isInitialized) return;
    
    // Get saved states from Chrome storage
    chrome.storage.sync.get(['videoEnabled', 'audioEnabled'], (result) => {
      const videoEnabled = result.videoEnabled !== false; // Default to true
      const audioEnabled = result.audioEnabled !== false; // Default to true
      
      // Update state
      currentState.videoEnabled = videoEnabled;
      currentState.audioEnabled = audioEnabled;
      currentState.isInitialized = true;
      
      // Apply the states
      toggleVideoContainer(videoEnabled);
      toggleAudio(audioEnabled);
    });
    
    // Watch for dynamically added video/audio elements
    const observer = new MutationObserver((mutations) => {
      if (currentState.isInitialized) {
        toggleVideoContainer(currentState.videoEnabled);
        toggleAudio(currentState.audioEnabled);
      }
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Initialize when the page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
