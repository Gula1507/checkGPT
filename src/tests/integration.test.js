import { describe, it, expect, vi, beforeEach } from "vitest";
// @vitest-environment jsdom

describe("Integration: PromptDetector Contract -> Tokens", () => {
    beforeEach(async () => {
        document.body.innerHTML = "";
        localStorage.clear();
        vi.clearAllMocks();
        vi.resetModules();

        // 1. Mock Chrome API
        global.chrome = {
            storage: {
                local: {
                    get: vi.fn(),
                    set: vi.fn(),
                    onChanged: { addListener: vi.fn() }
                }
            }
        };

        // 2. Load Tokens Module (The Consumer)
        // We simulate the Provider (PromptDetector) by dispatching the event it would generate.
        await import("../utils/tokens.js?int=" + Date.now());
    });

    it("tokens.js correctly processes events emitted by promptDetector contract", async () => {
        // Define the contract payload (what PromptDetector generates)
        const payload = {
            text: "Integration Contract Test",
            type: "TEXT",
            imageCount: 0
        };

        // Simulate PromptDetector firing the event
        const event = new CustomEvent("gpt-prompt-complete", {
            detail: payload
        });
        
        window.dispatchEvent(event);

        // Wait for async processing
        await new Promise(r => setTimeout(r, 10));

        // Verify Tokens.js (Consumer) reacted correctly
        expect(chrome.storage.local.set).toHaveBeenCalled();
        
        const setCall = chrome.storage.local.set.mock.calls[0][0];
        const entry = setCall.tokenUsageHistory[0];
        
        expect(entry).toBeDefined();
        // 25 chars / 4 = 6.25 -> 7? "Integration Contract Test" = 25 chars
        // 25/4 = 6.25 -> ceil(6.25) = 7
        expect(entry.tokens).toBe(7);
        expect(entry.type).toBe("TEXT");
    });
});
