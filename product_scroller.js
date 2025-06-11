// Product Scroller for TikTok Shop Live
// This script allows clicking on product numbers in chat to scroll to the corresponding product

// Configuration
const PRODUCT_NUMBER_SELECTOR = '.number-need-to-hidden';
const PRODUCT_ITEM_SELECTOR = '.sc-ktJbId';
const PRODUCT_CONTAINER_SELECTOR = '.index-module__draggable-container--d+Ml2';
// Selector for individual chat messages - using flexible class matching
const CHAT_MESSAGE_SELECTOR = [
    // TikTok Shop Live Streamer Dashboard
    '[class*="message-item"], [class*="chat-message"], [class*="comment-item"], [class*="commentList"], [class*="messageContainer"]',
    // Generic selectors
    '.chat-message, .message-item, .comment-item, .comment, .message, .msg, .chat-msg',
    // Data attribute selectors
    '[data-e2e*="message"], [data-testid*="message"], [class*="message"][class*="item"]',
    // More specific selectors
    'div[class*="message"], div[class*="comment"], div[class*="chat"]',
    // Generic fallback
    'div[role="listitem"]'
].join(',');

// Selector for the chat container that holds all messages
const CHAT_CONTAINER_SELECTOR = [
    // TikTok Shop Live Streamer Dashboard
    '.index-module__chat-room--M2e9G',
    '.index-module__chat-room-container--Xp3pQ',
    '.index-module__chat-message-list--QKz3x',
    '.webcast-chatroom___list',
    
    // Common chat container classes
    '.chat-container, .chat-room, .chat-window, .chat-box, .chat-panel',
    '.message-list, .message-container, .message-area, .message-feed',
    '.comment-list, .comment-container, .comment-area, .comment-feed',
    
    // TikTok specific classes
    '.index-module__chat-room',
    '.index-module__chat-container',
    '.index-module__message-list',
    
    // Data attribute selectors
    '[data-e2e*="chat"], [data-testid*="chat"], [data-e2e*="message"], [data-testid*="message"]',
    
    // Role-based selectors
    '[role="log"], [role="list"], [role="feed"]',
    
    // Generic containers that might wrap chat
    '.scroll-container, .scroll-area, .scroll-view, .scroll-content',
    
    // Last resort: any element that contains messages
    'div[class*="chat"], div[class*="message"], div[class*="comment"]',
    'div[class*="list"][class*="scroll"], div[class*="feed"][class*="scroll"]',
    
    // Body as final fallback
    'body'
].join(',');

// Selector for the text content of a message - more flexible class matching
const CHAT_MESSAGE_TEXT_SELECTOR = '.text-neutral-text1, [class*="message-content"], [class*="text-body"], [class*="text-neutral"]';

// Debug function to log element info
function logElementInfo(selector, name) {
    const elements = document.querySelectorAll(selector);
    console.log(`Found ${elements.length} ${name} elements`);
    elements.forEach((el, i) => {
        console.log(`${name} ${i + 1}:`, {
            text: el.textContent.trim(),
            classes: el.className,
            id: el.id,
            tag: el.tagName
        });
    });
}

// Function to find and scroll to a product by number
function scrollToProductNumber(productNumber) {
    console.log(`Looking for product number: ${productNumber}`);
    
    // First try to find exact match
    const productFound = tryFindAndScrollToProduct(productNumber);
    
    if (!productFound) {
        console.log('Exact match not found, trying partial match...');
        // If exact match not found, try to find a partial match
        tryFindAndScrollToProduct(productNumber, true);
    }
    
    return productFound;
}

function normalizeNumber(number) {
    // Remove any non-digit characters and normalize the number
    return String(number).replace(/[^\d]/g, '');
}

function scrollToElement(element) {
    if (!element) return false;
    
    try {
        // First try smooth scrolling
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
        
        // Add highlight effect
        const originalBoxShadow = element.style.boxShadow;
        element.style.transition = 'box-shadow 0.5s ease';
        element.style.boxShadow = '0 0 0 3px #00f2ea, 0 0 10px rgba(0, 242, 234, 0.5)';
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
            element.style.boxShadow = originalBoxShadow;
        }, 2000);
        
        return true;
    } catch (error) {
        console.error('Error scrolling to element:', error);
        return false;
    }
}

function tryFindAndScrollToProduct(productNumber, allowPartialMatch = false) {
    // Normalize the target product number
    const normalizedTarget = normalizeNumber(productNumber);
    console.log(`Searching for product number: ${productNumber} (normalized: ${normalizedTarget})`);
    
    // Find all product number elements
    const productNumbers = document.querySelectorAll(PRODUCT_NUMBER_SELECTOR);
    console.log(`Found ${productNumbers.length} product numbers`);
    
    // Find the product with the matching number
    for (const numberElement of productNumbers) {
        const rawNumber = numberElement.textContent.trim();
        const currentNumber = normalizeNumber(rawNumber);
        
        // Get the parent product item
        let productItem = numberElement.closest(PRODUCT_ITEM_SELECTOR);
        
        // If not found, try to find a parent with a specific class
        if (!productItem) {
            let parent = numberElement.parentElement;
            while (parent && !parent.classList.contains('sc-ktJbId')) {
                parent = parent.parentElement;
                if (!parent) break;
            }
            productItem = parent;
        }
        
        console.log(`Checking product:`, {
            rawNumber,
            normalizedNumber: currentNumber,
            targetNumber: productNumber,
            normalizedTarget,
            matchType: allowPartialMatch ? 'partial' : 'exact',
            hasProductItem: !!productItem
        });
        
        let isMatch = false;
        if (allowPartialMatch) {
            isMatch = currentNumber.includes(normalizedTarget);
            console.log(`  Partial match '${currentNumber}'.includes('${normalizedTarget}'): ${isMatch}`);
        } else {
            isMatch = currentNumber === normalizedTarget;
            console.log(`  Exact match '${currentNumber}' === '${normalizedTarget}': ${isMatch}`);
        }
            
        if (isMatch) {
            console.log('Found matching product number, attempting to scroll...');
            
            if (productItem) {
                console.log('Found product item, scrolling to it');
                const success = scrollToElement(productItem);
                
                if (success) {
                    console.log('Successfully scrolled to product');
                    return true;
                }
                
                console.log('Primary scroll method failed, trying fallback...');
            }
            
            // Fallback 1: Try scrolling the product container
            const productContainer = document.querySelector(PRODUCT_CONTAINER_SELECTOR);
            if (productContainer) {
                console.log('Trying to scroll product container');
                try {
                    productContainer.scrollTo({
                        top: numberElement.offsetTop - 50,
                        behavior: 'smooth'
                    });
                    console.log('Product container scrolled');
                    return true;
                } catch (e) {
                    console.error('Error scrolling product container:', e);
                }
            }
        }
    }
    
    console.log(`Product ${productNumber} not found`);
    return false;
}

