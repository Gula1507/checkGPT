import { isChatGPTTab } from "../utils/tabDetection.js";
import { calculateEnergy, calculateCO2, calculateCarDistance } from "../utils/calculator.js";

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const status = document.getElementById("status");
    if (!status) return;

    status.textContent = isChatGPTTab(tabs)
        ? "✅ ChatGPT erkannt"
        : "❌ Nicht auf ChatGPT";

    updateStats();
});

function updateStats() {
    chrome.storage.local.get("tokenUsageHistory", (data) => {
        const history = data.tokenUsageHistory || [];

        const totalTokens = history.reduce((acc, val) => acc + val, 0);
        const promptCount = history.length;

        const totalKWh = calculateEnergy(totalTokens);
        // Display in Wh
        const totalWh = totalKWh * 1000;
        const totalCO2 = calculateCO2(totalKWh);
        const carMeters = calculateCarDistance(totalCO2);

        const elPrompts = document.getElementById("stat-prompts");
        const elEnergy = document.getElementById("stat-energy");
        const elCar = document.getElementById("stat-car");

        if (elPrompts) elPrompts.textContent = promptCount;
        if (elEnergy) elEnergy.textContent = `${totalWh.toFixed(2).replace('.', ',')} Wattstunden`;
        if (elCar) elCar.textContent = `${carMeters.toFixed(1).replace('.', ',')} m`;
    });
}
