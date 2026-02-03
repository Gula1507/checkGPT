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
        it("calculates energy based on tokens", () => {
            const tokens = 1000;
            // 1000 * 0.00173 = 1.73 Wh
            // 1.73 / 1000 = 0.00173 kWh
            const expectedKWh = (1000 * factors.energyPerToken) / 1000;
            expect(calculateEnergy(tokens)).toBeCloseTo(expectedKWh);
        });

        it("includes image energy calculation", () => {
            const tokens = 0;
            const images = 1;
            // 1 * 10 Wh = 10 Wh
            // 10 / 1000 = 0.01 kWh
            expect(calculateEnergy(tokens, images)).toBe(0.01);
        });

        it("returns minimum energy if calculation is too low", () => {
            const tokens = 1; 
            // 1 * 0.00173 = 0.00173 Wh -> min 0.01 Wh
            // 0.01 / 1000 = 0.00001 kWh
            expect(calculateEnergy(tokens)).toBe(0.00001);
        });
    });

    describe("calculateCO2", () => {
        it("converts energy (kWh) to CO2 (grams)", () => {
            const energyKWh = 1;
            // 1 * 0.370 (US factor) * 1.2 (PUE) * 1000 (g)
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
            // Should be 100%
            expect(calculateFootprintPercentage(co2Grams)).toBeCloseTo(100);
        });
    });
});