// Function to create a pin button element
function createPinButton(productNumber) {
    console.log('=== CREATING PIN BUTTON ===', { productNumber });
    
    // Create the button element
    const pinButton = document.createElement('button');
    
    // Set button properties
    pinButton.className = 'm4b-button pin-button';
    pinButton.setAttribute('data-tid', 'chat_pin_button');
    pinButton.title = 'Pin this product';
    pinButton.setAttribute('data-product-number', productNumber);
    pinButton.setAttribute('data-pin-button', 'true');
    pinButton.setAttribute('aria-label', `Pin product ${productNumber}`);
    
    // Apply styles with !important to override any conflicting styles
    Object.assign(pinButton.style, {
        display: 'inline-flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        padding: '2px 8px !important',
        margin: '0 0 0 6px !important',
        cursor: 'pointer !important',
        border: '1px solid #d9d9d9 !important',
        borderRadius: '4px !important',
        backgroundColor: '#f5f5f5 !important',
        color: '#262626 !important',
        fontSize: '12px !important',
        lineHeight: '1.2 !important',
        transition: 'all 0.2s !important',
        verticalAlign: 'middle !important',
        minWidth: '40px !important',
        height: '22px !important',
        boxSizing: 'border-box !important',
        outline: 'none !important',
        position: 'relative !important',
        zIndex: '1000 !important',
        opacity: '1 !important',
        visibility: 'visible !important',
        pointerEvents: 'auto !important',
        fontFamily: 'inherit !important',
        fontWeight: '500 !important',
        textTransform: 'none !important',
        boxShadow: 'none !important'
    });
    
    // Add hover and active states
    const originalStyles = {};
    
    pinButton.addEventListener('mouseenter', (e) => {
        // Save original styles
        originalStyles.backgroundColor = pinButton.style.backgroundColor;
        originalStyles.borderColor = pinButton.style.borderColor;
        originalStyles.color = pinButton.style.color;
        
        // Apply hover styles
        Object.assign(pinButton.style, {
            backgroundColor: '#e6f7ff !important',
            borderColor: '#69c0ff !important',
            color: '#096dd9 !important'
        });
    });
    
    pinButton.addEventListener('mouseleave', (e) => {
        if (!pinButton.classList.contains('pinned')) {
            Object.assign(pinButton.style, {
                backgroundColor: '#f5f5f5 !important',
                borderColor: '#d9d9d9 !important',
                color: '#262626 !important'
            });
        }
    });
    
    // Add pin icon
    const pinIcon = document.createElement('span');
    pinIcon.textContent = '📌';
    pinIcon.style.display = 'inline-flex !important';
    pinIcon.style.alignItems = 'center !important';
    pinIcon.style.justifyContent = 'center !important';
    pinIcon.style.marginRight = '4px !important';
    pinIcon.style.fontSize = '12px !important';
    pinIcon.style.lineHeight = '1 !important';
    
    // Add pin text
    const pinText = document.createElement('span');
    pinText.textContent = 'Pin';
    pinText.style.overflow = 'hidden !important';
    pinText.style.textOverflow = 'ellipsis !important';
    pinText.style.whiteSpace = 'nowrap !important';
    pinText.style.fontSize = '12px !important';
    pinText.style.lineHeight = '1.2 !important';
    
    // Add elements to button
    pinButton.appendChild(pinIcon);
    pinButton.appendChild(pinText);
    
    // Add click handler with error handling
    const handlePinClick = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
        
        const isNowPinned = !pinButton.classList.contains('pinned');
        console.log(`Pin button clicked for product #${productNumber}, isNowPinned:`, isNowPinned);
        
        // Update UI immediately for better UX
        pinButton.classList.toggle('pinned', isNowPinned);
        pinIcon.textContent = isNowPinned ? '📍' : '📌';
        
        // Update button appearance based on pinned state
        if (isNowPinned) {
            Object.assign(pinButton.style, {
                backgroundColor: '#e6f7ff !important',
                borderColor: '#69c0ff !important',
                color: '#096dd9 !important'
            });
            pinButton.title = 'Unpin this product';
            pinText.textContent = 'Pinned';
        } else {
            Object.assign(pinButton.style, {
                backgroundColor: '#f5f5f5 !important',
                borderColor: '#d9d9d9 !important',
                color: '#262626 !important'
            });
            pinButton.title = 'Pin this product';
            pinText.textContent = 'Pin';
        }
        
        try {
            // Find and scroll to the product
            const productFound = scrollToProductNumber(productNumber);
            if (!productFound) {
                throw new Error(`Product #${productNumber} not found`);
            }
            
            // Show success feedback
            showUserFeedback(`Scrolled to product #${productNumber}`, false);
            
        } catch (error) {
            console.error('Error handling pin click:', error);
            showUserFeedback(`Error: ${error.message}`, true);
            
            // Revert UI state on error
            pinButton.classList.toggle('pinned');
            pinIcon.textContent = pinButton.classList.contains('pinned') ? '📍' : '📌';
        }
    };
    
    // Add unique ID for debugging
    const buttonId = 'pin-button-' + Date.now();
    pinButton.id = buttonId;
    
    // Debug logging
    console.log('Created pin button:', pinButton);
    console.log('Pin button ID:', buttonId);
    
    // Force a reflow to ensure styles are applied
    // Add hover effects
    pinButton.addEventListener('mouseenter', () => {
        pinButton.style.transform = 'scale(1.1)';
        pinButton.style.filter = 'brightness(1.1)';
    });
    
    pinButton.addEventListener('mouseleave', () => {
        pinButton.style.transform = 'scale(1)';
        pinButton.style.filter = 'none';
    });
    
    // Add the click handler to the button
    pinButton.addEventListener('click', handlePinClick, true);  // Use capture phase
    
    return pinButton;
}

