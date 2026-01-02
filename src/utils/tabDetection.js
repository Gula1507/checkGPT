export function isChatGPTTab(tabs) {
    return tabs?.[0]?.url?.includes("chatgpt.com");
}
