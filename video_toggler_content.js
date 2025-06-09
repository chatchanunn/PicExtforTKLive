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
        case 'toggleVideoAndAudio':
          // Update both video and audio states together
          currentState.videoEnabled = request.enabled;
          currentState.audioEnabled = request.enabled;
          
          // Toggle video visibility
          toggleVideoContainer(request.enabled);
          
          // Toggle audio state (mute/unmute)
          toggleAudio(request.enabled);
          
          // Save the state
          chrome.storage.sync.set({
            videoEnabled: currentState.videoEnabled
          });
          
          console.log(`Video and Audio ${request.enabled ? 'enabled' : 'disabled'}`);
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
    
    // Load saved states
    chrome.storage.sync.get(['videoEnabled'], (result) => {
      const videoEnabled = result.videoEnabled !== false; // Default to true
      
      // Update both video and audio states together
      currentState.videoEnabled = videoEnabled;
      currentState.audioEnabled = videoEnabled;
      
      // Apply the states
      toggleVideoContainer(videoEnabled);
      toggleAudio(videoEnabled);
      
      console.log('TikTok Video Toggler initialized with state:', currentState);
    });

    // Observe DOM changes to handle dynamically loaded content
    const observer = new MutationObserver((mutations) => {
      if (!currentState.videoEnabled) {
        toggleVideoContainer(false);
      }
      if (!currentState.audioEnabled) {
        toggleAudio(false);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Initialize when the page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
