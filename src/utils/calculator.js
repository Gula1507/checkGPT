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
    emissionFactor_us: 0.370, // US-Emissionsfaktor (gCO2eq/kWh)
    pue: 1.2 // Power Usage Effectiveness
};

// Neue Vergleichsfaktoren gemäß Akzeptanzkriterien
// Basis: 1 kg CO2e
const SMARTPHONES_PER_KG_CO2 = 80.8; 
const KM_PER_KG_CO2_CAR = 4.02; 
const DAILY_SUSTAINABLE_KG = 2.74; // Verträgliches Tagesbudget in kg

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
    // emissionFactor_us ist kg/kWh, daher * 1000 für Gramm
    const co2Kg = energyKWh * factors.emissionFactor_us * factors.pue;
    const co2Grams = co2Kg * 1000;

    console.log(`CheckGPT: CO2 emission calculated: ${co2Grams.toFixed(4)} g`);

    return co2Grams;
}

/**
 * Berechnet, wie viele Smartphones man mit diesem CO2-Ausstoß laden könnte.
 * @param {number} co2Grams - CO2 in Gramm
 * @returns {number} Anzahl Smartphones
 */
export function calculateSmartphoneCharges(co2Grams) {
    const co2Kg = co2Grams / 1000;
    return co2Kg * SMARTPHONES_PER_KG_CO2;
}

/**
 * Berechnet die äquivalente Autofahrt-Distanz in Kilometern.
 * @param {number} co2Grams - CO2 in Gramm
 * @returns {number} Distanz in Kilometern
 */
export function calculateCarKm(co2Grams) {
    const co2Kg = co2Grams / 1000;
    return co2Kg * KM_PER_KG_CO2_CAR;
}

/**
 * Berechnet den Anteil am verträglichen Tagesbudget (2.74 kg).
 * @param {number} co2Grams - CO2 in Gramm
 * @returns {number} Prozentanteil (0-100)
 */
export function calculateFootprintPercentage(co2Grams) {
    const co2Kg = co2Grams / 1000;
    return (co2Kg / DAILY_SUSTAINABLE_KG) * 100;
}