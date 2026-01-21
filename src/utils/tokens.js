/**
 * CheckGPT - Token Extraction Module
 * ===================================
 * This script estimates the token usage of ChatGPT's responses.
 * * Workflow:
 * 1. Listen for prompt completion.
 * 2. Extract and clean the text from the DOM.
 * 3. Calculate tokens (heuristic).
 * 4. Save data with timestamps for history tracking.
 */

let lastProcessedText = "";
let lastProcessedImageCount = -1;

/**
 * Handles the complete lifecycle of a detected prompt response.
 * * Steps performed:
 * - Text Cleaning: Removes UI noise (buttons, icons).
 * - Estimation: Calculates tokens based on character count.
 * - Persistence: Saves result to LocalStorage and Chrome Storage.
 * * @param {string|null} providedText - Optional text override.
 */
async function handleGenerationComplete(providedText = null, type = "TEXT", imageCount = 0) {
  try {
    let cleanText = "";
    let tokenCount = 0;

    // ---------------------------------------------------------
    // 1. Text Extraction & Cleaning
    // ---------------------------------------------------------
    if (providedText !== null) {
      cleanText = providedText.trim();
    } else {
      // Fallback: Scrape from DOM if no text provided.
      // - Step A: Find all assistant messages.
      // - Step B: Select the last one (most recent).
      const assistantMessages = [...document.querySelectorAll('[data-message-author-role="assistant"]')];

      if (assistantMessages.length === 0) {
        console.warn("CheckGPT: No assistant messages found.");
        return;
      }

      const lastMessageNode = assistantMessages[assistantMessages.length - 1];

      // - Step C: Deep Clone & Sanitize
      //   We clone the node to modify it without affecting the visible page.
      //   We remove:
      //   * Buttons (Copy, Regenerate)
      //   * Icons (SVGs)
      //   * Hidden accessibility text (aria-labels)
      //   * Footer disclaimers (.text-xs)
      const clonedNode = lastMessageNode.cloneNode(true);
      const uiSelectors = ['button', '.icon', '[aria-label]', '.text-xs'];

      uiSelectors.forEach(selector => {
        const elements = clonedNode.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });

      const extractedText = clonedNode.innerText || clonedNode.textContent || "";
      cleanText = extractedText.trim();
    }

    // 3. TOKEN ESTIMATION
    // Text: 1 token ~= 4 chars
    // Images: Fixed amount per image

    // Text: 1 token ~= 4 chars
    // Images: Just counted here, energy calculated in calculator.js

    const FALLBACK_VALUE = 20;

    let textTokens = 0;
    // let imageTokens = 0; // Removed, counted separately

    // Calculate Text Tokens

    // Duplicate Check removed: promptDetector.js (Stop Button) now handles unique events.
    // We must process every event here to allow consecutive image generations (which look identical).

    lastProcessedText = cleanText;
    lastProcessedImageCount = imageCount;

    if (cleanText.length > 0) {
      textTokens = Math.ceil(cleanText.length / 4);
    }

    // Total is primarily text tokens for the history, separate imageCount is stored too.
    tokenCount = textTokens;

    // Fallback if absolutely nothing (shouldn't happen if prompted)
    if (tokenCount === 0 && cleanText.length === 0 && imageCount === 0) {
      tokenCount = FALLBACK_VALUE;
    }

    console.log(`CheckGPT: Last response estimated tokens: ${tokenCount} (Type: ${type}, Images: ${imageCount})`);

    // ---------------------------------------------------------
    // 3. Persistence Logic (Storage & Sync)
    // ---------------------------------------------------------
    try {
      let history = [];
      const storedHistory = localStorage.getItem('tokenUsageHistory');

      // Load and Validate existing history
      if (storedHistory) {
        try {
          const parsed = JSON.parse(storedHistory);
          // Safety Check:
          // - Must be an Array
          // - If corrupt, reset to empty array
          if (Array.isArray(parsed)) {
            history = parsed;
          } else {
            console.warn("CheckGPT: Storage was not an array. Resetting history.");
            history = [];
          }
        } catch (e) {
          console.warn("CheckGPT: Error parsing history. Resetting.", e);
          history = [];
        }
      }

      // Create new entry
      // - tokens: The calculated count
      // - timestamp: Used for "Today" vs "Always" filtering
      const newEntry = {
        tokens: tokenCount,
        imageCount: imageCount,
        type: type,
        timestamp: Date.now()
      };

      history.push(newEntry);

      // Save to Browser LocalStorage (Persistence)
      localStorage.setItem('tokenUsageHistory', JSON.stringify(history));

      // Sync to Chrome Storage (Accessibility for Popup)
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ tokenUsageHistory: history });
      }

      console.log(`CheckGPT: Saved response: ${tokenCount} tokens.`);

      // Notify UI Components
      // - Triggers update in co2Indicator.js
      window.dispatchEvent(new CustomEvent("checkgpt-tokens-updated", {
        detail: { tokenCount }
      }));

    } catch (storageError) {
      console.error("CheckGPT: Failed to save to localStorage:", storageError);
    }

  } catch (error) {
    console.error("CheckGPT: Critical error in token extraction:", error);
  }
}

/**
 * Initialization
 * ===================================
 * - Sets up event listener for 'gpt-prompt-complete'.
 * - Connects this module to the promptDetector.
 */
function initialize() {
  window.addEventListener("gpt-prompt-complete", (event) => {
    console.log("CheckGPT: Token computation triggered by prompt detector.");
    const { text, type, imageCount } = event.detail || {};
    handleGenerationComplete(text, type, imageCount);
  });
  console.log("CheckGPT: Token extraction module initialized (Passive Mode).");
}

// Start the module
initialize();