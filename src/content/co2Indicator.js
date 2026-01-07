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
        indicator.style.left = "auto";
        indicator.style.right = "auto";
        indicator.style.top = "auto";
        indicator.style.bottom = "auto";

        indicator.style.display = "inline-block";
        indicator.style.whiteSpace = "nowrap";
        indicator.style.boxSizing = "border-box";

        indicator.style.fontFamily = "inherit";
        indicator.style.fontSize = "10px";          // 👈 kleiner
        indicator.style.color = "#9ca3af";
        indicator.style.background = "rgba(0,0,0,0.45)";
        indicator.style.padding = "2px 6px";        // 👈 schmaler
        indicator.style.borderRadius = "999px";
        indicator.style.pointerEvents = "none";
        indicator.style.zIndex = "9999";

        document.body.appendChild(indicator);
    }

    const rect = input.getBoundingClientRect();
    const gap = 100; // 👈 deutlich weiter rechts
    const indicatorWidth = indicator.offsetWidth;

    let left =
        rect.right + window.scrollX + gap;

    const maxLeft =
        window.scrollX + window.innerWidth - indicatorWidth - 8;

    if (left > maxLeft) {
        left = maxLeft;
    }

    indicator.style.left = `${left}px`;
    indicator.style.top =
        `${rect.top + window.scrollY + rect.height / 2 - indicator.offsetHeight / 2}px`;
}

requestAnimationFrame(() => {
    setTimeout(updateIndicator, 0);
});

window.addEventListener("scroll", updateIndicator);
window.addEventListener("resize", updateIndicator);

new MutationObserver(updateIndicator).observe(document.body, {
    childList: true,
    subtree: true,
});
