const ID = "checkgpt-co2-indicator";

function updateIndicator() {
    const input = document.querySelector("#prompt-textarea");
    if (!input) return;

    let indicator = document.getElementById(ID);

    if (!indicator) {
        indicator = document.createElement("div");
        indicator.id = ID;
        indicator.innerHTML = "ca. <strong>15g CO₂e</strong> <br> heute verbraucht";

        indicator.style.position = "absolute";
        indicator.style.left = "auto";
        indicator.style.right = "auto";
        indicator.style.top = "auto";
        indicator.style.bottom = "auto";

        indicator.style.display = "inline-block";
        indicator.style.whiteSpace = "pre-line";
        indicator.style.textAlign = "center";
        indicator.style.boxSizing = "border-box";

        indicator.style.fontFamily = "inherit";
        indicator.style.fontSize = "14px";
        indicator.style.fontWeight = "500";

        indicator.style.color = "#064E3B";
        indicator.style.background = "#BBF7D0";
        indicator.style.padding = "8px 14px";
        indicator.style.borderRadius = "999px";
        indicator.style.pointerEvents = "none";
        indicator.style.zIndex = "9999";
        indicator.style.lineHeight = "1.2";
        indicator.style.boxShadow = "0 1px 2px rgba(0,0,0,0.08)";
        document.body.appendChild(indicator);
    }

    const rect = input.getBoundingClientRect();
    const gap = 100;
    const indicatorWidth = indicator.offsetWidth;

    let left =
        rect.right + window.scrollX + gap;

    const maxLeft =
        window.scrollX + window.innerWidth - indicatorWidth - 8;

    if (left > maxLeft) {
        left = maxLeft;
    }

    indicator.style.left = `${left}px`;
    const verticalOffset = -8;

    indicator.style.top =
        `${rect.top + window.scrollY + rect.height / 2 - indicator.offsetHeight / 2 + verticalOffset}px`;

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
