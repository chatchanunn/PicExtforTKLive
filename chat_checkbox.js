// Set to store checked message IDs
let checkedMessages = new Set();
const MAX_TRACKED_MESSAGES = 200; // Limit number of messages to track
const BATCH_SIZE = 20; // Process messages in batches of 20
let isProcessing = false;
let pendingMessages = [];
let lastProcessTime = 0;
const PROCESS_DELAY = 100; // Minimum time between processing batches (ms)

// Function to safely add styles
function addStyles() {
  const styleId = 'tiktok-chat-checkbox-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .tiktok-chat-checkbox {
      appearance: none;
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border: 2px solid #ccc;
      border-radius: 4px;
      outline: none;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      margin: 0;
      padding: 0;
      vertical-align: middle;
    }
    
    .tiktok-chat-checkbox:checked {
      background-color: #00f2ea;
      border-color: #00f2ea;
    }
    
    .tiktok-chat-checkbox:checked::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 2px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
    
    /* Hover effect for message container */
    .rounded-8:hover {
      background-color: #f8f8f8;
    }
    
    /* Checked message style */
    .rounded-8.checked-message {
      background-color: #f0fff0 !important;
    }
    
    /* Ensure proper spacing for messages with checkboxes */
    .rounded-8 {
      transition: background-color 0.2s ease;
    }
    
    .tiktok-chat-message-wrapper {
      display: flex !important;
      align-items: flex-start;
      padding: 6px 8px !important;
      border-radius: 4px;
      transition: all 0.2s ease;
      width: 100%;
      box-sizing: border-box;
      line-height: 1.4;
      position: relative;
      margin: 2px 0;
    }
    
    .tiktok-chat-message-wrapper.checked {
      background-color: rgba(34, 197, 94, 0.1) !important;
      padding-right: 28px !important;
    }
    
    .tiktok-chat-message-wrapper.checked::after {
      content: '✅';
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      line-height: 1;
    }
    
    .tiktok-chat-message-wrapper:hover {
      background-color: rgba(0, 0, 0, 0.03) !important;
    }
    
    .tiktok-chat-message-content {
      flex: 1;
      min-width: 0;
      word-break: break-word;
    }
  `;
  
  document.head.appendChild(style);
}

// Function to process a batch of messages
function processMessageBatch() {
  if (pendingMessages.length === 0 || isProcessing) return;
  
  isProcessing = true;
  const now = Date.now();
  const timeSinceLastProcess = now - lastProcessTime;
  
  // If we processed recently, wait before processing more
  if (timeSinceLastProcess < PROCESS_DELAY) {
    setTimeout(processMessageBatch, PROCESS_DELAY - timeSinceLastProcess);
    isProcessing = false;
    return;
  }
  
  // Take a batch of messages to process
  const batch = pendingMessages.splice(0, BATCH_SIZE);
  lastProcessTime = now;
  
  // Process the batch
  batch.forEach(container => {
    if (!container || container.dataset.processed === 'true') return;
    
    // Find the message content element
    const messageContent = container.querySelector('.text-neutral-text1.pl-32.text-body-m-regular');
    if (!messageContent) return;
    
    // Skip system messages
    const messageText = messageContent.textContent || '';
    if (!messageText.trim() || 
        messageText.includes('Orders placed') || 
        messageText.includes('Chat started') ||
        messageText.includes('joined the livestream')) {
      return;
    }
    
    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'tiktok-chat-checkbox';
    
    // Add message ID if it doesn't exist
    if (!container.id) {
      container.id = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    // Position the checkbox next to the message
    const messageContainer = messageContent.closest('.rounded-8');
    if (!messageContainer) return;
    
    // Add checkbox to the container
    messageContainer.style.position = 'relative';
    messageContainer.style.paddingLeft = '32px';
    
    // Create a container for the checkbox
    const checkboxContainer = document.createElement('div');
    checkboxContainer.style.position = 'absolute';
    checkboxContainer.style.left = '12px';
    checkboxContainer.style.top = '50%';
    checkboxContainer.style.transform = 'translateY(-50%)';
    checkboxContainer.style.zIndex = '1';
    checkboxContainer.appendChild(checkbox);
    
    // Insert checkbox container at the beginning of the message container
    messageContainer.insertBefore(checkboxContainer, messageContainer.firstChild);
    
    // Ensure the message content has proper spacing
    messageContent.style.display = 'inline-block';
    messageContent.style.verticalAlign = 'middle';
    messageContent.style.width = 'calc(100% - 24px)';
    
    // Mark as processed
    container.dataset.processed = 'true';
    
    // Handle checkbox change
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        messageContainer.style.backgroundColor = '#f0fff0';
        checkedMessages.add(container.id);
      } else {
        messageContainer.style.backgroundColor = '';
        checkedMessages.delete(container.id);
      }
      
      // Save to storage
      const messagesToSave = Array.from(checkedMessages);
      if (messagesToSave.length > MAX_TRACKED_MESSAGES) {
        // Remove oldest messages if we exceed the limit
        messagesToSave.splice(0, messagesToSave.length - MAX_TRACKED_MESSAGES);
        checkedMessages = new Set(messagesToSave);
      }
      
      chrome.storage.local.set({ 
        checkedMessages: messagesToSave 
      }).catch(err => console.error('Error saving to storage:', err));
    });
    
    // Check if message was previously checked
    if (checkedMessages.has(container.id)) {
      checkbox.checked = true;
      messageContainer.style.backgroundColor = '#f0fff0';
    }
  });
  
  isProcessing = false;
  
  // Process next batch if there are more messages
  if (pendingMessages.length > 0) {
    requestAnimationFrame(processMessageBatch);
  }
}

// Function to add message to processing queue
function queueMessageForProcessing(containerElement) {
  if (!containerElement || containerElement.dataset.processed === 'true') return;
  
  // Add to pending messages if not already there
  if (!pendingMessages.includes(containerElement)) {
    pendingMessages.push(containerElement);
    
    // Start processing if not already running
    if (!isProcessing) {
      requestAnimationFrame(processMessageBatch);
    }
  }
}

// Observe chat container for new messages
function observeChat() {
  // Add styles first
  addStyles();
  
  // Try to find the chat container
  const findChatContainer = () => {
    // Try different selectors that might contain chat messages
    const selectors = [
      'div[class*="chat-container"]',
      'div[class*="message-list"]',
      'div[role="list"]',
      'div[class*="chat-messages"]',
      'div[class*="message-container"]',
      'div[class*="comment-list"]',
      'div[class*="chat-room"]',
      'div[class*="live-chat"]'
    ];
    
    for (const selector of selectors) {
      try {
        const container = document.querySelector(selector);
        if (container) return container;
      } catch (e) {
        console.warn('Error querying selector:', selector, e);
      }
    }
    
    console.log('Chat container not found, falling back to body');
    return document.body;
  };

  const chatContainer = findChatContainer();
  
  if (!chatContainer) {
    console.log('Chat container not found, retrying...');
    setTimeout(observeChat, 1000);
    return;
  }
  
  console.log('Chat container found:', chatContainer);
  
  // Process existing messages
  const processMessages = () => {
    // Find all message containers in the virtualized list
    const messageContainers = document.querySelectorAll('.rounded-8.group.relative');
    let processedCount = 0;
    const MAX_PROCESS_PER_BATCH = 30;
    
    messageContainers.forEach(container => {
      // Skip if already processed or not visible
      if (container.dataset.processed === 'true' || container.offsetParent === null) {
        return;
      }
      
      // Find the message content element
      const messageContent = container.querySelector('.text-neutral-text1.pl-32.text-body-m-regular');
      if (!messageContent) return;
      
      // Skip if already has a checkbox
      if (container.querySelector('.tiktok-chat-checkbox')) return;
      
      // Queue for processing
      queueMessageForProcessing(container);
      processedCount++;
      
      // Limit batch size
      if (processedCount >= MAX_PROCESS_PER_BATCH) {
        console.log('Processed maximum batch size of', MAX_PROCESS_PER_BATCH, 'messages');
        return true;
      }
    });
    
    return processedCount > 0;
  };
  
  // Variables for throttling mutation observer
  let mutationTimeout = null;
  let pendingMutations = 0;
  const MUTATION_THROTTLE_MS = 200;
  const MAX_MUTATIONS_BEFORE_PROCESS = 5;
  
  // Create a mutation observer with better performance
  const observer = new MutationObserver((mutations) => {
    // Count relevant mutations
    const hasAddedNodes = mutations.some(mutation => mutation.addedNodes.length > 0);
    if (!hasAddedNodes) return;
    
    pendingMutations++;
    
    // Clear any pending timeouts
    if (mutationTimeout) {
      clearTimeout(mutationTimeout);
    }
    
    // Process immediately if we've hit our threshold
    if (pendingMutations >= MAX_MUTATIONS_BEFORE_PROCESS) {
      processMessages();
      pendingMutations = 0;
      return;
    }
    
    // Otherwise, schedule processing
    mutationTimeout = setTimeout(() => {
      if (pendingMutations > 0) {
        processMessages();
        pendingMutations = 0;
      }
    }, MUTATION_THROTTLE_MS);
  });
  
  // Start observing with optimized settings
  observer.observe(chatContainer, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
  
  // Initial processing
  const processed = processMessages();
  
  // If no messages were processed, try again after a delay
  if (!processed) {
    setTimeout(processMessages, 1000);
  }
  
  // Also check periodically in case we miss something
  const intervalId = setInterval(() => {
    const processed = processMessages();
    if (processed) {
      clearInterval(intervalId);
    }
  }, 2000);
  
  // Clean up interval when page unloads
  window.addEventListener('unload', () => {
    clearInterval(intervalId);
  });
}

// Start the extension
function init() {
  try {
    console.log('TikTok Chat Checkbox extension initializing...');
    
    // Load any previously checked messages
    chrome.storage.local.get('checkedMessages', (data) => {
      try {
        if (data.checkedMessages && Array.isArray(data.checkedMessages)) {
          checkedMessages = new Set(data.checkedMessages);
          console.log('Loaded', checkedMessages.size, 'checked messages from storage');
        }
      } catch (err) {
        console.error('Error loading checked messages:', err);
      }
      
      // Start observing
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeChat);
      } else {
        observeChat();
      }
    });
  } catch (err) {
    console.error('Extension initialization error:', err);
  }
}

// Initialize the extension
init();
