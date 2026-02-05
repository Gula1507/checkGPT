/**
 * Energy & Emission Calculation Module
 * ------------------------------------
 * Estimates the environmental footprint of AI usage based on DeepSeek R1 and FLUX.1 Dev benchmarks.
 */

/**
 * Constants & Hardware Benchmarks
 */
const JOULES_PER_TOKEN = 2.3762; // Based on DeepSeek R1 (FP8) on 8x NVIDIA B200
const JOULES_PER_IMAGE = 8349;   // Based on FLUX.1 Dev on 8x NVIDIA B200

export const factors = {
    // Energy values converted from Joules to Watt-hours (1 Wh = 3600 J)
    energyPerToken: JOULES_PER_TOKEN / 3600, 
    energyPerImage: JOULES_PER_IMAGE / 3600,
    
    emissionFactor_us: 0.321, // US grid emission factor 2024: 321g CO2/kWh (0.321 kg/kWh)
    pue: 1.2                  // Power Usage Effectiveness (Data center overhead)
};

// Comparison benchmarks based on 1kg CO2e
const SMARTPHONES_PER_KG_CO2 = 80.8; 
const KM_PER_KG_CO2_CAR = 4.02; 
const DAILY_SUSTAINABLE_KG = 2.74; // Recommended daily sustainable CO2 budget

/**
 * Calculates total energy consumption in kWh.
 * @param {number} outputTokens 
 * @param {number} imageCount 
 * @returns {number} Energy in kWh
 */
export function calculateEnergy(outputTokens, imageCount = 0) {
    const tokenEnergyWh = outputTokens * factors.energyPerToken;
    const imageEnergyWh = imageCount * factors.energyPerImage;

    const totalEnergyWh = tokenEnergyWh + imageEnergyWh;

    // Ensure a minimum floor of 0.01 Wh for the calculation
    const minEnergyWh = 0.01;
    const normalizedEnergyWh = Math.max(totalEnergyWh, minEnergyWh);

    return normalizedEnergyWh / 1000;
}

/**
 * Converts energy consumption to CO2 emissions in grams.
 * @param {number} energyKWh 
 * @returns {number} CO2 in grams
 */
export function calculateCO2(energyKWh) {
    // Formula: kWh * emission factor (kg/kWh) * PUE * 1000 (to get grams)
    const co2Kg = energyKWh * factors.emissionFactor_us * factors.pue;
    return co2Kg * 1000;
}

/**
 * Translates CO2 impact into smartphone charging cycles.
 * @param {number} co2Grams 
 * @returns {number} Total charges
 */
export function calculateSmartphoneCharges(co2Grams) {
    const co2Kg = co2Grams / 1000;
    return co2Kg * SMARTPHONES_PER_KG_CO2;
}

/**
 * Translates CO2 impact into equivalent car travel distance.
 * @param {number} co2Grams 
 * @returns {number} Distance in kilometers
 */
export function calculateCarKm(co2Grams) {
    const co2Kg = co2Grams / 1000;
    return co2Kg * KM_PER_KG_CO2_CAR;
}

/**
 * Calculates the impact as a percentage of the daily sustainable CO2 budget.
 * @param {number} co2Grams 
 * @returns {number} Percentage (0-100)
 */
export function calculateFootprintPercentage(co2Grams) {
    const co2Kg = co2Grams / 1000;
    return (co2Kg / DAILY_SUSTAINABLE_KG) * 100;
}