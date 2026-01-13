/**
 * Shared Energy Calculator Module
 * ====================================================
 *
 * Implements the EcoLogits methodology from:
 * https://ecologits.ai/0.2/methodology/llm_inference/
 */

/**
 * EcoLogits methodology constants for LLM energy estimation
 */
export const ECOLOGITS_CONSTANTS = {
    // Energy model coefficients
    ENERGY_ALPHA: 8.91e-5,    // Energy coefficient (Wh/token/B-params)
    ENERGY_BETA: 1.43e-3,     // Base energy per token (Wh/token)

    // Latency model coefficients
    LATENCY_ALPHA: 8.02e-4,   // Latency coefficient (s/token/B-params)
    LATENCY_BETA: 2.23e-2,    // Base latency per token (s/token)

    // Infrastructure parameters
    PUE: 1.2,                 // Power Usage Effectiveness for data centers
    GPU_MEMORY: 80,           // GPU memory in GB (NVIDIA A100)
    SERVER_POWER_WITHOUT_GPU: 1, // Server power excluding GPUs (kW)
    INSTALLED_GPUS: 8,        // Typical GPUs per server
    GPU_BITS: 4,              // Quantization level (4-bit)

    // Emissions
    GERMAN_EMISSION_FACTOR: 0.363 // deutscher durchschnitt lt. Ticket (kgCO2eq/kWh)
};

/**
 * GPT-5 model parameters
 */
export const GPT5_PARAMS = {
    TOTAL_PARAMS: 300e9,        // 300 billion total parameters
    ACTIVE_PARAMS: 60e9,        // 60 billion active parameters
    ACTIVE_PARAMS_BILLIONS: 60, // Active params in billions
    ACTIVATION_RATIO: 0.2,      // 20% activation ratio
    ACTIVE_PARAMS_MIN: 30e9,
    ACTIVE_PARAMS_MAX: 90e9
};

// Internal car emission constant
const CO2_GRAMS_PER_METER_DRIVEN = 0.12;

/**
 * Calculates energy calculation in kWh
 * Uses EcoLogits methodology.
 *
 * @param {number} outputTokens 
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

    // Step 1: Energy per token (per GPU) in Wh
    const energyPerToken = ENERGY_ALPHA * ACTIVE_PARAMS_BILLIONS + ENERGY_BETA;

    // Step 2: Number of GPUs
    const memoryRequired = 1.2 * TOTAL_PARAMS * GPU_BITS / 8;
    const numGPUs = Math.ceil(memoryRequired / (GPU_MEMORY * 1e9));

    // Step 3: Latency
    const latencyPerToken = LATENCY_ALPHA * ACTIVE_PARAMS_BILLIONS + LATENCY_BETA;
    const totalLatency = outputTokens * latencyPerToken; // seconds

    // Step 4: GPU Energy (Wh)
    const gpuEnergy = outputTokens * energyPerToken * numGPUs;

    // Step 5: Server Energy (Wh)
    // Power (kW) * time (s) -> kWs. / 3600 -> kWh. * 1000 -> Wh.
    const serverEnergyWithoutGPU = totalLatency * SERVER_POWER_WITHOUT_GPU * numGPUs / INSTALLED_GPUS / 3600 * 1000;

    // Step 6: Total Server Energy (Wh)
    const serverEnergy = serverEnergyWithoutGPU + gpuEnergy;

    // Step 7: PUE
    const totalEnergyWh = PUE * serverEnergy;

    // Ensure minimum energy
    const minEnergyWh = 0.01;
    const normalizedEnergyWh = Math.max(totalEnergyWh, minEnergyWh);

    // Return in kWh
    return normalizedEnergyWh / 1000;
}

/**
 * Calculates CO2 emissions in grams
 * @param {number} energyKWh 
 * @returns {number} grams CO2
 */
export function calculateCO2(energyKWh) {
    // GERMAN_EMISSION_FACTOR is kg/kWh
    // result kg -> * 1000 -> grams
    return energyKWh * ECOLOGITS_CONSTANTS.GERMAN_EMISSION_FACTOR * 1000;
}

/**
 * Calculates equivalent meters driven by car
 * @param {number} co2Grams
 * @returns {number} meters
 */
export function calculateCarDistance(co2Grams) {
    return co2Grams / CO2_GRAMS_PER_METER_DRIVEN;
}

/**
 * Helper to get energy per token (Wh/token)
 * (Actually, this is per-token-per-GPU + shared overhead... keeping it simple based on alpha/beta)
 */
export function getEnergyPerToken() {
    const { ENERGY_ALPHA, ENERGY_BETA } = ECOLOGITS_CONSTANTS;
    const { ACTIVE_PARAMS_BILLIONS } = GPT5_PARAMS;
    return ENERGY_ALPHA * ACTIVE_PARAMS_BILLIONS + ENERGY_BETA;
}