// Helper function to find pin button in product item
function findPinButtonInProduct(productItem) {
    // Common selectors for known pin buttons
    const selectors = [
        '[data-testid="pin-button"]',
        '[aria-label*="pin" i]',
        'button[class*="pin" i]',
        '[role="button"][aria-pressed]'
    ];

    for (const selector of selectors) {
        const btn = productItem.querySelector(selector);
        if (btn) {
            return btn;
        }
    }

    // Fallback: search all buttons and match text manually
    const buttons = Array.from(productItem.querySelectorAll('button'));
    for (const button of buttons) {
        const text = button.innerText || button.textContent || '';
        if (/pin|ปักหมุด/i.test(text)) {
            return button;
        }
    }
    return null;
}

// Function to find product by number in the product list
function findProductByNumber(number) {
    if (!number) {
        console.log('No product number provided');
        return null;
    }
    
    console.log('=== FINDING PRODUCT BY NUMBER ===');
    console.log('Looking for product number:', number);
    
    // Get all product items
    const productItems = document.querySelectorAll('[data-product-id]');
    console.log(`Found ${productItems.length} product items`);
    
    for (const [index, item] of productItems.entries()) {
        console.log(`\n--- Product Item ${index + 1} ---`);
        
        // Check for product number in various places
        const numberElements = item.querySelectorAll('[class*="number"], [id*="number"]');
        console.log(`Found ${numberElements.length} number elements in this item`);
        
        for (const el of numberElements) {
            const text = el.textContent.trim();
            const match = text.match(/\d+/);
            if (match && match[0] === number) {
                console.log(`✅ Found matching product item by number ${number}:`, item);
                return item;
            }
        }
        
        // Also check the entire item text as fallback
        const itemText = item.textContent;
        if (itemText.includes(number)) {
            console.log(`✅ Found product item containing number ${number} in text:`, item);
            return item;
        }
    }
    
    // If not found, try to find by data attribute
    const byDataAttr = document.querySelector(`[data-product-number="${number}"]`);
    if (byDataAttr) {
        const parentItem = byDataAttr.closest('[data-product-id]');
        console.log('✅ Found product by data attribute:', parentItem);
        return parentItem;
    }
    
    console.warn('❌ Product not found with number:', number);
    return null;
}

// Function to extract product numbers from message text
function extractProductNumber(text, returnElement = false) {
    console.log('=== EXTRACTING PRODUCT NUMBERS ===');
    console.log('Input text:', JSON.stringify(text));
    
    if (!text) {
        console.log('No text provided to extractProductNumber');
        return returnElement ? [] : null;
    }
    
    // Clean the text - remove any non-breaking spaces and normalize
    const cleanText = text.replace(/\u00A0/g, ' ').trim();
    console.log('Cleaned text:', JSON.stringify(cleanText));
    
    // Find all numbers in the text, including those within Thai text and emojis
    // This regex matches:
    // 1. Any sequence of digits (\d+)
    // 2. Numbers with Thai text around them (e.g., ตะกร้า85, 85ค่ะ, ตะกร้า6 เครื่องดำ)
    const numberMatches = [];
    
    // First, find all numbers in the text, regardless of surrounding characters
    const numberRegex = /(\d+)/g;
    let match;
    while ((match = numberRegex.exec(cleanText)) !== null) {
        if (match[1]) {
            numberMatches.push(match[1]);
        }
    }
    
    // Also look for numbers that might be at the boundary of Thai text
    const thaiBoundaryRegex = /([\u0E00-\u0E7F])(\d+)|(\d+)([\u0E00-\u0E7F])/g;
    while ((match = thaiBoundaryRegex.exec(cleanText)) !== null) {
        if (match[2]) numberMatches.push(match[2]);  // Number after Thai
        if (match[3]) numberMatches.push(match[3]);  // Number before Thai
    }
    
    // Remove duplicates and filter out empty strings
    const numbers = [...new Set(numberMatches)].filter(Boolean);
    
    console.log('Extracted numbers:', numbers, 'from text:', cleanText);
    
    if (numbers.length > 0) {
        console.log(`Found ${numbers.length} unique numbers in text`);
        
        if (returnElement) {
            // Create elements for each unique number
            const elements = [];
            
            for (const number of numbers) {
                try {
                    console.log(`Creating element for number: ${number}`);
                    const element = createProductNumberElement(number);
                    if (element) {
                        elements.push(element);
                        console.log(`Successfully created element for ${number}`);
                    }
                } catch (error) {
                    console.error(`Error creating element for number ${number}:`, error);
                }
            }
            
            console.log(`Created ${elements.length} product number elements`);
            return elements;
        }
        
        // For backward compatibility, return the first number if not requesting elements
        return numbers[0];
    }
    
    console.log('No valid numbers found in text');
    return returnElement ? [] : null;
}

// Function to create product number elements from text
function createProductNumberElementsFromText(text) {
    console.log('Creating product number elements from text:', text);
    
    if (!text || typeof text !== 'string') {
        console.error('Invalid text provided to createProductNumberElementsFromText');
        return [];
    }
    
    // Find all numbers in the text
    const numberMatches = text.match(/\d+/g) || [];
    console.log('Found numbers in text:', numberMatches);
    
    if (numberMatches.length === 0) {
        console.log('No numbers found in text');
        return [];
    }
    
    // Create product number elements for each number
    const elements = [];
    const uniqueNumbers = [...new Set(numberMatches)]; // Remove duplicates
    
    for (const number of uniqueNumbers) {
        try {
            const element = createProductNumberElement(number);
            if (element) {
                elements.push(element);
            }
        } catch (error) {
            console.error(`Error creating element for number ${number}:`, error);
        }
    }
    
    console.log(`Created ${elements.length} product number elements`);
    return elements;
}

