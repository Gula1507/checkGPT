(() => {
    // Verhindert doppeltes Laden
    if (window.checkGPTPromptDetectorActive) return;
    window.checkGPTPromptDetectorActive = true;

    let observer;
    let lastContentHash = "";
    let lastChangeTime = 0;
    let generationRunning = false;

    // Wartezeit, bis wir annehmen, dass der Output fertig ist
    const INACTIVE_TIMEOUT = 4000;

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
        if (!generationRunning) return;

        if (Date.now() - lastChangeTime > INACTIVE_TIMEOUT) {
            generationRunning = false;
            console.log("CheckGPT: Response detection finished (Idle).");
            handlePromptDetected();
        }
    }

    /**
     * MutationObserver Callback
     */
    function onMutation() {
        const messages = getMessages();
        if (!messages.length) return;

        const lastMessage = messages[messages.length - 1];

        // Clone Node to clean UI elements (Buttons, Icons, etc.)
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
        const imageCount = countImages(lastMessage);

        // Hash erstellen, um Änderungen zu erkennen (Textlänge + Bildanzahl)
        const currentContentHash = `${text.length}-${imageCount}`;

        if (currentContentHash !== lastContentHash) {
            lastContentHash = currentContentHash;
            lastChangeTime = Date.now();

            if (!generationRunning) {
                generationRunning = true;
                console.log("CheckGPT: Activity detected...");
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

        setInterval(checkIdle, 500); // Check alle 500ms

        console.log("CheckGPT: Prompt Detector (Text & Image) active");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initObserver);
    } else {
        initObserver();
    }
})();