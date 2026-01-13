/**
 * Modul zur Energieberechnung
 * ====================================================
 *
 * Setzt die EcoLogits-Methodik um – voll wissenschaftlich und so:
 * https://ecologits.ai/0.2/methodology/llm_inference/
 */

/**
 * Konstanten für die EcoLogits-Methodik (damit wir wissen, was der LLM verbrät)
 */
export const ECOLOGITS_CONSTANTS = {
    // Energie-Koeffizienten
    ENERGY_ALPHA: 8.91e-5,    // Energie-Koeffizient (Wh/Token/Mrd-Parameter)
    ENERGY_BETA: 1.43e-3,     // Basis-Energie pro Token (Wh/Token)

    // Latenz-Koeffizienten
    LATENCY_ALPHA: 8.02e-4,   // Latenz-Koeffizient (s/Token/Mrd-Parameter)
    LATENCY_BETA: 2.23e-2,    // Basis-Latenz pro Token (s/Token)

    // Infrastruktur-Kram
    PUE: 1.2,                 // PUE (Wie effizient das Rechenzentrum ist)
    GPU_MEMORY: 80,           // GPU-Speicher in GB (fette A100)
    SERVER_POWER_WITHOUT_GPU: 1, // Server-Stromverbrauch ohne GPUs (in kW)
    INSTALLED_GPUS: 8,        // Typische Anzahl GPUs pro Server
    GPU_BITS: 4,              // Quantisierungs-Level (4-bit, also eher sparsam)

    // Emissionen
    GERMAN_EMISSION_FACTOR: 0.363 // Deutscher Emissionsfaktor lt. Ticket (kgCO2eq/kWh)
};

/**
 * Parameter für GPT-5 (oder was auch immer gerade aktuell ist)
 */
export const GPT5_PARAMS = {
    TOTAL_PARAMS: 300e9,        // 300 Milliarden Parameter insgesamt
    ACTIVE_PARAMS: 60e9,        // 60 Milliarden aktive Parameter
    ACTIVE_PARAMS_BILLIONS: 60, // Aktive Parameter in Milliarden (für die Formel)
    ACTIVATION_RATIO: 0.2,      // 20% Aktivierungsrate
    ACTIVE_PARAMS_MIN: 30e9,
    ACTIVE_PARAMS_MAX: 90e9
};

// Konstante für Auto-Emissionen (ca. 120g/km -> 0.12g/m)
const CO2_GRAMS_PER_METER_DRIVEN = 0.12;

/**
 * Berechnet den Energieverbrauch in kWh.
 * Nutzt die EcoLogits-Logik.
 *
 * @param {number} outputTokens - Anzahl der Token
 * @returns {number} kWh
 */
export function calculateEnergy(outputTokens) {
    const {
        ENERGY_ALPHA,
        ENERGY_BETA,
        LATENCY_ALPHA,
        LATENCY_BETA,
        PUE,
        GPU_MEMORY,
        SERVER_POWER_WITHOUT_GPU,
        INSTALLED_GPUS,
        GPU_BITS
    } = ECOLOGITS_CONSTANTS;

    const { TOTAL_PARAMS, ACTIVE_PARAMS_BILLIONS } = GPT5_PARAMS;

    // Schritt 1: Energie pro Token (pro GPU) in Wh
    const energyPerToken = ENERGY_ALPHA * ACTIVE_PARAMS_BILLIONS + ENERGY_BETA;
    console.log(`Step 1 - Energy per Token (Wh): ${energyPerToken}`);

    // Schritt 2: Anzahl der benötigten GPUs
    const memoryRequired = 1.2 * TOTAL_PARAMS * GPU_BITS / 8;
    const numGPUs = Math.ceil(memoryRequired / (GPU_MEMORY * 1e9));
    console.log(`Step 2 - Memory Required: ${memoryRequired}, Num GPUs: ${numGPUs}`);

    // Schritt 3: Latenz berechnen
    const latencyPerToken = LATENCY_ALPHA * ACTIVE_PARAMS_BILLIONS + LATENCY_BETA;
    const totalLatency = outputTokens * latencyPerToken; // in Sekunden
    console.log(`Step 3 - Latency per Token: ${latencyPerToken}, Total Latency (s): ${totalLatency}`);

    // Schritt 4: GPU-Energie (Wh)
    const gpuEnergy = outputTokens * energyPerToken * numGPUs;
    console.log(`Step 4 - GPU Energy (Wh): ${gpuEnergy}`);

    // Schritt 5: Server-Energie (ohne GPU)
    // Leistung (kW) * Zeit (s) -> kWs. / 3600 -> kWh. * 1000 -> Wh.
    const serverEnergyWithoutGPU = totalLatency * SERVER_POWER_WITHOUT_GPU * numGPUs / INSTALLED_GPUS / 3600 * 1000;
    console.log(`Step 5 - Server Energy w/o GPU (Wh): ${serverEnergyWithoutGPU}`);

    // Schritt 6: Gesamte Server-Energie (Wh)
    const serverEnergy = serverEnergyWithoutGPU + gpuEnergy;

    // Schritt 7: PUE draufrechnen
    const totalEnergyWh = PUE * serverEnergy;

    // Mindestwert sicherstellen (damit nicht 0 steht)
    const minEnergyWh = 0.01;
    const normalizedEnergyWh = Math.max(totalEnergyWh, minEnergyWh);

    // Rückgabe in kWh
    return normalizedEnergyWh / 1000;
}

/**
 * Berechnet CO2-Emissionen in Gramm
 * @param {number} energyKWh 
 * @returns {number} Gramm CO2
 */
export function calculateCO2(energyKWh) {
    // GERMAN_EMISSION_FACTOR ist kg/kWh
    // Ergebnis kg -> * 1000 -> Gramm
    return energyKWh * ECOLOGITS_CONSTANTS.GERMAN_EMISSION_FACTOR * 1000;
}


/**
 * Hilfsfunktion für Energie pro Token (Wh/Token)
 * (Eigentlich pro-Token-pro-GPU + Overhead... wir halten's simpel mit Alpha/Beta)
 */
export function getEnergyPerToken() {
    const { ENERGY_ALPHA, ENERGY_BETA } = ECOLOGITS_CONSTANTS;
    const { ACTIVE_PARAMS_BILLIONS } = GPT5_PARAMS;
    return ENERGY_ALPHA * ACTIVE_PARAMS_BILLIONS + ENERGY_BETA;
}
