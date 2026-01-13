let observer;

let lastAssistantText = "";
let lastChangeTime = 0;
let generationRunning = false;

const INACTIVE_TIMEOUT = 800;

/**
 * Prüft, ob die Antwort abgeschlossen ist
 */
function checkIdle() {
    if (!generationRunning) return;

    if (Date.now() - lastChangeTime > INACTIVE_TIMEOUT) {
        generationRunning = false;
        console.log("✅ Prompt wurde ausgelöst (Antwort abgeschlossen)");
        handlePromptDetected();
    }
}

/**
 * MutationObserver Callback
 */
function onMutation() {
    const messages = document.querySelectorAll(
        '[data-message-author-role="assistant"]'
    );
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];
    const text = lastMessage.innerText.trim();

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
 * Wird aufgerufen, wenn Antwort von ChatGPT fertig ist
 */
function handlePromptDetected() {
    console.log("📄 Antworttext:", lastAssistantText);
    // Dispatch event for other scripts (like tokens.js)
    window.dispatchEvent(new CustomEvent("gpt-prompt-complete", {
        detail: { text: lastAssistantText }
    }));
}

/**
 * Wird beim Initialisierung ausgeführt, bevor der Prompt verschickt wurde
 */
function initObserver() {
    observer = new MutationObserver(onMutation);

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    setInterval(checkIdle, 300);

    console.log("ChatGPT Prompt Detector aktiv");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initObserver);
} else {
    initObserver();
}