// Function to create a product number element with pin button
function createProductNumberElement(number) {
    console.log('=== CREATING PRODUCT NUMBER ELEMENT ===', { number });
    
    if (!number) {
        console.error('No number provided to createProductNumberElement');
        return null;
    }
    
    // Ensure number is a string and trim any whitespace
    number = String(number).trim();
    
    // Create container for the product number and pin button
    const container = document.createElement('span');
    container.className = 'product-number-container';
    container.setAttribute('data-product-number', number);
    container.style.cssText = `
        cursor: pointer;
        position: relative;
        display: inline-flex;
        align-items: center;
        margin: 0 2px;
        padding: 2px 6px;
        border-radius: 4px;
        background-color: #f5f5f5;
        border: 1px solid #e0e0e0;
        user-select: none;
        white-space: nowrap;
        line-height: 1.2;
    `;
    
    // Create the product number text element
    const numberElement = document.createElement('span');
    numberElement.className = 'product-number';
    numberElement.textContent = number;
    numberElement.style.marginRight = '4px';
    numberElement.style.fontWeight = 'bold';
    numberElement.style.color = '#1890ff';
    
    // Create the pin button
    const pinButton = createPinButton(number);
    
    // Add elements to container
    container.innerHTML = ''; // Clear any existing content
    container.appendChild(numberElement);
    container.appendChild(pinButton);
    
    // Ensure the container has proper display and alignment
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.verticalAlign = 'middle';
    container.style.lineHeight = '1.2';
    
    // Ensure the pin button is visible and properly aligned
    if (pinButton) {
        pinButton.style.display = 'inline-flex';
        pinButton.style.alignItems = 'center';
        pinButton.style.justifyContent = 'center';
        pinButton.style.padding = '2px 4px';
        pinButton.style.margin = '0 0 0 4px';
        pinButton.style.borderRadius = '4px';
        pinButton.style.backgroundColor = '#f8f8f8';
        pinButton.style.border = '1px solid #e0e0e0';
        pinButton.style.cursor = 'pointer';
        pinButton.style.transition = 'all 0.2s';
        pinButton.style.verticalAlign = 'middle';
        pinButton.style.fontSize = '12px';
        pinButton.style.lineHeight = '1';
        pinButton.style.minWidth = '40px';
        pinButton.style.height = '20px';
    }
    
    // Add click handler for the container (for the number part)
    const clickHandler = function(e) {
        console.log('Product number container clicked:', { 
            target: e.target, 
            currentTarget: e.currentTarget,
            eventPhase: e.eventPhase,
            isNumber: e.target === numberElement || e.target === container
        });
        
        // Only handle clicks on the number, not the pin button
        if (e.target === numberElement || e.target === container) {
            e.stopPropagation();
            console.log('Handling product number click for #' + number);
            handleProductNumberClick(e, number);
        } else {
            console.log('Click was on pin button, letting button handle it');
        }
    };
    
    // Add both capture and bubble phase listeners to ensure we catch the event
    container.addEventListener('click', clickHandler, true); // Capture phase
    container.addEventListener('click', clickHandler); // Bubbling phase
    
    // Debug the created element
    console.log('Created product number element:', {
        container: container.outerHTML,
        numberElement: numberElement.outerHTML,
        pinButton: pinButton ? pinButton.outerHTML : 'No pin button'
    });
    
    return container;
}

// Function to show feedback to the user
function showUserFeedback(message, isError = false) {
    // Create or update feedback element
    let feedbackEl = document.getElementById('product-scroller-feedback');
    if (!feedbackEl) {
        feedbackEl = document.createElement('div');
        feedbackEl.id = 'product-scroller-feedback';
        feedbackEl.style.position = 'fixed';
        feedbackEl.style.top = '20px';
        feedbackEl.style.left = '50%';
        feedbackEl.style.transform = 'translateX(-50%)';
        feedbackEl.style.padding = '10px 20px';
        feedbackEl.style.borderRadius = '4px';
        feedbackEl.style.zIndex = '9999';
        feedbackEl.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(feedbackEl);
    }
    
    // Style based on message type
    feedbackEl.style.backgroundColor = isError ? '#ff4444' : '#00c851';
    feedbackEl.style.color = 'white';
    feedbackEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    feedbackEl.textContent = message;
    feedbackEl.style.opacity = '1';
    
    // Auto-hide after 3 seconds
    clearTimeout(feedbackEl.hideTimeout);
    feedbackEl.hideTimeout = setTimeout(() => {
        if (feedbackEl) feedbackEl.style.opacity = '0';
    }, 3000);
}

// Function to handle click on product number (just for scrolling)
function handleProductNumberClick(e, productNumber) {
    console.log('handleProductNumberClick called with:', productNumber);
    if (!productNumber) {
        console.error('No product number provided');
        return;
    }
    
    // Scroll to the product
    console.log('Searching for product #' + productNumber);
    showUserFeedback(`Searching for product #${productNumber}...`, false);
    
    // Try exact match first
    const exactMatch = scrollToProductNumber(productNumber);
    
    if (exactMatch) {
        console.log('Found exact match for product #' + productNumber);
        showUserFeedback(`Scrolled to product #${productNumber}`, false);
    } else {
        console.log('No exact match, trying partial match for #' + productNumber);
        // If no exact match, try partial match
        const partialMatch = tryFindAndScrollToProduct(productNumber, true);
        
        if (partialMatch) {
            console.log('Found partial match for product #' + productNumber);
            showUserFeedback(`Found similar product #${productNumber}`, false);
        } else {
            console.log('No match found for product #' + productNumber);
            showUserFeedback(`Product #${productNumber} not found`, true);
        }
    }
}

