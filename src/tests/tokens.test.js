import { describe, it, expect, vi, beforeEach } from "vitest";

// @vitest-environment jsdom

// Mock Chrome API before importing the module
global.chrome = {
    storage: {
        local: {
            get: vi.fn(),
            set: vi.fn()
        }
    }
};

describe("tokens.js", () => {
    
    beforeEach(async () => {
        // Reset DOM
        document.body.innerHTML = "";
        
        // Reset Mocks
        vi.clearAllMocks();
        localStorage.clear();

        // Re-import to ensure fresh state if possible, or just use the side-effects
        // Since tokens.js executes IIFE/setup on import, we might need to rely on the event listener
        await import("../utils/tokens.js");
    });

    it("handles prompt complete event and calculates tokens", async () => {
        // Setup DOM for fallback extraction (though we pass text usually)
        // We will test the event driven approach
        
        const textToProcess = "Hello world";
        // 11 chars / 4 = 2.75 -> ceil -> 3 tokens
        
        const event = new CustomEvent("gpt-prompt-complete", {
            detail: {
                text: textToProcess,
                type: "TEXT",
                imageCount: 0
            }
        });

        // Spy on localStorage
        const setItemSpy = vi.spyOn(window.Storage.prototype, "setItem");

        // Dispatch event
        window.dispatchEvent(event);

        // Wait for async processing (if any) - tokens.js handleGenerationComplete is async
        // We might need a small delay or await verify via spies
        await new Promise(r => setTimeout(r, 50));

        // Check localStorage
        expect(setItemSpy).toHaveBeenCalledWith("tokenUsageHistory", expect.stringContaining('"tokens":3'));
        
        // Check Chrome Storage
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            tokenUsageHistory: expect.arrayContaining([
                expect.objectContaining({
                    tokens: 3,
                    imageCount: 0
                })
            ])
        });
    });

    it("counts images correctly independently from text", async () => {
        const textToProcess = ""; 
        const imageCount = 2;
        // Text tokens = 0 -> Fallback logic might trigger if 0, but let's see.
        // If text is empty and tokens 0, it uses fallback 20. 
        // But here we want to ensure image count is preserved.

        const event = new CustomEvent("gpt-prompt-complete", {
            detail: {
                text: textToProcess,
                type: "IMAGE",
                imageCount: imageCount
            }
        });

        window.dispatchEvent(event);
        await new Promise(r => setTimeout(r, 50));

        // Verify storage
        // Token count might be 20 (fallback) because text is empty & calc returns 0
        // Line 93: if (tokenCount === 0 && cleanText.length === 0 && imageCount === 0) -> Fallback
        // Here imageCount is 2, so fallback should NOT trigger if logic is correct?
        // Let's check logic:
        // if (cleanText.length > 0) -> textTokens calculated. Else 0.
        // tokenCount = textTokens (0).
        // if (0==0 && 0==0 && 2==0) -> False.
        // So tokenCount remains 0.
        
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            tokenUsageHistory: expect.arrayContaining([
                expect.objectContaining({
                    tokens: 0,
                    imageCount: 2
                })
            ])
        });
    });

    it("cleans text from UI elements when scraping DOM (fallback)", async () => {
        // This tests the internal logic when no text is provided.
        // We need to trigger it without providing text in detail?
        // The event listener passes event.detail.text.
        // If we send null, it scrapes.
        
        // Setup DOM
        const assistantMsg = document.createElement("div");
        assistantMsg.setAttribute("data-message-author-role", "assistant");
        assistantMsg.innerHTML = `
            <div>Actual Content</div>
            <button>Copy</button>
            <div class="text-xs">Disclaimer</div>
        `;
        document.body.appendChild(assistantMsg);

        const event = new CustomEvent("gpt-prompt-complete", {
            detail: {
                text: null, // Force DOM scraping
                type: "TEXT",
                imageCount: 0
            }
        });

        window.dispatchEvent(event);
        await new Promise(r => setTimeout(r, 50));

        // "Actual Content" -> 14 chars -> 14/4 = 3.5 -> 4 tokens
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            tokenUsageHistory: expect.arrayContaining([
                expect.objectContaining({
                    tokens: 4
                })
            ])
        });
    });
});
