/**
 * Calculator module for Energy and CO2 estimations.
 *
 * Defaults based on average estimates for LLM inference.
 * TODO: Refine these constants with more precise data.
 */

// Energy consumption per token in kWh (Estimate)
// Research varies, but let's take a safe upper bound estimate for now or a median.
// 1 Wh per query is common? If a query is 1000 tokens.
// 1 Wh = 0.001 kWh.
// 0.001 / 1000 = 0.000001 kWh / token.
export const KWH_PER_TOKEN = 0.00001;

// CO2 emissions in grams per kWh (Global Average roughly 475g, or varying by region)
export const CO2_GRAMS_PER_KWH = 475;

// Car emission equivalent
// aprox 120g CO2 / km => 0.12 g / m
export const CO2_GRAMS_PER_METER_DRIVEN = 0.12;

/**
 * Calculates energy calculation in kWh
 * @param {number} tokenCount 
 * @returns {number} kWh
 */
export function calculateEnergy(tokenCount) {
    return tokenCount * KWH_PER_TOKEN;
}

/**
 * Calculates CO2 emissions in grams
 * @param {number} energyKWh 
 * @returns {number} grams CO2
 */
export function calculateCO2(energyKWh) {
    return energyKWh * CO2_GRAMS_PER_KWH;
}

/**
 * Calculates equivalent meters driven by car
 * @param {number} co2Grams 
 * @returns {number} meters
 */
export function calculateCarDistance(co2Grams) {
    return co2Grams / CO2_GRAMS_PER_METER_DRIVEN;
}
