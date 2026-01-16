import { isChatGPTTab } from "../utils/tabDetection.js";

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const statusContainer = document.getElementById("status-container");
    const status = document.getElementById("status");

    if (!statusContainer || !status) return;

    if (isChatGPTTab(tabs)) {
        statusContainer.style.display = "none";
    } else {
        statusContainer.style.display = "block";
        status.textContent = "❌ Nicht auf ChatGPT";
    }
});
