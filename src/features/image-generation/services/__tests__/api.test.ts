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
      // API now returns { bytesBase64Encoded: ... }
      const mockResponse = { bytesBase64Encoded: "base64imageString" };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateImageService("test prompt");
      expect(result).toBe("base64imageString");
      
      // Verify correct endpoint was called
      expect(global.fetch).toHaveBeenCalledWith("/api/generate-image", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ prompt: "test prompt" })
      }));
    });

    it("should throw error when internal API fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal Server Error" }),
      });

      await expect(generateImageService("test prompt")).rejects.toThrow("Internal Server Error");
    });
  });

  describe("generateSmartCaptionService", () => {
    it("should return caption text on success", async () => {
      // API now returns { text: ... }
      const mockResponse = { text: "Generated Caption" };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const cards: CarouselCard[] = [{ title: "Test", prompt: "test" }];
      const result = await generateSmartCaptionService(cards);
      expect(result).toBe("Generated Caption");
      
      // Verify correct endpoint
      expect(global.fetch).toHaveBeenCalledWith("/api/generate-text", expect.anything());
    });

    it("should handle internal API failure gracefully", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500
        });
        
        const cards: CarouselCard[] = [{ title: "Test", prompt: "test" }];
        const result = await generateSmartCaptionService(cards);
        expect(result).toBe("Erro ao consultar a IA.");
    });
  });

  describe("getStylingTipsService", () => {
     it("should return tips text on success", async () => {
      const mockResponse = { text: "Tip 1" };
      
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
