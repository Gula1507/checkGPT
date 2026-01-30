import {
    calculateEnergy,
    calculateCO2,
    calculateSmartphoneCharges,
    calculateCarKm,
    calculateFootprintPercentage
} from "../utils/calculator.js";

// Elemente holen
const toggleCheckbox = document.querySelector('.switch input');
const elPrompts = document.getElementById("stat-prompts");
const elEnergy = document.getElementById("stat-energy");
const elCO2 = document.getElementById("stat-co2");

// Neue Vergleichs-Elemente
const elSmartphone = document.getElementById("stat-smartphone");
const elCar = document.getElementById("stat-car");
const elFootprint = document.getElementById("stat-footprint");

updateStats();

// Listener für den Switch
if (toggleCheckbox) {
    toggleCheckbox.addEventListener('change', () => {
        updateStats();
    });
}

// Listener für Speicher-Änderungen (Live-Updates)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.tokenUsageHistory) {
        console.log("CheckGPT: Storage changed, updating popup stats...");
        updateStats();
    }
});

function updateStats() {
    chrome.storage.local.get("tokenUsageHistory", (data) => {
        const history = data.tokenUsageHistory || [];

        // Prüfen, ob "Heute" ausgewählt ist
        const showTodayOnly = toggleCheckbox ? !toggleCheckbox.checked : false;
        const isAlways = toggleCheckbox && toggleCheckbox.checked;

        // Start von Heute (00:00 Uhr)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const filteredHistory = history.filter(entry => {
            // Abwärtskompatibilität: Falls alte Einträge nur Zahlen sind
            let entryVal = entry;
            let entryTime = 0;

            if (typeof entry === 'object' && entry !== null) {
                entryTime = entry.timestamp;
            }

            if (isAlways) {
                return true; // Alles zeigen
            } else {
                // Nur Heute zeigen
                return entryTime >= startOfDay;
            }
        });

        // Berechnen
        let totalTokens = 0;
        let totalImages = 0;

        filteredHistory.forEach(entry => {
            if (typeof entry === 'number') {
                totalTokens += entry;
            } else if (typeof entry === 'object') {
                totalTokens += (entry.tokens || 0);
                totalImages += (entry.imageCount || 0);
            }
        });

        const promptCount = filteredHistory.length;

        // 1. Energie & CO2 Basis berechnen
        const totalKWh = calculateEnergy(totalTokens, totalImages);
        const totalWh = totalKWh * 1000;
        const totalCO2Grams = calculateCO2(totalKWh);

        // 2. Vergleichswerte berechnen
        const smartphoneCount = calculateSmartphoneCharges(totalCO2Grams);
        const carKm = calculateCarKm(totalCO2Grams);
        const footprintPercent = calculateFootprintPercentage(totalCO2Grams);

        // --- Anzeigen ---

        // Prompts
        if (elPrompts) elPrompts.textContent = promptCount;

        // Energie (Formatierung: 1.234,56)
        if (elEnergy) elEnergy.textContent = `${totalWh.toFixed(2).replace('.', ',')} Wattstunden`;

        // CO2 anzeigen
        // CO₂
        if (elCO2) {
            elCO2.textContent = `${totalCO2Grams.toFixed(2).replace('.', ',')} Gramm CO2e`;
        }

        // Smartphones (z.B. "0,5" oder "12")
        if (elSmartphone) {
            elSmartphone.textContent = smartphoneCount < 10
                ? smartphoneCount.toFixed(1).replace('.', ',')
                : Math.round(smartphoneCount).toString();
        }

        // Auto (km oder m Logik)
        if (elCar) {
            if (carKm < 1) {
                // Unter 1 km zeigen wir Meter an
                const meters = carKm * 1000;
                elCar.textContent = `${meters.toFixed(0)} m`;
            } else {
                elCar.textContent = `${carKm.toFixed(2).replace('.', ',')} km`;
            }
        }

        // Fußabdruck (sehr kleine Werte < 0.001% als "< 0,001%" anzeigen)
        if (elFootprint) {
            if (footprintPercent > 0 && footprintPercent < 0.001) {
                 elFootprint.textContent = "< 0,001%";
            } else {
                 elFootprint.textContent = `${footprintPercent.toFixed(4).replace('.', ',')}%`;
            }
        }
    });
}