import { describe, it, expect } from "vitest";
import {
    calculateEnergy,
    calculateCO2,
    calculateSmartphoneCharges,
    calculateCarKm,
    calculateFootprintPercentage,
    factors
} from "../utils/calculator.js";

describe("calculator.js", () => {
    describe("calculateEnergy", () => {
        it("calculates energy based on tokens (DeepSeek R1 Benchmark)", () => {
            const tokens = 1000;
            // 1000 tokens * (2.3762 J / 3600) = ~0.66 Wh
            const expectedKWh = (tokens * factors.energyPerToken) / 1000;
            expect(calculateEnergy(tokens)).toBeCloseTo(expectedKWh);
        });

        it("calculates energy for images (FLUX.1 Dev Benchmark)", () => {
            const tokens = 0;
            const images = 1;
            // 1 image * (8349 J / 3600) = ~2.319 Wh
            const expectedKWh = (1 * factors.energyPerImage) / 1000;
            expect(calculateEnergy(tokens, images)).toBeCloseTo(expectedKWh);
        });

        it("returns minimum energy floor (0.01 Wh) if calculation is too low", () => {
            const tokens = 1; 
            // 1 * ~0.00066 Wh is below 0.01 Wh floor
            // 0.01 Wh / 1000 = 0.00001 kWh
            expect(calculateEnergy(tokens)).toBe(0.00001);
        });
    });

    describe("calculateCO2", () => {
        it("converts energy (kWh) to CO2 grams using 2024 US factor", () => {
            const energyKWh = 1;
            // 1 kWh * 0.321 (US 2024 factor) * 1.2 (PUE) * 1000g
            const expectedGrams = 1 * factors.emissionFactor_us * factors.pue * 1000;
            expect(calculateCO2(energyKWh)).toBeCloseTo(expectedGrams);
        });
    });

    describe("calculateSmartphoneCharges", () => {
        it("calculates smartphone charges from CO2 grams", () => {
            const co2Grams = 1000; // 1 kg
            const expectedCharges = 1 * 80.8;
            expect(calculateSmartphoneCharges(co2Grams)).toBeCloseTo(expectedCharges);
        });
    });

    describe("calculateCarKm", () => {
        it("calculates car km from CO2 grams", () => {
            const co2Grams = 1000; // 1 kg
            const expectedKm = 1 * 4.02;
            expect(calculateCarKm(co2Grams)).toBeCloseTo(expectedKm);
        });
    });

    describe("calculateFootprintPercentage", () => {
        it("calculates percentage of daily sustainable budget", () => {
            const co2Grams = 2740; // 2.74 kg
            expect(calculateFootprintPercentage(co2Grams)).toBeCloseTo(100);
        });
    });
});