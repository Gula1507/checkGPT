function isChatGPTTab(tabs) {
    return tabs?.[0]?.url?.includes("chatgpt.com");
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const status = document.getElementById("status");
    if (!status) return;

    if (isChatGPTTab(tabs)) {
        status.textContent = "✅ ChatGPT erkannt";
    } else {
        status.textContent = "❌ Nicht auf ChatGPT";
    }
});
