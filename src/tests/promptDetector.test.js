import { describe, it, expect, vi, beforeEach } from "vitest";
// @vitest-environment jsdom

describe("promptDetector.js", () => {
    let observerCallback;

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


});
