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
   * DOM SELECTORS EXPLANATION:
   * To determine if the AI is currently generating a response, we look for the
   * presence of a "Stop generating" button. This button only appears while
   * the AI is actively writing.
   *
   * ChatGPT's UI elements can change over time, so we use multiple selectors
   * for robustness:
   * - `[data-testid="stop-button"]`: A common and often stable attribute used
   *   by React/frontend frameworks for testing and identifying components.
   * - `[aria-label="Stop streaming"]`: An accessibility attribute that also
   *   reliably indicates the stop button's presence and function.
   *
   * If either of these selectors finds an element, it means the AI is currently writing.
   */
  const stopButton = document.querySelector('[data-testid="stop-button"]') ||
    document.querySelector('[aria-label="Stop streaming"]');

  // Convert the existence of the `stopButton` element into a simple boolean.

  // If `stopButton` is an element (truthy), `currentlyGenerating` becomes `true`.
  // If `stopButton` is `null` (falsy), `currentlyGenerating` becomes `false`.
  const currentlyGenerating = !!stopButton;

  // DETECTING COMPLETION (The "Falling Edge"):
  // We are interested in the specific moment when the AI *finishes* generating.
  // This is detected by observing a state change:
  // 1. `isGenerating` was `true` (meaning the AI *was* generating in the previous check).
  // 2. `currentlyGenerating` is `false` (meaning the AI is *no longer* generating now).
  // This transition is often referred to as a "falling edge" trigger in electronics,
  // signifying the end of an active state.
  if (isGenerating && !currentlyGenerating) {
    console.log("Generation finished. Starting token extraction...");
    handleGenerationComplete(); // Trigger the core logic for text extraction and token counting.
  }

  // Update our global state for the next check.
  // This ensures `isGenerating` always reflects the most recent status.
  isGenerating = currentlyGenerating;
}

/**
 * Main logic to extract the AI's response text, clean it, estimate token count,
 * and save the result. This function is ONLY called once per AI response,
 * when the generation process has completed.
 */
