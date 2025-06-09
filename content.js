(function() {
  console.log('TikTok Shop Image Expander initialized');
  
  // Create modal element if it doesn't exist
  let modal = document.getElementById('picext-modal');
  let img;
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'picext-modal';
    Object.assign(modal.style, {
      position: 'fixed',
      zIndex: '999999',
      display: 'none',
      border: '1px solid #e5e5e5',
      background: '#fff',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      padding: '8px',
      borderRadius: '8px',
      pointerEvents: 'none',
      transition: 'opacity 0.15s ease',
      maxWidth: '500px',
      maxHeight: '500px',
      overflow: 'hidden',
      transform: 'translate(-50%, -100%)',
      willChange: 'transform, opacity'
    });

    img = document.createElement('img');
    Object.assign(img.style, {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      display: 'block',
      pointerEvents: 'none'
    });

    modal.appendChild(img);
    document.documentElement.appendChild(modal);
  } else {
    img = modal.querySelector('img');
  }

  let currentHoveredElement = null;
  let hideTimeout = null;
  let isModalVisible = false;

  function showModal(src, target) {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    
    // Don't show if already showing the same image
    if (img.src === src && isModalVisible) return;
    
    img.src = src;
    
    // Position the modal above the target element
    const rect = target.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    
    modal.style.top = (rect.top + scrollTop) + 'px';
    modal.style.left = (rect.left + rect.width / 2 + scrollLeft) + 'px';
    modal.style.opacity = '0';
    modal.style.display = 'block';
    
    // Force reflow
    void modal.offsetHeight;
    
    // Fade in
    modal.style.opacity = '1';
    isModalVisible = true;
  }

  function hideModal() {
    if (!isModalVisible || hideTimeout) return;
    
    modal.style.opacity = '0';
    isModalVisible = false;
    
    hideTimeout = setTimeout(() => {
      if (!isModalVisible) { // Only hide if still not visible
        modal.style.display = 'none';
      }
      hideTimeout = null;
    }, 200);
  }

  function isImageElement(element) {
    if (!element) return false;
    
    // Check if element is an image with valid src
    if (element.tagName === 'IMG' && element.src && 
        !element.src.includes('data:') && 
        !element.classList.contains('emoji') &&
        !element.closest('button, [role="button"], [role="toolbar"]')) {
      const rect = element.getBoundingClientRect();
      // Only consider images larger than 40x40 pixels
      return rect.width > 40 && rect.height > 40;
    }
    return false;
  }

  function findImageElement(element) {
    if (!element) return null;
    
    // Check the element itself
    if (isImageElement(element)) {
      return element;
    }
    
    // Check if any parent is a product card or similar container
    const container = element.closest([
      '[class*="product"][class*="card" i]',
      '[class*="item"][class*="product" i]',
      '.product-item',
      '.product-image',
      '[class*="thumbnail" i]',
      'a[href*="product"]',
      'div[data-e2e*="product"]'
    ].join(','));
    
    if (container) {
      // Find the first image in the container
      const img = container.querySelector('img');
      if (isImageElement(img)) {
        return img;
      }
    }
    
    return null;
  }

  function handleMouseMove(e) {
    const imageElement = findImageElement(e.target);
    
    if (imageElement) {
      // If we found a valid image and it's not the current hovered element
      if (currentHoveredElement !== imageElement) {
        currentHoveredElement = imageElement;
        showModal(imageElement.src, imageElement);
      }
      
      // Update position
      if (isModalVisible) {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        modal.style.top = (e.clientY + scrollTop - 20) + 'px';
        modal.style.left = (e.clientX + scrollLeft + 20) + 'px';
      }
    } else if (currentHoveredElement && !modal.contains(e.relatedTarget)) {
      currentHoveredElement = null;
      hideModal();
    }
  }

  // Add event listeners with passive: true for better performance
  document.addEventListener('mousemove', handleMouseMove, { passive: true, capture: true });
  
  // Handle clicks to close the modal
  document.addEventListener('click', (e) => {
    if (isModalVisible && !modal.contains(e.target)) {
      hideModal();
    }
  }, { passive: true });
  
  // Clean up when navigating away
  window.addEventListener('beforeunload', () => {
    document.removeEventListener('mousemove', handleMouseMove, { capture: true });
  });
  
  console.log('TikTok Shop Image Expander is active');
})();