// Function to handle chat message click
function handleChatMessageClick(e) {
    console.log('Chat message clicked:', {
        target: e.target,
        classList: e.target.classList ? Array.from(e.target.classList) : 'no-classlist',
        tagName: e.target.tagName,
        text: e.target.textContent
    });
    
    // Check if we're clicking on a pin button or its children
    const pinButton = e.target.closest('.pin-button, .m4b-button, [data-pin-button]');
    if (pinButton) {
        console.log('Pin button clicked in message handler, letting button handle it', {
            pinButton: pinButton,
            classList: Array.from(pinButton.classList),
            text: pinButton.textContent
        });
        // Don't do anything - let the button's own click handler handle it
        return;
    }
    
    // Check if we're clicking on a product number container or a direct number in the message
    let productElement = e.target.closest('.product-number-container');
    let productNumber = null;
    
    if (productElement) {
        // If we found a product number container, get the number from its dataset
        productNumber = productElement.dataset.productNumber;
        console.log('Found product number container:', { productElement, productNumber });
    } else {
        // If no container was found, try to extract the number from the clicked text
        const clickedText = e.target.textContent || '';
        console.log('No product number container found, checking text:', clickedText);
        
        // Look for numbers in the clicked text
        const numberMatch = clickedText.match(/\d+/);
        if (numberMatch) {
            productNumber = numberMatch[0];
            console.log('Extracted number from text:', productNumber);
            
            // Create a temporary product element for handling the click
            productElement = createProductNumberElement(productNumber);
            if (productElement) {
                console.log('Created temporary product element for number:', productNumber);
            }
        }
    }
    
    if (!productElement || !productNumber) {
        console.log('No product number found in clicked element');
        return;
    }
    
    if (e.target.closest('.pin-button, .m4b-button, [data-pin-button]')) {
        console.log('Click was on a pin button inside product container, ignoring');
        return;
    }
    
    console.log('Handling click for product number:', productNumber);
    console.log('Product element found:', {
        productElement: productElement,
        dataset: { ...productElement.dataset },
        html: productElement.outerHTML
    });
    
    if (productNumber) {
        console.log('Product number clicked, handling scroll for #' + productNumber);
        handleProductNumberClick(e, productNumber);
    } else {
        console.warn('Product element found but no productNumber in dataset:', productElement);
    }
}

// Alias for backward compatibility
const handleMessageClick = handleChatMessageClick;

// Function to process chat message and add pin buttons
function processChatMessage(messageElement) {
    console.log('=== PROCESSING CHAT MESSAGE ===');
    
    // Skip if already processed
    if (messageElement.dataset.processed === 'true') {
        console.log('Message already processed, skipping');
        return;
    }
    
    // Skip system messages
    if (messageElement.closest('[class*="system"], [class*="System"], [class*="notification"]')) {
        console.log('System message, skipping');
        return;
    }
    
    // Skip if no text content
    const text = messageElement.textContent || '';
    if (!text.trim()) {
        console.log('Empty message, skipping');
        return;
    }
    
    console.log('Processing message:', { 
        text: text,
        element: messageElement 
    });
    
    // Mark as processed to prevent duplicate processing
    
    try {
        console.log('=== PROCESSING CHAT MESSAGE ===');
        console.log('Message element:', messageElement);
        console.log('Message HTML:', messageElement.outerHTML);
        
        // Get text content while preserving whitespace for better number detection
        const text = messageElement.textContent.trim();
        console.log('Message text:', text);
        
        // Skip if empty or already processed
        if (!text || messageElement.dataset.processed === 'true') {
            console.log('Message empty or already processed, skipping');
            return;
        }
        
        // Skip system messages
        if (messageElement.closest('[class*="system"], [class*="System"], [class*="notification"]')) {
            console.log('System message, skipping');
            return;
        }
        
        // Mark as processed to prevent duplicate processing
        messageElement.dataset.processed = 'true';
        
        // First, try to extract product numbers using the normal method
        console.log('Attempting to extract product numbers...');
        let productElements = extractProductNumber(text, true);
        console.log('Extracted product elements:', productElements);
        
        // If no product numbers found, try a more aggressive approach
        if (!productElements || productElements.length === 0) {
            console.log('No product numbers found, trying alternative extraction methods');
            
            // Method 1: Look for any numbers in the text
            const numberMatches = text.match(/\d+/g) || [];
            console.log('Found numbers in text:', numberMatches);
            
            if (numberMatches.length > 0) {
                console.log('Creating product number elements for found numbers');
                const newElements = [];
                
                // Process each number match
                for (const num of numberMatches) {
                    try {
                        console.log('Creating element for number:', num);
                        const element = createProductNumberElement(num);
                        if (element) {
                            console.log('Successfully created element for', num);
                            newElements.push({
                                number: num,
                                element: element,
                                position: text.indexOf(num)
                            });
                        }
                    } catch (error) {
                        console.error(`Error creating element for number ${num}:`, error);
                    }
                }
                
                if (newElements.length > 0) {
                    // Sort by position in the original text
                    newElements.sort((a, b) => a.position - b.position);
                    
                    // Call replaceMessageContent to handle the message content replacement
                    replaceMessageContent(
                        messageElement, 
                        text, 
                        newElements.map(item => ({
                            element: item.element,
                            number: item.number,
                            position: item.position
                        }))
                    );
                    
                    // Add click handler to the message
                    messageElement.style.cursor = 'pointer';
                    messageElement.removeEventListener('click', handleMessageClick);
                    messageElement.addEventListener('click', handleMessageClick);
                    
                    console.log('Successfully updated message with product number elements');
                    return;
                }
            }
            
            console.log('No valid product numbers could be extracted');
            return;
        }
        
        if (productElements && productElements.length > 0) {
            console.log(`Found ${productElements.length} product numbers in message`);
            
            // Prepare product elements with their positions
            const elementsWithPositions = [];
            let lastIndex = 0;
            
            // Process each product element to find its position in the text
            for (const productElement of productElements) {
                if (!productElement) continue;
                
                const number = productElement.dataset?.productNumber;
                if (!number) continue;
                
                // Ensure the product element has proper structure
                let numberElement = productElement.querySelector('.product-number');
                if (!numberElement) {
                    numberElement = document.createElement('span');
                    numberElement.className = 'product-number';
                    numberElement.textContent = number;
                    
                    // Clear any existing content and add our elements
                    productElement.innerHTML = '';
                    productElement.appendChild(numberElement);
                    
                    // Add the pin button if it doesn't exist
                    if (!productElement.querySelector('.pin-button')) {
                        const pinButton = createPinButton(number);
                        productElement.appendChild(pinButton);
                    }
                }
                
                const numberText = numberElement.textContent;
                const position = text.indexOf(numberText, lastIndex);
                
                if (position !== -1) {
                    elementsWithPositions.push({
                        element: productElement,
                        number: number,
                        position: position,
                        text: numberText
                    });
                    lastIndex = position + numberText.length;
                }
            }
            
            // Sort elements by their position in the text
            elementsWithPositions.sort((a, b) => a.position - b.position);
            
            // Call replaceMessageContent to handle the message content replacement
            if (elementsWithPositions.length > 0) {
                replaceMessageContent(
                    messageElement,
                    text,
                    elementsWithPositions.map(item => ({
                        element: item.element,
                        number: item.number,
                        position: item.position,
                        text: item.text
                    }))
                );
                
                // Add click handler to the message
                messageElement.style.cursor = 'pointer';
                messageElement.removeEventListener('click', handleMessageClick);
                messageElement.addEventListener('click', handleMessageClick);
            }
        }
    } catch (error) {
        console.error('Error processing chat message:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            element: messageElement,
            elementHTML: messageElement?.outerHTML
        });
    }
}

