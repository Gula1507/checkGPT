import { describe, it, expect, beforeEach, vi } from "vitest";
// @vitest-environment jsdom


// --- Chrome API mock ---
global.chrome = {
    storage: {
        local: {
            get: vi.fn()
        },
        onChanged: {
            addListener: vi.fn()
        }
    }
};

describe("popup.js", () => {
    beforeEach(() => {
        // DOM mocken
        document.body.innerHTML = `
            <input type="checkbox" class="switch" />
            <strong id="stat-prompts"></strong>
            <strong id="stat-energy"></strong>
            <strong id="stat-co2"></strong>
            <strong id="stat-smartphone"></strong>
            <strong id="stat-car"></strong>
            <strong id="stat-footprint"></strong>
        `;

        // Storage Mock-Daten
        chrome.storage.local.get.mockImplementation((key, cb) => {
            cb({
                tokenUsageHistory: [
                    { tokens: 100, imageCount: 0, timestamp: Date.now() },
                    { tokens: 200, imageCount: 1, timestamp: Date.now() }
                ]
            });
        });
    });

    it("renders prompt count and CO2 stats from storage", async () => {
        // popup.js importieren (führt updateStats automatisch aus)
        await import("../popup/popup.js");

        expect(document.getElementById("stat-prompts").textContent)
            .toBe("2");

        expect(document.getElementById("stat-energy").textContent)
            .toContain("Wattstunden");

        expect(document.getElementById("stat-co2").textContent)
            .toContain("Gramm CO2e");
    });
});
