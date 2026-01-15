/**
 * Modul zur Energieberechnung
 * ====================================================
 *
 * Vereinfachte Berechnung: X Wh pro Token (Wattstunden)
 */

/**
 * Konstanten
 */
export const factors = {
    energyPerToken: 0.00173,
    emissionFactor_us: 0.370, // US-Emissionsfaktor (kgCO2eq/kWh)
    pue: 1.2 // Power Usage Effectiveness
};

// Konstante für Auto-Emissionen (ca. 120g/km -> 0.12g/m)
export const CO2_GRAMS_PER_METER_DRIVEN = 0.12;

/**
 * Berechnet den Energieverbrauch in kWh.
 * @param {number} outputTokens - Anzahl der Token
 * @returns {number} kWh
 */
export function calculateEnergy(outputTokens, imageCount = 0) {
    const WH_PER_IMAGE = 10; // 10 Wh per image

    const tokenEnergyWh = outputTokens * factors.energyPerToken;
    const imageEnergyWh = imageCount * WH_PER_IMAGE;

    const totalEnergyWh = tokenEnergyWh + imageEnergyWh;

    const minEnergyWh = 0.01;
    const normalizedEnergyWh = Math.max(totalEnergyWh, minEnergyWh);

    console.log(`CheckGPT: Energy calculated: ${normalizedEnergyWh.toFixed(4)} Wh (Tokens: ${outputTokens}, Images: ${imageCount})`);

    // Rückgabe in kWh
    return normalizedEnergyWh / 1000;
}

/**
 * Berechnet CO2-Emissionen in Gramm
 * @param {number} energyKWh 
 * @returns {number} Gramm CO2
 */
export function calculateCO2(energyKWh) {
    // emissionFactor_us ist g/kWh
    const co2 = energyKWh * factors.emissionFactor_us * factors.pue;

    console.log(`CheckGPT: CO2 emission calculated: ${co2.toFixed(4)} g`);

    return co2;
}

// auskommentiert, da noch nicht benötigt
/**
 * Berechnet die äquivalente Autofahrt-Distanz in Metern
 * @param {number} co2Grams - CO2 in Gramm
 * @returns {number} Distanz in Metern
 */
//export function calculateCarDistance(co2Grams) {
//    return co2Grams / CO2_GRAMS_PER_METER_DRIVEN;
//}