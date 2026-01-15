const ID = "checkgpt-co2-indicator";

function updateIndicator() {
    try {
        const input = document.querySelector("#prompt-textarea");
        if (!input) return;

        const form = input.closest("form");
        if (!form) return;

        let indicator = document.getElementById(ID);

        if (!indicator) {
            indicator = document.createElement("div");
            indicator.id = ID;
            indicator.innerHTML = "ca. <strong>15g CO₂e</strong><br>heute verbraucht";

            indicator.style.whiteSpace = "pre-line";
            indicator.style.textAlign = "center";
            indicator.style.fontFamily = "inherit";
            indicator.style.fontSize = "14px";
            indicator.style.fontWeight = "500";
            indicator.style.color = "#064E3B";
            indicator.style.background = "#BBF7D0";
            indicator.style.padding = "8px 14px";
            indicator.style.borderRadius = "999px";
            indicator.style.lineHeight = "1.2";
            indicator.style.boxShadow = "0 1px 2px rgba(0,0,0,0.08)";
            indicator.style.marginLeft = "12px";
            indicator.style.flexShrink = "0";

            // ➜ NUR daneben einfügen, nie verschieben
            form.after(indicator);
        }
    } catch (e) {
        console.warn("CheckGPT: Error updating indicator", e);
    }
}

function init() {
    requestAnimationFrame(updateIndicator);

    new MutationObserver(() => {
        requestAnimationFrame(updateIndicator);
    }).observe(document.body, {
        childList: true,
        subtree: true,
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
