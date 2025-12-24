import { generateImageService, generateSmartCaptionService, getStylingTipsService } from "../api";
import { CarouselCard } from "../../types";

// Mock global fetch
global.fetch = jest.fn();

describe("API Services", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe("generateImageService", () => {
    it("should return base64 string on success", async () => {
      const mockResponse = {
        predictions: [{ bytesBase64Encoded: "base64imageString" }],
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateImageService("test prompt");
      expect(result).toBe("base64imageString");
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw error when API fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });

      await expect(generateImageService("test prompt")).rejects.toThrow("Falha na geração de imagem: 400 - Bad Request");
    });
  });

  describe("generateSmartCaptionService", () => {
    it("should return caption text on success", async () => {
      const mockResponse = {
        candidates: [{ content: { parts: [{ text: "Generated Caption" }] } }],
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const cards: CarouselCard[] = [{ title: "Test", prompt: "test" }];
      const result = await generateSmartCaptionService(cards);
      expect(result).toBe("Generated Caption");
    });

    it("should handle API failure gracefully", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
        });
        
        // The service mocks catch block returns a string instead of throwing
        // But in the code it says: console.error("Erro no Gemini Flash:", error); return "Erro ao consultar a IA."
        // Wait, if fetch fails (rejects), it catches. If simple !ok and we don't check, .json() might fail.
        
        // Let's force a fetch rejection
        (global.fetch as jest.Mock).mockRejectedValue(new Error("Network Error"));
        
        const cards: CarouselCard[] = [{ title: "Test", prompt: "test" }];
        const result = await generateSmartCaptionService(cards);
        expect(result).toBe("Erro ao consultar a IA.");
    });
  });

  describe("getStylingTipsService", () => {
     it("should return tips text on success", async () => {
      const mockResponse = {
        candidates: [{ content: { parts: [{ text: "Tip 1" }] } }],
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const card: CarouselCard = { title: "Test", prompt: "test" };
      const result = await getStylingTipsService(card);
      expect(result).toBe("Tip 1");
    });
  });
});
