import { isChatGPTTab } from "../utils/tabDetection.js";

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const status = document.getElementById("status");
    if (!status) return;

    status.textContent = isChatGPTTab(tabs)
        ? "✅ ChatGPT erkannt"
        : "❌ Nicht auf ChatGPT";
});