// Function to handle click on chat messages (legacy)
// Retained for reference but not used. The main handler is defined earlier.
function legacyHandleChatMessageClick(event) {
    // Prevent multiple processing
    if (event.handledByExtension) return;
    
    const messageElement = event.target.closest(CHAT_MESSAGE_SELECTOR) || 
                         event.target.closest(CHAT_MESSAGE_TEXT_SELECTOR);
    
    if (messageElement) {
        // Process the message to add pin buttons
        processChatMessage(messageElement);
        
        // Find the product number container if it exists
        const productElement = messageElement.querySelector('.product-number-container');
        if (!productElement) return;
        
        // Only handle clicks on the message itself, not on the pin button
        if (event.target.closest('.pin-button')) {
            return;
        }
        
        // Mark the event as handled
        event.handledByExtension = true;
        
        // Get the product number and scroll to it
        const productNumber = productElement.dataset.productNumber;
        if (productNumber) {
            showUserFeedback(`Searching for product #${productNumber}...`, false);
            
            // Try exact match first
            const exactMatch = scrollToProductNumber(productNumber);
            
            if (exactMatch) {
                showUserFeedback(`Scrolled to product #${productNumber}`, false);
                return;
            }
            
            // If no exact match, try partial match
            const partialMatch = tryFindAndScrollToProduct(productNumber, true);
            
            if (partialMatch) {
                showUserFeedback(`Found similar product #${productNumber}`, false);
            } else {
                showUserFeedback(`Product #${productNumber} not found`, true);
            }
        }
    }
}
let chatObserver = null;

// Function to replace message content with product number elements
function replaceMessageContent(messageElement, originalText, productElements) {
    console.log('Replacing message content with product numbers');
    
    try {
        // Create a wrapper for the message content
        const wrapper = document.createElement('div');
        wrapper.className = 'message-content-wrapper';
        wrapper.style.display = 'inline';
        wrapper.style.whiteSpace = 'pre-wrap';
        wrapper.style.wordBreak = 'break-word';
        wrapper.style.lineHeight = '1.4';
        
        // Create a document fragment to build the message
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        
        // Process each product number in the message
        productElements.forEach((productElement, index) => {
            if (!productElement) return;
            
            const number = productElement.dataset?.productNumber;
            if (!number) return;
            
            // Get the number text without any pin emoji
            const numberText = number;
            let numberPos = originalText.indexOf(numberText, lastIndex);
            
            // If not found, try to find the number in the text
            if (numberPos === -1) {
                numberPos = originalText.indexOf(number, lastIndex);
            }
            
            // If still not found, just append it
            if (numberPos === -1) {
                numberPos = lastIndex;
            }
            
            // Add text before the number
            if (numberPos > lastIndex) {
                const beforeText = originalText.substring(lastIndex, numberPos);
                if (beforeText.trim()) {
                    fragment.appendChild(document.createTextNode(beforeText));
                }
            }
            
            // Add the product number with pin button
            fragment.appendChild(productElement);
            
            // Update the last index to after this number
            lastIndex = numberPos + numberText.length;
        });
        
        // Add any remaining text after the last number
        if (lastIndex < originalText.length) {
            const remainingText = originalText.substring(lastIndex);
            if (remainingText.trim()) {
                fragment.appendChild(document.createTextNode(remainingText));
            }
        }
        
        // Add all elements to the wrapper
        wrapper.appendChild(fragment);
        
        // Replace the message content
        messageElement.innerHTML = '';
        messageElement.appendChild(wrapper);
        
        // Make the message clickable (but not the pin buttons)
        messageElement.style.cursor = 'pointer';
        messageElement.removeEventListener('click', handleMessageClick);
        messageElement.addEventListener('click', handleMessageClick);
        
        // Ensure pin buttons are visible and clickable
        const pinButtons = messageElement.querySelectorAll('.pin-button');
        pinButtons.forEach(btn => {
            btn.style.display = 'inline-flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.position = 'relative';
            btn.style.zIndex = '10';
            btn.style.pointerEvents = 'auto';
        });
        
        // Style the product numbers
        const productNumbers = messageElement.querySelectorAll('.product-number');
        productNumbers.forEach(el => {
            el.style.color = '#1890ff';
            el.style.fontWeight = 'bold';
            el.style.marginRight = '2px';
        });
        
        console.log('Successfully replaced message content with product numbers');
    } catch (error) {
        console.error('Error in replaceMessageContent:', error);
        // Fallback to original text if something goes wrong
        messageElement.textContent = originalText;
    }
}

// Helper function to style product elements in a message
function styleProductElements(messageElement) {
    // Make sure pin buttons are clickable and visible
    const pinButtons = messageElement.querySelectorAll('.pin-button');
    pinButtons.forEach(pinButton => {
        pinButton.style.pointerEvents = 'auto';
        pinButton.style.position = 'relative';
        pinButton.style.zIndex = '10';
        pinButton.style.display = 'inline-flex';
        pinButton.style.alignItems = 'center';
        pinButton.style.justifyContent = 'center';
        pinButton.style.marginLeft = '4px';
        pinButton.style.cursor = 'pointer';
    });
    
    // Style the product numbers
    const productNumbers = messageElement.querySelectorAll('.product-number');
    productNumbers.forEach(numberEl => {
        numberEl.style.fontWeight = 'bold';
        numberEl.style.color = '#1890ff';
        numberEl.style.marginRight = '4px';
    });
    
    // Style the product number containers
    const productContainers = messageElement.querySelectorAll('.product-number-container');
    productContainers.forEach(container => {
        container.style.display = 'inline-flex';
        container.style.alignItems = 'center';
        container.style.margin = '0 2px';
        container.style.padding = '2px 6px';
        container.style.borderRadius = '4px';
        container.style.backgroundColor = '#f5f5f5';
        container.style.border = '1px solid #e0e0e0';
    });
}