async function handleGenerationComplete() {
  try {
    // 1. SELECT LAST ASSISTANT MESSAGE
    // ChatGPT's UI marks messages from the AI with a specific
    // `data-message-author-role="assistant"` attribute.
    // We query for all such elements on the page.
    // The spread operator `...` converts the returned NodeList into a true Array,
    // which makes it easier to work with (e.g., accessing the last element).
    const assistantMessages = [...document.querySelectorAll('[data-message-author-role="assistant"]')];

    // If no assistant messages are found, it might indicate a page clear,
    // an error, or a very fast generation that was missed. We log a warning and exit.
    if (assistantMessages.length === 0) {
      console.warn("No assistant messages found. This may happen if the page was cleared or an error occurred.");
      return;
    }

    // The last element in the `assistantMessages` array will always be the
    // most recently generated response from the AI.
    const lastMessageNode = assistantMessages[assistantMessages.length - 1];

    // 2. CLEAN TEXT (CLONING STRATEGY)
    // To accurately count tokens, we need to remove all non-content UI elements
    // that might be embedded within the message (e.g., "Copy code" buttons, icons).
    // We use `cloneNode(true)` to create a deep copy of the message element.
    // This is crucial because it allows us to modify (remove children from)
    // the cloned node without altering the actual, visible DOM on the user's screen.
    const clonedNode = lastMessageNode.cloneNode(true);

    // List of CSS selectors for UI elements that we want to REMOVE from the
    // cloned message before counting its text content. These elements are
    // considered "noise" for token estimation.
    const uiSelectors = [
      'button',         // Removes all buttons (e.g., "Copy code", "Regenerate response").
      '.icon',          // Removes various SVG icons that might be present.
      '[aria-label]',   // Removes elements with `aria-label` attributes, which often
      // contain hidden accessibility text that isn't part of the
      // visible content but could inflate token counts.
      '.text-xs'        // Removes small text elements, often used for disclaimers
      // like "ChatGPT can make mistakes" at the bottom of messages.
    ];

    // Iterate through each selector and remove matching elements from the cloned node.
    uiSelectors.forEach(selector => {
      // `querySelectorAll` on the cloned node finds all descendants matching the selector.
      const elements = clonedNode.querySelectorAll(selector);
      // Iterate through the found elements and remove each one.
      elements.forEach(el => el.remove());
    });

    // Extract the text content from the now-cleaned cloned node.
    // `innerText` is generally preferred as it reflects visible text,
    // while `textContent` includes text from hidden elements. We use `||`
    // as a fallback in case `innerText` is not available or empty.
    const extractedText = clonedNode.innerText || clonedNode.textContent || "";
    // `trim()` removes leading/trailing whitespace, ensuring a clean text for counting.
    const cleanText = extractedText.trim();

    // 3. TOKEN ESTIMATION (HEURISTIC)
    // Directly using a complex tokenizer like OpenAI's `tiktoken` is possible, but too heavy for now.
    // tiktoken: https://github.com/openai/tiktoken
    // Therefore, we use a common heuristic for text.
    // Rule of thumb: 1 token is approximately 4 characters.
    // This provides a reasonable, quick, and lightweight estimation.
    const FALLBACK_VALUE = 20; // A default token count for cases where the text might be empty.
    let tokenCount = FALLBACK_VALUE;

    // If there's actual text content, calculate the token count.
    if (cleanText.length > 0) {
      // `Math.ceil` is used to round up, ensuring that even a partial token
      // (e.g., 5 characters) is counted as a full token, providing a slightly
      // more conservative (higher) estimate.
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
      // Retrieve the existing history array from localStorage.
      const storedHistory = localStorage.getItem('tokenUsageHistory');

      // If history exists, parse it from its JSON string representation back into a JavaScript array.
      if (storedHistory) {
        history = JSON.parse(storedHistory);
      }

      // Add the newly calculated token count to the history array.
      history.push(tokenCount);
      // Save the updated history array back to localStorage, converting it to a JSON string.
      localStorage.setItem('tokenUsageHistory', JSON.stringify(history));

      console.log(`[CheckGPT] Saved response: ${tokenCount} tokens.`);

    } catch (storageError) {
      // Log any errors encountered during localStorage operations.
      console.error("Failed to save to localStorage:", storageError);
    }

  } catch (error) {
    // Catch and log any critical errors that occur during the extraction process.
    console.error("Critical error in token extraction:", error);
  }
}

/**
 * OBSERVER SETUP
 * Instead of constantly checking the DOM at fixed intervals (polling),
 * which can be inefficient, we use a `MutationObserver`.
 * A `MutationObserver` is a Web API that allows us to react
 * efficiently to changes in the DOM structure or attributes.
 * It notifies us instantly whenever specified changes occur, making it
 * much more performant than a timer-based polling approach.
 */
function setupGenerationObserver() {
  // If an observer already exists (e.g., due to page navigation or re-initialization),
  // disconnect it first to prevent duplicate observers and memory leaks.
  if (observer) {
    observer.disconnect();
  }

  // Create a new MutationObserver instance.
  // The callback function (`(mutations) => { ... }`) will be executed
  // whenever a mutation matching the observer's configuration occurs.
  observer = new MutationObserver((mutations) => {
    // When the DOM changes, we re-check the generation status.
    // This is efficient because `checkGenerationStatus` only performs
    // a quick DOM query and state comparison.
    checkGenerationStatus();
  });

  // Configure the observer to watch the entire `document.body` for specific types of changes.
  // `observer.observe()` starts the observation process.
  observer.observe(document.body, {
    childList: true,      // Observe for additions or removals of child nodes (e.g., a new message appearing).
    subtree: true,        // Observe all descendants of the target node (document.body), not just direct children.
    attributes: true,     // Observe for changes to attributes of elements.
    // `attributeFilter` specifies which attributes to watch. This is a performance optimization:
    // we only care about attributes that are likely to change on the "Stop" button,
    // avoiding unnecessary notifications for other attribute changes.
    attributeFilter: ['disabled', 'aria-label', 'data-testid']
  });

  console.log("CheckGPT: Token observer initialized.");
}

/**
 * INITIALIZATION
 * This function ensures that our `MutationObserver` is set up correctly
 * once the web page is ready.
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