/**
 * Modul zur Energieberechnung
 * ====================================================
 *
 * Vereinfachte Berechnung: 0.0332 Wh pro Token.
 */

/**
 * Konstanten
 */
export const ECOLOGITS_CONSTANTS = {
    // Emissionen
    GERMAN_EMISSION_FACTOR: 0.363 // Deutscher Emissionsfaktor lt. Ticket (kgCO2eq/kWh)
};

// Konstante für Auto-Emissionen (ca. 120g/km -> 0.12g/m)
export const CO2_GRAMS_PER_METER_DRIVEN = 0.12;

/**
 * Berechnet den Energieverbrauch in kWh.
 * @param {number} outputTokens - Anzahl der Token
 * @returns {number} kWh
 */
export function calculateEnergy(outputTokens) {

    // 0,00174 Wh pro Token
    const energyWh = outputTokens * 0.00174;

    const minEnergyWh = 0.01;
    const normalizedEnergyWh = Math.max(energyWh, minEnergyWh);

    console.log(`CheckGPT: Energieverbrauch der letzen promt berechnet. errechneter wert ${normalizedEnergyWh.toFixed(4)} wh`);

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
    const co2 = energyKWh * ECOLOGITS_CONSTANTS.GERMAN_EMISSION_FACTOR * 1000;
    console.log(`CheckGPT: co2 wert berechnet: ${co2.toFixed(4)}`);
    return co2;
}

/**
 * Berechnet die äquivalente Autofahrt-Distanz in Metern
 * @param {number} co2Grams - CO2 in Gramm
 * @returns {number} Distanz in Metern
 */
export function calculateCarDistance(co2Grams) {
    return co2Grams / CO2_GRAMS_PER_METER_DRIVEN;
}