// Function to process a single message
function processSingleMessage(node) {
    try {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        
        console.log('Processing node:', {
            nodeName: node.nodeName,
            className: node.className,
            id: node.id || 'none',
            text: node.textContent?.substring(0, 50) + (node.textContent?.length > 50 ? '...' : '')
        });
        
        let message;
        
        // Check if this is a message element or contains one
        if (node.matches && node.matches(CHAT_MESSAGE_SELECTOR)) {
            message = node;
            console.log('Node matches CHAT_MESSAGE_SELECTOR');
        } else {
            // Try to find a message element within this node
            if (node.querySelector) {
                message = node.querySelector(CHAT_MESSAGE_SELECTOR);
                if (message) {
                    console.log('Found message via querySelector');
                }
            }
            
            // If not found, try to find a parent that matches
            if (!message && node.closest) {
                message = node.closest(CHAT_MESSAGE_SELECTOR);
                if (message) {
                    console.log('Found message via closest');
                }
            }
        }
        
        if (message) {
            console.log('Processing message element:', {
                className: message.className,
                text: message.textContent?.substring(0, 100) + (message.textContent?.length > 100 ? '...' : '')
            });
            
            if (!message.dataset.processed) {
                processChatMessage(message);
            } else {
                console.log('Message already processed');
            }
        } else {
            console.log('No message element found in node');
        }
    } catch (error) {
        console.error('Error in processSingleMessage:', error);
    }
}

// Function to initialize chat observer for new messages
function initChatObserver() {
    try {
        // Don't initialize if already initialized
        if (chatObserver) {
            console.log('Chat observer already initialized');
            return;
        }
        
        console.log('=== INITIALIZING CHAT OBSERVER ===');
        
        console.log('Searching for chat container with selector:', CHAT_CONTAINER_SELECTOR);
        
        // Get all potential chat containers
        const allContainers = Array.from(document.querySelectorAll(CHAT_CONTAINER_SELECTOR));
        
        // Log all found containers for debugging
        console.log(`Found ${allContainers.length} potential chat containers`);
        allContainers.forEach((container, i) => {
            try {
                const messageCount = container.querySelectorAll(CHAT_MESSAGE_SELECTOR).length;
                console.log(`Container ${i + 1}:`, {
                    tag: container.tagName,
                    id: container.id || 'none',
                    classes: container.className || 'none',
                    children: container.children.length,
                    messageCount: messageCount,
                    text: container.textContent?.substring(0, 50) + (container.textContent?.length > 50 ? '...' : '')
                });
            } catch (error) {
                console.error(`Error processing container ${i + 1}:`, error);
            }
        });
        
        // Find the most likely chat container (the one with the most messages)
        let bestContainer = null;
        let maxMessages = -1;
        
        allContainers.forEach(container => {
            try {
                // Skip body element unless it's the only container
                if (container === document.body && allContainers.length > 1) {
                    return;
                }
                
                const messages = container.querySelectorAll(CHAT_MESSAGE_SELECTOR);
                const messageCount = messages.length;
                
                // Check if this container has any scrollable area (common for chat containers)
                const isScrollable = container.scrollHeight > container.clientHeight || 
                                    container.scrollWidth > container.clientWidth;
                
                // Check if container has common chat-like classes or attributes
                const hasChatAttrs = container.className && (
                    container.className.toLowerCase().includes('chat') ||
                    container.className.toLowerCase().includes('message') ||
                    container.className.toLowerCase().includes('comment')
                );
                
                // Calculate a score based on message count and other factors
                let score = messageCount;
                if (isScrollable) score += 5;
                if (hasChatAttrs) score += 3;
                if (container.getAttribute('role') === 'log' || 
                    container.getAttribute('role') === 'list') score += 2;
                
                console.log('Container evaluation:', {
                    tag: container.tagName,
                    id: container.id || 'none',
                    classes: container.className || 'none',
                    messageCount: messageCount,
                    isScrollable: isScrollable,
                    hasChatAttrs: hasChatAttrs,
                    score: score
                });
                
                if (score > maxMessages) {
                    maxMessages = score;
                    bestContainer = container;
                }
            } catch (error) {
                console.error('Error evaluating container:', error);
            }
        });
        
        const chatContainer = bestContainer;
        
        if (!chatContainer) {
            const retryCount = (initChatObserver.retryCount || 0) + 1;
            const maxRetries = 10; // Maximum number of retries
            
            if (retryCount > maxRetries) {
                console.error(`Failed to find chat container after ${maxRetries} attempts. Giving up.`);
                console.log('Document body structure:', {
                    location: window.location.href,
                    title: document.title,
                    children: Array.from(document.body.children).map(el => ({
                        tag: el.tagName,
                        id: el.id || 'none',
                        classes: el.className || 'none',
                        children: el.children.length,
                        text: el.textContent?.substring(0, 50) + (el.textContent?.length > 50 ? '...' : '')
                    }))
                });
                return;
            }
            
            console.warn(`No suitable chat container found (attempt ${retryCount}/${maxRetries}). Will retry...`);
            
            // Use a debounced retry with backoff
            clearTimeout(initChatObserver.retryTimer);
            const delay = Math.min(1000 * Math.pow(1.5, retryCount - 1), 5000); // Cap at 5s
            initChatObserver.retryCount = retryCount;
            initChatObserver.retryTimer = setTimeout(() => {
                console.log(`Retrying chat container detection (attempt ${retryCount + 1}/${maxRetries})...`);
                initChatObserver();
            }, delay);
            return;
        }
        
        // Reset retry counter on success
        initChatObserver.retryCount = 0;
        
        console.log('Using chat container:', {
            tag: chatContainer.tagName,
            classes: chatContainer.className,
            id: chatContainer.id,
            children: chatContainer.children.length
        });
        
        // Process existing messages with debounce
        const processExistingMessages = () => {
            const messages = Array.from(chatContainer.querySelectorAll(CHAT_MESSAGE_SELECTOR))
                .filter(el => !el.dataset.processed);
                
            console.log(`Processing ${messages.length} unprocessed messages`);
            
            messages.forEach((msg, i) => {
                try {
                    console.log(`Processing message ${i + 1}:`, {
                        text: msg.textContent?.substring(0, 100) + (msg.textContent?.length > 100 ? '...' : ''),
                        classes: msg.className,
                        id: msg.id || 'none'
                    });
                    processChatMessage(msg);
                } catch (error) {
                    console.error(`Error processing message ${i + 1}:`, error);
                }
            });
        };
        
        // Initial processing
        processExistingMessages();
        
        // Create a single observer for all mutations
        chatObserver = new MutationObserver((mutations) => {
            try {
                console.log('Mutation observed:', mutations.length, 'changes');
                let hasNewMessages = false;
                
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            console.log('New node added:', {
                                nodeType: node.nodeType,
                                nodeName: node.nodeName,
                                classes: node.className || 'N/A',
                                text: node.textContent?.substring(0, 50) + '...',
                                parentClasses: node.parentElement?.className || 'no-parent'
                            });
                            
                            // Check if this node or any of its children is a message
                            if (node.matches?.(CHAT_MESSAGE_SELECTOR) || 
                                node.querySelector?.(CHAT_MESSAGE_SELECTOR)) {
                                hasNewMessages = true;
                            }
                            
                            processSingleMessage(node);
                        }
                    });
                });
                
                // If we added new messages, do a full rescan to catch any we might have missed
                if (hasNewMessages) {
                    setTimeout(processExistingMessages, 100);
                }
            } catch (error) {
                console.error('Error in mutation observer:', error);
            }
        });
        
        // Start observing with aggressive settings to catch all changes
        const observerConfig = {
            childList: true,
            subtree: true,
            characterData: true,
            characterDataOldValue: true
        };
        
        chatObserver.observe(chatContainer, observerConfig);
        
        // Also observe the document for dynamic content loads
        if (chatContainer !== document.documentElement) {
            chatObserver.observe(document.documentElement, {
                childList: true,
                subtree: false
            });
        }
        
        console.log('Chat observer initialized successfully');
        
    } catch (error) {
        console.error('Error initializing chat observer:', error);
        
        // Retry on error
        clearTimeout(initChatObserver.retryTimer);
        initChatObserver.retryTimer = setTimeout(() => {
            console.log('Retrying chat observer initialization after error...');
            initChatObserver();
        }, 1000);
    }
}

