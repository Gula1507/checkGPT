/**
 * AI Impact Tracker - Token Extraction
 * =====================================
 * This script monitors the ChatGPT interface for the completion of a response generation,
 * extracts the text of the last response, estimates the token count,
 * logs it to the console, and saves it to localStorage.
 */

// State tracking
let isGenerating = false;
let observer = null;

/**
 * Checks the current generation status of the AI
 * Triggers processing when generation finishes
 */
function checkGenerationStatus() {
  // Identify the stop button vs send button state
  // "Stop" button usually appears when generating
  // Send button usually has data-testid="send-button"
  const sendButton = document.querySelector('[data-testid="send-button"]');
  const stopButton = document.querySelector('[aria-label="Stop generating"]');

  // Determine current state
  // If stop button exists, we are generating
  const currentlyGenerating = !!stopButton;

  // Debug every state change or at least periodically if needed
  // But since this is triggered by mutation, it might fire often.
  // We'll log only if something interesting happens or just to verify we are running.
  if (currentlyGenerating !== isGenerating) {
    console.log(`[TokenExtractor] State change: Generating=${currentlyGenerating} (StopBtn=${!!stopButton}, SendBtn=${!!sendButton})`);
  }

  if (isGenerating && !currentlyGenerating) {
    // Falling edge: Generation just finished
    console.log("Generation finished. Extracting tokens...");
    handleGenerationComplete();
  }

  isGenerating = currentlyGenerating;
}

/**
 * Handles the completion of AI generation
 * Extracts text, estimates tokens, logs, and saves to storage
 */
async function handleGenerationComplete() {
  try {
    // 1. Identify valid DOM element of the LAST completed AI response
    const assistantMessages = [...document.querySelectorAll('[data-message-author-role="assistant"]')];

    if (assistantMessages.length === 0) {
      console.warn("No assistant messages found after generation.");
      return;
    }

    const lastMessageNode = assistantMessages[assistantMessages.length - 1];

    // 2. Extract text, excluding UI elements
    // Clone node to safely manipulate it
    const clonedNode = lastMessageNode.cloneNode(true);

    // Remove common UI artifacts
    const uiSelectors = [
      'button',
      '.icon',
      '[aria-label]', // buttons often have labels
      '.text-xs'      // footer text often small
    ];

    uiSelectors.forEach(selector => {
      const elements = clonedNode.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    const extractedText = clonedNode.innerText || clonedNode.textContent || "";
    const cleanText = extractedText.trim();

    // 3. Estimate token count or use fallback
    const FALLBACK_VALUE = 20; // Default prompt size as requested

    let tokenCount = FALLBACK_VALUE;
    if (cleanText.length > 0) {
      // Simple estimation: 1 token ~= 4 chars
      tokenCount = Math.ceil(cleanText.length / 4);
    } else {
      tokenCount = FALLBACK_VALUE;
    }

    // 4. Output to console
    console.log(`Last response tokens: ${tokenCount}`);

    // 5. Save to LocalStorage
    try {
      // Get existing history
      let history = [];
      const storedHistory = localStorage.getItem('tokenUsageHistory');
      if (storedHistory) {
        history = JSON.parse(storedHistory);
      }

      // Add new integer
      history.push(tokenCount);

      // Save back
      localStorage.setItem('tokenUsageHistory', JSON.stringify(history));
      console.log("Saved token count to localStorage:", tokenCount);

    } catch (storageError) {
      console.error("Error saving to localStorage:", storageError);
    }

  } catch (error) {
    console.error("Error in handleGenerationComplete:", error);
  }
}

/**
 * Sets up a MutationObserver to detect status changes
 */
function setupGenerationObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    checkGenerationStatus();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'aria-label', 'data-testid']
  });

  console.log("Token extraction observer started.");
}

/**
 * Initializes the script
 */
function initialize() {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setupGenerationObserver();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      setupGenerationObserver();
    });
  }
}

// Start the script
initialize();