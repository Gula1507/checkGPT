/**
 * CheckGPT - Token Extraction Module
 * ===================================
 * This script is responsible for estimating the token usage of ChatGPT's responses.
 * 
 * CORE LOGIC:
 * 1. Monitor the DOM for changes in the last assistant message.
 * 2. Detect when text stops changing for a set timeout (Idle Detection).
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

// Global state to track generation status
let observer = null;
let lastAssistantText = "";
let lastChangeTime = 0;
let generationRunning = false;

const INACTIVE_TIMEOUT = 800;

/**
 * Checks if the response generation has finished (idle timeout).
 */
function checkIdle() {
  if (!generationRunning) return;

  if (Date.now() - lastChangeTime > INACTIVE_TIMEOUT) {
    generationRunning = false;
    console.log("✅ Prompt wurde ausgelöst (Antwort abgeschlossen)");
    handleGenerationComplete();
  }
}

/**
 * MutationObserver Callback
 * Tracks changes to the last assistant message to detect activity.
 */
function onMutation() {
  const messages = document.querySelectorAll(
    '[data-message-author-role="assistant"]'
  );
  if (!messages.length) return;

  const lastMessage = messages[messages.length - 1];
  const text = lastMessage.innerText.trim();

  // If text changed, update timestamp
  if (text && text !== lastAssistantText) {
    lastAssistantText = text;
    lastChangeTime = Date.now();

    if (!generationRunning) {
      generationRunning = true;
      console.log("✍️ Antwortgenerierung gestartet");
    }
  }
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
      // Sync to chrome.storage.local for popup access
      chrome.storage.local.set({ tokenUsageHistory: history });

      console.log(`[CheckGPT] Saved response: ${tokenCount} tokens.`);

      // mit diesem event lassen wir andere scripts wissen, dass die tokenanzahl geändert wurde
      window.dispatchEvent(new CustomEvent("checkgpt-tokens-updated", {
        detail: { tokenCount }
      }));

    } catch (storageError) {
      console.error("Failed to save to localStorage:", storageError);
    }

  } catch (error) {
    console.error("Critical error in token extraction:", error);
  }
}

/**
 * OBSERVER SETUP
 */
function setupObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver(onMutation);

  // Watch for character data changes (typing) and child list changes (new blocks)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Start the idle checker
  setInterval(checkIdle, 300);

  console.log("CheckGPT: Token observer initialized (Idle detection mode).");
}

/**
 * INITIALIZATION
 * Start the observer when the page is fully loaded.
 */
function initialize() {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setupObserver();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      setupObserver();
    });
  }
}

// Start
initialize();