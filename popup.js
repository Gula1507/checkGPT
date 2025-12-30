chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const status = document.getElementById("status");

    if (tabs?.[0]?.url?.includes("chatgpt.com")) {
        status.textContent = "✅ ChatGPT erkannt";
    } else {
        status.textContent = "❌ Nicht auf ChatGPT";
    }
});
