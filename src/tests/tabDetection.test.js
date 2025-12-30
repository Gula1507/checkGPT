import { describe, it, expect } from "vitest";
import { isChatGPTTab } from "../utils/tabDetection.js";

describe("isChatGPTTab", () => {
    it("detects chatgpt.com", () => {
        expect(
            isChatGPTTab([{ url: "https://chatgpt.com/chat" }])
        ).toBe(true);
    });
});
