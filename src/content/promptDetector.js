(() => {
    // Verhindert doppeltes Laden
    if (window.checkGPTPromptDetectorActive) return;
    window.checkGPTPromptDetectorActive = true;

    let observer;

    let generationRunning = false;

    // Legacy timeout removed. Stop-Button logic is now primary.

    /**
     * Sammelt alle relevanten Nachrichten-Elemente (Text & Tools/Bilder)
     */
    function getMessages() {
        return document.querySelectorAll(
            '[data-message-author-role="assistant"], [data-message-author-role="tool"], .group\\/imagegen-image'
        );
    }

    /**
     * Zählt Bilder im Element (Deine Logik + Fallbacks)
     */
    function countImages(element) {
        if (!element) return 0;

        // 1. Suche nach dem spezifischen Container (DALL-E Container)
        const specificImageContainer = element.classList.contains('group/imagegen-image')
            ? [element]
            : element.querySelectorAll('.group\\/imagegen-image');

        if (specificImageContainer.length > 0) {
            return specificImageContainer.length;
        }

        // 2. Suche nach IMG-Tags mit typischem Alt-Text
        const generatedImages = element.querySelectorAll('img[alt="Generated image"]');
        if (generatedImages.length > 0) {
            return generatedImages.length;
        }

        // 3. Fallback: Große Bilder oder Blob-URLs
        const otherImages = Array.from(element.querySelectorAll('img'));
        let count = 0;
        otherImages.forEach(img => {
            // Filtert kleine Icons oder Profilbilder raus
            if (img.width > 200 || img.src.startsWith("blob:") || img.src.includes("files.oaiusercontent.com")) {
                count++;
            }
        });

        return count;
    }

    /**
     * MutationObserver Callback
     */
    /**
     * Finds the Stop Generating button
     * Supports English, German, and robust data-testid
     */
    function getStopButton() {
        const selectors = [
            '[aria-label="Stop generating"]',
            '[aria-label="Generierung stoppen"]',
            '[data-testid="stop-button"]',
            'button[aria-label="Stop"]' // Simple fallback
        ];

        for (const selector of selectors) {
            const btn = document.querySelector(selector);
            if (btn) return btn;
        }

        // SVG Sprite Fallback (based on user provided hash)
        // Checks if any button contains the specific SVG use ref
        // Note: This is brittle if hash changes, but useful for now.
        const useElements = document.querySelectorAll('use');
        for (const use of useElements) {
            if (use.getAttribute('href')?.includes('#bbf3a9')) {
                return use.closest('button');
            }
        }

        return null;
    }

    /**
     * MutationObserver Callback
     */
    let finalizationTimer = null;
    let lastReportedContent = "";
    let lastReportedImageCount = -1;

    /**
     * Checks if the last message indicates a pending image generation.
     */
    function isPendingImage(text) {
        const indicators = [
            "Creating image",
            "Erstelle Bild",
            "Generiere Bild",
            "Generating image"
        ];
        return indicators.some(indicator => text.includes(indicator));
    }

    /**
     * Finalizes the generation process with a stabilization phase.
     * Polls the DOM to wait for images if "Creating image" text is detected.
     */
    function finalizeGeneration(attempt = 1) {
        // Initial delay 1000ms, subsequent polls 1000ms
        const delay = 1000;
        const MAX_ATTEMPTS = 15; // Max 15 seconds wait

        finalizationTimer = setTimeout(() => {
            const messages = getMessages();
            const lastMessage = messages[messages.length - 1];

            if (!lastMessage) {
                // Should not happen, but if no message, just finish.
                handlePromptDetected();
                return;
            }

            const imageCount = countImages(lastMessage);
            const text = (lastMessage.innerText || "").trim();
            const pending = isPendingImage(text);

            // Stale Check: If content is IDENTICAL to last report, the DOM hasn't updated yet.
            // This happens when the Stop button cycles (Text -> Stop disappears -> Image -> Stop appears)
            // but the Image content hasn't physically replaced the Text content in the DOM yet.
            const isStale = (text === lastReportedContent && imageCount === lastReportedImageCount);

            // Case 1: Images detected. We accept this as valid immediately (or could check .complete)
            // For energy calculation, existence is enough.
            if (imageCount > 0 && !isStale) {
                handlePromptDetected();
                return;
            }

            // Case 2: No images, but text says "Creating image..." OR content is Stale
            // We wait and retry.
            if ((pending || isStale) && attempt < MAX_ATTEMPTS) {
                finalizeGeneration(attempt + 1);
                return;
            }

            // Case 3: No images, no specific "creating" text (or timeout reached).
            // Treat as Text response.
            // If it is STILL stale after max attempts, we likely shouldn't send anything,
            // but strictly speaking, we just report what we see.
            // To be safe against duplicates, we can block it if strict equality holds.
            if (isStale) {
                return;
            }

            handlePromptDetected();

        }, delay);
    }

    /**
     * MutationObserver Callback
     */
    function onMutation() {
        const stopButton = getStopButton();

        if (stopButton) {
            // Case A: Generation is active (Stop button visible)
            if (!generationRunning) {
                generationRunning = true;

                // If we were waiting to finalize the previous one, cancel it.
                // The new generation takes precedence.
                if (finalizationTimer) {
                    clearTimeout(finalizationTimer);
                    finalizationTimer = null;
                }
            }

        } else {
            // Case B: Generation might have finished (Stop button NOT visible)
            if (generationRunning) {
                generationRunning = false;

                // Start the robust finalization (polling)
                finalizeGeneration(1);
            }
        }
    }

    /**
     * Feuert das Event, wenn alles fertig ist
     */
    function handlePromptDetected() {
        // Clear logic to prevent double firing if called directly
        if (finalizationTimer) {
            clearTimeout(finalizationTimer);
            finalizationTimer = null;
        }

        const messages = getMessages();
        const lastMessage = messages[messages.length - 1];

        if (!lastMessage) return;

        const imageCount = countImages(lastMessage);
        // Clone Node to clean UI elements
        const clonedNode = lastMessage.cloneNode(true);
        const uiSelectors = ['button', '.icon', '[aria-label]', '.text-xs'];
        uiSelectors.forEach(selector => {
            clonedNode.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Specific filter for "Upgrade to create faster" banner
        const allElements = clonedNode.querySelectorAll('*');
        allElements.forEach(el => {
            if (el.innerText && el.innerText.includes("Upgrade to create faster")) {
                el.remove();
            }
        });

        const text = (clonedNode.innerText || "").trim();
        const type = imageCount > 0 ? "IMAGE" : "TEXT";

        // Update Stale Trackers
        lastReportedContent = text;
        lastReportedImageCount = imageCount;

        // Event an tokens.js senden
        window.dispatchEvent(new CustomEvent("gpt-prompt-complete", {
            detail: {
                text: text,
                type: type,
                imageCount: imageCount
            }
        }));
    }

    /**
     * Initialisierung
     */
    function initObserver() {
        observer = new MutationObserver(onMutation);

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true // Wichtig für Bild-Ladezustände
        });

        // setInterval(checkIdle, 500); // Disabled: Stop Button detection is event-driven
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initObserver);
    } else {
        initObserver();
    }
})();