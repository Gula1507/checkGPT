import { describe, it, expect, vi, beforeEach } from "vitest";
// @vitest-environment jsdom

describe("promptDetector.js", () => {
    let observerCallback;

    beforeEach(async () => {
        document.body.innerHTML = "";
        vi.clearAllMocks();

        // Mock MutationObserver
        global.MutationObserver = vi.fn((cb) => {
            observerCallback = cb;
            return {
                observe: vi.fn(),
                disconnect: vi.fn(),
                takeRecords: vi.fn()
            };
        });

        // Re-import to attach our mocked observer
        window.checkGPTPromptDetectorActive = false;
        await import("../content/promptDetector.js?bust=" + Date.now());
    });

    it("fires gpt-prompt-complete when generation finishes", async () => {
        const eventSpy = vi.fn();
        window.addEventListener("gpt-prompt-complete", eventSpy);

        const msg = document.createElement("div");
        msg.setAttribute("data-message-author-role", "assistant");
        msg.textContent = "Hello from ChatGPT";
        document.body.appendChild(msg);

        // Create Stop button in DOM
        const btn = document.createElement("button");
        btn.setAttribute("aria-label", "Stop generating");
        document.body.appendChild(btn);
        // Manually trigger observer callback
        observerCallback([{
            target: document.body,
            type: 'childList'
        }]);

        // 2. Simulate Disappearance
        btn.remove();

        vi.useFakeTimers();
        observerCallback([{ target: document.body }]);

        await vi.advanceTimersByTimeAsync(1500);

        expect(eventSpy).toHaveBeenCalled();

        vi.useRealTimers();
    });
});
