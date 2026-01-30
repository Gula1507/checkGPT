import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// @vitest-environment jsdom

describe("promptDetector.js", () => {
    let observerCallback;
    let observerObserve = vi.fn();
    let observerDisconnect = vi.fn();

    beforeEach(async () => {
        document.body.innerHTML = "";
        vi.clearAllMocks();
        
        // Mock MutationObserver
        global.MutationObserver = vi.fn((cb) => {
            console.log("TEST: MutationObserver created");
            observerCallback = cb;
            return {
                observe: (...args) => console.log("TEST: observe called", args),
                disconnect: () => console.log("TEST: disconnect called"),
                takeRecords: vi.fn()
            };
        });

        // Re-import to attach our mocked observer
        window.checkGPTPromptDetectorActive = false;
        await import("../content/promptDetector.js?bust=" + Date.now());
    });

    it("detects Stop button appearance (Generation Started)", async () => {
        // Create Stop button in DOM
        const btn = document.createElement("button");
        btn.setAttribute("aria-label", "Stop generating");
        document.body.appendChild(btn);

        const consoleSpy = vi.spyOn(console, "log");

        // Manually trigger observer callback
        observerCallback([{
            target: document.body,
            type: 'childList'
        }]);
        
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Stop button appeared"));
    });

    it("detects Stop button disappearance (Generation Finished)", async () => {
        // 1. Simulate Appearance
        const btn = document.createElement("button");
        btn.setAttribute("aria-label", "Stop generating");
        document.body.appendChild(btn);
        
        // Trigger start
        observerCallback([{ target: document.body }]); 

        // 2. Simulate Disappearance
        btn.remove();
        
        const consoleSpy = vi.spyOn(console, "log");
        vi.useFakeTimers();

        // Trigger end
        observerCallback([{ target: document.body }]);

        // Fast forward finalization
        await vi.advanceTimersByTimeAsync(1500); 

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Generation finished"));
        vi.useRealTimers();
    });

    it.skip("extracts text and dispatches completed event", async () => {
        // Setup final content
        const assistantMsg = document.createElement("div");
        assistantMsg.setAttribute("data-message-author-role", "assistant");
        assistantMsg.textContent = "Final Response Text";
        document.body.appendChild(assistantMsg);

        // 1. Start (Stop btn exists)
        const stopBtn = document.createElement("button");
        stopBtn.setAttribute("aria-label", "Stop generating");
        document.body.appendChild(stopBtn);
        observerCallback([{ target: document.body }]);

        // 2. Finish (Stop btn removed)
        stopBtn.remove();
        
        // Spy on dispatchEvent
        const dispatchSpy = vi.spyOn(window, "dispatchEvent");

        vi.useFakeTimers();
        observerCallback([{ target: document.body }]);
        
        // Run all pending timers
        await vi.runAllTimersAsync();

        expect(dispatchSpy).toHaveBeenCalled();
        console.log("TEST: dispatchSpy calls", dispatchSpy.mock.calls.map(c => c[0].type));
        const event = dispatchSpy.mock.calls.find(call => call[0].type === "gpt-prompt-complete")[0];
        expect(event).toBeDefined();
        expect(event.detail.text).toBe("Final Response Text");
        
        vi.useRealTimers();
    });
});
