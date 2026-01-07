const ID = "checkgpt-co2-indicator";

function updateIndicator() {
    const input = document.querySelector("#prompt-textarea");
    if (!input) return;

    let indicator = document.getElementById(ID);

    if (!indicator) {
        indicator = document.createElement("div");
        indicator.id = ID;
        indicator.textContent = "ca. 15g CO₂ heute verbraucht";

        indicator.style.position = "absolute";

        // ⬇️ WICHTIG: alle Insets neutralisieren
        indicator.style.left = "auto";
        indicator.style.right = "auto";
        indicator.style.top = "auto";
        indicator.style.bottom = "auto";

        indicator.style.display = "inline-block";
        indicator.style.width = "fit-content";
        indicator.style.maxWidth = "max-content";
        indicator.style.whiteSpace = "nowrap";
        indicator.style.boxSizing = "border-box";

        indicator.style.fontFamily = "inherit";
        indicator.style.fontSize = "11px";
        indicator.style.color = "#9ca3af";
        indicator.style.background = "rgba(0,0,0,0.45)";
        indicator.style.padding = "4px 8px";
        indicator.style.borderRadius = "999px";
        indicator.style.pointerEvents = "none";
        indicator.style.zIndex = "9999";

        document.body.appendChild(indicator);
    }

    const rect = input.getBoundingClientRect();

    // 👉 NUR EIN Bezugspunkt (links ODER rechts, nicht implizit)
    indicator.style.left =
        `${rect.right + window.scrollX + 8}px`;

    indicator.style.top =
        `${rect.top + window.scrollY + rect.height / 2 - indicator.offsetHeight / 2}px`;
}

// ⏱️ nach erstem Layout
requestAnimationFrame(() => {
    setTimeout(updateIndicator, 0);
});

window.addEventListener("scroll", updateIndicator);
window.addEventListener("resize", updateIndicator);

new MutationObserver(updateIndicator)
    .observe(document.body, { childList: true, subtree: true });
