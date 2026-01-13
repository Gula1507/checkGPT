/**
 * CheckGPT - Token Extraction Module
 * ===================================
 * This script is responsible for estimating the token usage of ChatGPT's responses.
 * 
 * CORE LOGIC:
 * 1. Listen for 'gpt-prompt-complete' event from promptDetector.js
 * 2. Extract the text from the *last* assistant message.
 * 3. Clean the text (remove buttons, icons, noise).
 * 4. Estimate tokens (approx 1 token = 4 characters).
 * source: https://platform.openai.com/tokenizer
 * 5. Store the result in LocalStorage for later use.
 * 
 * DATA CONSUMPTION:
 * The estimated token count is saved to the browser's LocalStorage under the key 'tokenUsageHistory'.
 * Other scripts (like popups or indicators) can read this data:
 * 
 *    const history = JSON.parse(localStorage.getItem('tokenUsageHistory') || "[]");
 *    const lastCount = history[history.length - 1]; 
 */

/**
 * Main logic to extract the AI's response text, clean it, estimate token count,
 * and save the result. This function is ONLY called once per AI response.
 */
let lastProcessedText = "";

/**
 * Main logic to extract the AI's response text, clean it, estimate token count,
 * and save the result. This function is ONLY called once per AI response.
 */
async function handleGenerationComplete(providedText = null) {
  try {
    let cleanText = "";

    if (providedText) {
      cleanText = providedText.trim();
    } else {
      // Fallback: SELECT LAST ASSISTANT MESSAGE
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
      cleanText = extractedText.trim();
    }

    // 3. TOKEN ESTIMATION (HEURISTIC)
    // We use a character-count heuristic (chars/4) instead of a full tokenizer library (tiktoken).
    // REASON: A full tokenizer is too heavy for now.
    // Source: https://platform.openai.com/tokenizer

    const FALLBACK_VALUE = 20;
    if (cleanText.length > 0) {
      if (cleanText === lastProcessedText) {
        console.log("CheckGPT: Text identical to last processed. Skipping token computation.");
        return;
      }
      lastProcessedText = cleanText;

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
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ tokenUsageHistory: history });
      } else {
        console.warn("[CheckGPT] chrome.storage.local not available. Is the 'storage' permission in manifest?");
      }

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
 * INITIALIZATION
 * Connect to the central prompt detector.
 */
function initialize() {
  window.addEventListener("gpt-prompt-complete", (event) => {
    console.log("CheckGPT: Token computation triggered by prompt detector.");
    const text = event.detail ? event.detail.text : null;
    handleGenerationComplete(text);
  });
  console.log("CheckGPT: Token extraction module initialized (Passive Mode).");
}

// Start
initialize();