(function() {
  'use strict';
  if (window.__tiktokVideoTogglerInjected) return;
  window.__tiktokVideoTogglerInjected = true;
  window.__tiktokVideoTogglerState = window.__tiktokVideoTogglerState || {
    enabled: true,
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

    const audioSelectors = [
      'audio',
      'video',
      'iframe[src*="tiktok.com"]',
      '[class*="audio"], [class*="volume"]'
    ];

    videoSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = show ? '' : 'none';
        if (el.tagName === 'VIDEO') {
          if (show) {
            el.play().catch(()=>{});
          } else {
            el.pause();
          }
        }
      });
    });

    audioSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (el.muted !== undefined) {
          el.muted = !show;
        }
        if (el.tagName === 'VIDEO' && !show) {
          el.pause();
        }
      });
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleVideo') {
      currentState.enabled = request.enabled;
      toggleVideoContainer(request.enabled);
      sendResponse({ success: true });
      return true;
    }
    if (request.action === 'getState') {
      sendResponse({ enabled: currentState.enabled });
      return true;
    }
    if (request.action === 'ping') {
      sendResponse({ pong: true });
      return true;
    }
    return false;
  });

  function initialize() {
    if (currentState.isInitialized) return;
    currentState.isInitialized = true;
    toggleVideoContainer(currentState.enabled);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
