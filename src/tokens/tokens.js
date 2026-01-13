/**
 * CheckGPT - Token Extraction Module
 * ===================================
 * This script is responsible for estimating the token usage of ChatGPT's responses.
 * 
 * CORE LOGIC:
 * 1. Monitor the DOM to detect when the AI is generating text ("Stop" button visible).
 * 2. Detect when generation stops (Transition from "Stop" button -> "Send" button).
 * 3. Extract the text from the *last* assistant message.
 * 4. Clean the text (remove buttons, icons, noise).
 * 5. Estimate tokens (approx 1 token = 4 characters).
 * source: https://platform.openai.com/tokenizer
 * 6. Store the result in LocalStorage for later use.
 * 
 * DATA CONSUMPTION:
 * The estimated token count is saved to the browser's LocalStorage under the key 'tokenUsageHistory'.
 * Other scripts (like popups or indicators) can read this data:
 * 
 *    const history = JSON.parse(localStorage.getItem('tokenUsageHistory') || "[]");
 *    const lastCount = history[history.length - 1]; 
 */

// Global state to track if we were previously generating.
// This allows us to detect the "falling edge" (when generation stops).
let isGenerating = false;
let observer = null;

/**
 * Checks the current generation status of the AI interface.
 * This function is called whenever the DOM changes (via MutationObserver).
 */
function checkGenerationStatus() {
  /**
   * DOM SELECTORS:
   * To determine if the AI is currently generating a response, we look for the
   * presence of a "Stop generating" button. 
   *
   * We use multiple selectors because ChatGPT's internal attributes (data-testid)
   * or structure can change. The selectors below have proven stable for active generation detection.
   */
  const stopButton = document.querySelector('[data-testid="stop-button"]') ||
    document.querySelector('[aria-label="Stop streaming"]');

  const currentlyGenerating = !!stopButton;

  // DETECTING COMPLETION (The "Falling Edge"):
  // We monitor the transition from TRUE (generating) to FALSE (finished).
  // This precise moment indicates that the full response is now on screen.
  if (isGenerating && !currentlyGenerating) {
    console.log("Generation finished. Starting token extraction...");
    handleGenerationComplete();
  }

  // Update logic state for the next cycle
  isGenerating = currentlyGenerating;
}

/**
 * Main logic to extract the AI's response text, clean it, estimate token count,
 * and save the result. This function is ONLY called once per AI response.
 */
async function handleGenerationComplete() {
  try {
    // 1. SELECT LAST ASSISTANT MESSAGE
    // We isolate the most recent message to ensure we only count the new content.
    const assistantMessages = [...document.querySelectorAll('[data-message-author-role="assistant"]')];

    if (assistantMessages.length === 0) {
      console.warn("No assistant messages found. This may happen if the page was cleared or an error occurred.");
      return;
    }

    const lastMessageNode = assistantMessages[assistantMessages.length - 1];

    // 2. CLEAN TEXT (CLONING STRATEGY)
    // We clone the node (deep copy) so we can modify it without altering 
    // the user's visible DOM. We then strip out UI artifacts (buttons, icons, disclaimers)
    // to ensure we are only counting the actual tokens used by the AI's text.
    const clonedNode = lastMessageNode.cloneNode(true);

    const uiSelectors = [
      'button',         // "Copy code", "Regenerate" buttons
      '.icon',          // SVG icons
      '[aria-label]',   // Accessibility labels that add hidden text
      '.text-xs'        // Footer disclaimers
    ];

    uiSelectors.forEach(selector => {
      const elements = clonedNode.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    const extractedText = clonedNode.innerText || clonedNode.textContent || "";
    const cleanText = extractedText.trim();

    // 3. TOKEN ESTIMATION (HEURISTIC)
    // We use a character-count heuristic (chars/4) instead of a full tokenizer library (tiktoken).
    // REASON: A full tokenizer is too heavy for now.
    // Source: https://platform.openai.com/tokenizer

    const FALLBACK_VALUE = 20;
    let tokenCount = FALLBACK_VALUE;

    if (cleanText.length > 0) {
      // Math.ceil ensures we account for partial tokens conservatively.
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

      history.push(tokenCount);
      localStorage.setItem('tokenUsageHistory', JSON.stringify(history));

      console.log(`[CheckGPT] Saved response: ${tokenCount} tokens.`);

    } catch (storageError) {
      console.error("Failed to save to localStorage:", storageError);
    }

  } catch (error) {
    console.error("Critical error in token extraction:", error);
  }
}

/**
 * OBSERVER SETUP
 * We use a MutationObserver instead of polling (setInterval).
 * REASON: An Observer triggers ONLY when the DOM actually changes, which is much more efficient.
 */
function setupGenerationObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    checkGenerationStatus();
  });

  // Watch for changes that indicate a button state update (disabled, aria-labels)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'aria-label', 'data-testid']
  });

  console.log("CheckGPT: Token observer initialized.");
}

/**
 * INITIALIZATION
 * Start the observer when the page is fully loaded.
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

// Start
initialize();