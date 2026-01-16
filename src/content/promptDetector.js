(() => {
    // Verhindert doppeltes Laden
    if (window.checkGPTPromptDetectorActive) return;
    window.checkGPTPromptDetectorActive = true;

    let observer;

    // let lastContentHash = ""; // Unused
    let lastChangeTime = 0; // Used for potential debugging / future timeouts
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
     * Prüft, ob die Generierung abgeschlossen ist (Idle Check)
     */
    function checkIdle() {
        // Legacy idle check disabled in favor of Stop Button detection.
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
    function onMutation() {
        const stopButton = getStopButton();

        if (stopButton) {
            // Case A: Generation is active (Stop button visible)
            if (!generationRunning) {
                generationRunning = true;
                console.log("CheckGPT: Stop button appeared. Generation started.");
            }
            // Update timestamp to keep "alive" if we still wanted timeouts (optional now)
            lastChangeTime = Date.now();

        } else {
            // Case B: Generation might have finished (Stop button NOT visible)
            if (generationRunning) {
                // Determine if it really finished or just flickered.
                // We use a small buffer or just assume finished.
                // The previous logic used a timeout, but for "Stop Button" logic, 
                // disappearance usually means DONE.

                generationRunning = false;
                console.log("CheckGPT: Stop button disappeared. Generation finished.");

                // Give the DOM a moment to settle (final text render) before scraping
                setTimeout(() => {
                    handlePromptDetected();
                }, 500);
            }
        }
    }

    /**
     * Feuert das Event, wenn alles fertig ist
     */
    function handlePromptDetected() {
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

        console.log(`CheckGPT Report: Type=${type}, Images=${imageCount}, TextLength=${text.length}, TextContent="${text.substring(0, 50)}"`);

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

        console.log("CheckGPT: Prompt Detector (Text & Image) active");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initObserver);
    } else {
        initObserver();
    }
})();