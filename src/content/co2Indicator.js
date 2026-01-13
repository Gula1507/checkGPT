const ID = "checkgpt-co2-indicator";
const WRAPPER_ID = "checkgpt-wrapper";

function updateIndicator() {
    try {
        const input = document.querySelector("#prompt-textarea");
        if (!input) return;

        const form = input.closest("form");
        if (!form || !form.isConnected) return;

        // Wrapper für promt-input und indicator erstellen oder abrufen
        let wrapper = document.getElementById(WRAPPER_ID);
        if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.id = WRAPPER_ID;
            wrapper.style.display = "flex";
            wrapper.style.alignItems = "center";
            wrapper.style.justifyContent = "center";
            wrapper.style.width = "100%";
            wrapper.style.gap = "15px";

            if (form.parentNode) {
                // Ensure form is still a child of its parent before inserting
                try {
                    form.parentNode.insertBefore(wrapper, form);
                    wrapper.appendChild(form);
                } catch (e) {
                    // Node might have been removed in the meantime
                    return;
                }
            }
        } else if (form.parentNode !== wrapper) {
            // Falls das Formular durch Re-Renderings rausgeflogen ist, wieder einfangen
            wrapper.appendChild(form);
        }

        // promt-input feld flexibel machen
        form.style.flex = "1";
        form.style.width = "auto";
        form.style.maxWidth = "unset";
        form.style.margin = "0";

        let indicator = document.getElementById(ID);

        if (!indicator) {
            indicator = document.createElement("div");
            indicator.id = ID;
            indicator.innerHTML = "ca. <strong>15g CO₂e</strong> <br> heute verbraucht";

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
            indicator.style.flexShrink = "0";

            wrapper.appendChild(indicator);
        } else {
            if (indicator.parentNode !== wrapper) {
                wrapper.appendChild(indicator);
            }
            // styles zurücksetzen, falls das Element schon existierte
            indicator.style.position = "static";
            indicator.style.transform = "none";
        }
    } catch (error) {
        // Silent fail - MutationObserver will retry
    }
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
