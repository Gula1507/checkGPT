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
        vi.resetModules(); // IMPORTANT: Reload popup.js to bind to new DOM elements

        // DOM mocken (Updated to match new popup.html structure)
        document.body.innerHTML = `
            <div class="toggle-row">
                <label class="switch">
                    <input type="checkbox" checked /> <!-- Checked = Gesamt -->
                    <span class="slider"></span>
                </label>
            </div>

            <!-- Prompts -->
            <span id="stat-prompts"></span>

            <!-- Energy -->
            <span id="stat-energy"></span>

            <!-- CO2 -->
            <span id="stat-co2"></span>

            <!-- Comparisons -->
            <strong id="stat-smartphone"></strong>
            <strong id="stat-car"></strong>
            
            <div id="footprint-wrapper" class="chip comparison-item footprint">
                <strong id="stat-footprint"></strong>
            </div>
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

        // Wait for execution
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(document.getElementById("stat-prompts").textContent)
            .toBe("2");

        // New format: Just the number, e.g. "3,56"
        expect(document.getElementById("stat-energy").textContent)
            .toMatch(/^[0-9]+,[0-9]{2}$/); 

        // CO2
        expect(document.getElementById("stat-co2").textContent)
            .toMatch(/^[0-9]+,[0-9]{2}$/);
    });

    it("hides footprint when toggle is checked (Gesamt) and shows it when unchecked (Heute)", async () => {
        await import("../popup/popup.js");
        await new Promise(resolve => setTimeout(resolve, 0));

        const wrapper = document.getElementById("footprint-wrapper");
        const checkbox = document.querySelector('input[type="checkbox"]');

        // Initial State: Checked (Gesamt) -> Should be hidden
        expect(checkbox.checked).toBe(true);
        expect(wrapper.style.display).toBe('none');

        // Action: Uncheck (Heute)
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change'));

        // Wait for update
        await new Promise(resolve => setTimeout(resolve, 0));

        // Expectation: Visible (display: flex)
        expect(wrapper.style.display).toBe('flex');
    });
});
