const ID = "checkgpt-co2-indicator";
const WRAPPER_ID = "checkgpt-wrapper";

//animation für die zahlen im Indicator
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

        obj.innerHTML = Math.floor(ease * (end - start) + start);

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
}

function updateIndicator() {
    const input = document.querySelector("#prompt-textarea");
    if (!input) return;

    const form = input.closest("form");
    if (!form) return;

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
            form.parentNode.insertBefore(wrapper, form);
            wrapper.appendChild(form);
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

    // -----------------------
    // vorrübergehend!
    // hier wird die tokenanzahl von tokens.js abgerufen
    // das sollten wir wahrscheinlich refactoren, sobald tatsächliche CO2 Werte verfügbar sind
    // Das sollte nicht im indicator.js passieren, weil die CO2 werden auch im popup angezeigt werden
    // - Lennart
    let lastTokenCount = 0;
    try {
        const history = JSON.parse(localStorage.getItem('tokenUsageHistory') || "[]");
        if (Array.isArray(history) && history.length > 0) {
            lastTokenCount = history[history.length - 1] || 0;
        }
    } catch (e) {
        console.error("CheckGPT: Error reading token history", e);
    }

    // Wir nutzen dataset, um den aktuellen Stand zu speichern
    // und verhindern unnötiges Re-Rendern (z.B. beim Scrollen)

    let indicator = document.getElementById(ID);

    if (!indicator) {
        indicator = document.createElement("div");
        indicator.id = ID;
        // Speichere den initialen Wert
        indicator.dataset.currentCount = lastTokenCount;

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

        // Initial HTML structure with a span for the number
        indicator.innerHTML = `Last Prompt: <br> <strong><span id="checkgpt-count-anim">${lastTokenCount}</span> Tokens</strong>`;

        wrapper.appendChild(indicator);
    } else {
        if (indicator.parentNode !== wrapper) {
            wrapper.appendChild(indicator);
        }
        // styles zurücksetzen, falls das Element schon existierte
        indicator.style.position = "static";
        indicator.style.transform = "none";

        // Animation Logic
        const currentDisplayed = parseInt(indicator.dataset.currentCount || "0");

        if (currentDisplayed !== lastTokenCount) {
            // Wert hat sich geändert -> Animation triggern!
            const countElement = indicator.querySelector("#checkgpt-count-anim");
            if (countElement) {
                animateValue(countElement, currentDisplayed, lastTokenCount, 1000); // 1s Animation
            } else {
                // Fallback falls Struktur kaputt oder alt
                indicator.innerHTML = `Last Prompt: <br> <strong><span id="checkgpt-count-anim">${lastTokenCount}</span> Tokens</strong>`;
            }

            // Update dataset
            indicator.dataset.currentCount = lastTokenCount;
        }
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

window.addEventListener("checkgpt-tokens-updated", (event) => {
    // Force immediate update when tokens change
    updateIndicator();
});
