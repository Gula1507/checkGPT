import { isChatGPTTab } from "../utils/tabDetection.js";
import { calculateEnergy, calculateCO2, calculateCarDistance } from "../utils/calculator.js";

// Elemente holen
const toggleCheckbox = document.querySelector('.switch input');
const elPrompts = document.getElementById("stat-prompts");
const elEnergy = document.getElementById("stat-energy");
const elCar = document.getElementById("stat-car");
const status = document.getElementById("status");

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (status) {
        status.textContent = isChatGPTTab(tabs)
            ? "✅ ChatGPT erkannt"
            : "❌ Nicht auf ChatGPT";
    }
    updateStats();
});

// Listener für den Switch
if (toggleCheckbox) {
    toggleCheckbox.addEventListener('change', () => {
        updateStats();
    });
}

function updateStats() {
    chrome.storage.local.get("tokenUsageHistory", (data) => {
        const history = data.tokenUsageHistory || [];
        
        // Prüfen, ob "Heute" ausgewählt ist
        const showTodayOnly = toggleCheckbox ? !toggleCheckbox.checked : false; 
        // HINWEIS: Im HTML ist "input checked" meist die rechte Position. 
        // Prüfe bitte in deinem HTML/CSS: 
        // Wenn Switch RECHTS (checked) = "Immer"? Oder "Heute"?
        // Laut deinem Screenshot steht "Heute" links und "Immer" rechts.
        // Wenn der Regler rechts ist (checked), ist es meistens die zweite Option ("Immer").
        // Falls "Immer" ausgewählt ist, filtern wir NICHT.
        
        // Annahme basierend auf Screenshot: Switch Rechts (Checked) = Immer. Switch Links (Unchecked) = Heute.
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
        filteredHistory.forEach(entry => {
            if (typeof entry === 'number') totalTokens += entry;
            else if (entry.tokens) totalTokens += entry.tokens;
        });

        const promptCount = filteredHistory.length;
        const totalKWh = calculateEnergy(totalTokens);
        const totalWh = totalKWh * 1000;
        const totalCO2 = calculateCO2(totalKWh);
        const carMeters = calculateCarDistance(totalCO2);

        // Anzeigen
        if (elPrompts) elPrompts.textContent = promptCount;
        if (elEnergy) elEnergy.textContent = `${totalWh.toFixed(2).replace('.', ',')} Wattstunden`;
        if (elCar) elCar.textContent = `${carMeters.toFixed(1).replace('.', ',')} m`;
    });
}