// Function to initialize the product scroller
function initProductScroller() {
    console.log('=== Initializing Product Scroller ===');
    
    // Initialize chat observer
    initChatObserver();
    
    // Log all elements that might be chat containers
    logElementInfo(CHAT_CONTAINER_SELECTOR, 'Chat Container');
    logElementInfo('[class*="chat"]', 'Any Chat Element');
    
    // Log product numbers for debugging
    const productNumbers = document.querySelectorAll(PRODUCT_NUMBER_SELECTOR);
    console.log(`Found ${productNumbers.length} product numbers on page`);
    productNumbers.forEach((el, i) => {
        console.log(`Product ${i + 1}:`, {
            number: el.textContent.trim(),
            classes: el.className,
            parentClasses: el.parentElement?.className || 'No parent',
            isVisible: isElementInViewport(el)
        });
    });
    
    // Add click handler to document and delegate events
    console.log('Adding click event listener to document');
    document.addEventListener('click', (e) => {
        // Ignore clicks on pin buttons so their own handlers can run
        if (e.target.closest('.pin-button, .m4b-button, [data-pin-button]')) {
            console.log('Pin button clicked, skipping document handler');
            return;
        }

        // Check if click is on a product number or its container
        const productElement = e.target.closest('.product-number-container') ||
                              e.target.closest('.product-number');
        
        if (productElement) {
            console.log('Product element clicked:', productElement);
            e.preventDefault();
            e.stopPropagation();
            
            const productNumber = productElement.dataset.productNumber || 
                               productElement.closest('[data-product-number]')?.dataset.productNumber;
            
            if (productNumber) {
                console.log('Handling click on product #' + productNumber);
                handleProductNumberClick(e, productNumber);
            } else {
                console.log('No product number found for clicked element');
            }
            return;
        }
        
        // Handle regular chat message clicks
        const messageElement = e.target.closest(CHAT_MESSAGE_SELECTOR) || 
                             e.target.closest(CHAT_MESSAGE_TEXT_SELECTOR) ||
                             [...document.querySelectorAll(CHAT_MESSAGE_TEXT_SELECTOR)].find(el => el.contains(e.target));
        
        if (messageElement) {
            console.log('Chat message clicked:', {
                text: messageElement.textContent.trim(),
                classes: messageElement.className,
                id: messageElement.id
            });
            handleMessageClick(e);
        }
    }, true); // Use capture phase to catch events earlier
    
    console.log('Product Scroller initialized');
}

// Helper function to check if element is in viewport
function isElementInViewport(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Debug function to log initialization
console.log('TikTok Shop Enhancer: Product Scroller script loaded');

// Start the extension when the page loads
function startExtension() {
    console.log('TikTok Shop Enhancer: Starting initialization...');
    
    // Check if we're on a TikTok Shop page
    if (!window.location.href.includes('tiktok.com')) {
        console.log('Not on TikTok Shop, skipping initialization');
        return;
    }
    
    // Initialize with a small delay to ensure DOM is ready
    if (document.readyState === 'loading') {
        console.log('Waiting for DOM to load...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM fully loaded, initializing...');
            initProductScroller();
        });
    } else {
        console.log('DOM already loaded, initializing directly');
        initProductScroller();
    }
}

// Start the extension
startExtension();

// Also listen for dynamic content changes
const observer = new MutationObserver((mutations) => {
    // Check if we're already initialized
    if (!document.querySelector(CHAT_CONTAINER_SELECTOR)) {
        // If chat container is added dynamically, reinitialize
        if (mutations.some(mutation => 
            Array.from(mutation.addedNodes).some(node => 
                node.nodeType === 1 && 
                (node.matches(CHAT_CONTAINER_SELECTOR) || 
                 node.querySelector(CHAT_CONTAINER_SELECTOR))
            )
        )) {
            console.log('New chat container detected, reinitializing...');
            initProductScroller();
        }
    }
});

// Start observing the document with the configured parameters
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Additional check in case the chat loads very late
setTimeout(() => {
    if (!document.querySelector(CHAT_CONTAINER_SELECTOR)) {
        console.log('Performing additional check for chat container...');
        initProductScroller();
    }
}, 5000);

// Self-invoking function to ensure proper scoping
(function() {
    // Any additional initialization code can go here
    console.log('TikTok Shop Enhancer: Initialization complete');
})();
