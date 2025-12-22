import { CarouselCard, GeminiResponse, ImagenResponse } from "../types";

// START CONFIGURATION
// IMPORTANTE: Use a nova chave que você vai gerar, não a que vazou.
export const GEMINI_API_KEY = "AIzaSyCqO59eyy2Il-E74wY4teb4UpHIjG9UcmI"; 
// END CONFIGURATION

export const generateImageService = async (prompt: string): Promise<string> => {
  try {
    // CORREÇÃO: O nome correto do modelo na v1beta geralmente é 'imagen-3.0-generate-001'
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Imagen API Error (${response.status}):`, errorText);
      throw new Error(`Falha na geração de imagem: ${response.status} - ${errorText}`);
    }

    const result: ImagenResponse = await response.json();
    if (result.predictions && result.predictions.length > 0) {
      return result.predictions[0].bytesBase64Encoded;
    }
    throw new Error("Nenhuma imagem retornada");
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    throw error;
  }
};

export const generateSmartCaptionService = async (cards: CarouselCard[]): Promise<string> => {
  const trendList = cards.map((c) => `${c.title}: ${c.subtitle || c.text}`).join(", ");
  const prompt = `Você é um social media manager fashionista. Escreva uma legenda para um post de carrossel no Instagram sobre tendências de Ano Novo 2025. 
            
  O carrossel contém estes slides: ${trendList}.
  
  Diretrizes:
  - Use um tom animado, elegante e engajador (Brasil).
  - Use emojis relevantes (✨, 🥂, 👗).
  - Inclua uma Call to Action (CTA) no final.
  - Formate com quebras de linha para ficar fácil de ler.
  - Não use hashtags no meio do texto, coloque um bloco de 5 hashtags relevantes no final.`;

  return callGeminiFlash(prompt);
};

export const getStylingTipsService = async (card: CarouselCard): Promise<string> => {
  const prompt = `Atue como uma Personal Stylist experiente. O usuário está vendo um card sobre a tendência: "${card.title}".
  Detalhes do card: "${card.subtitle || card.text} - ${card.details || ""}".

  Por favor, forneça 3 dicas práticas e curtas (máximo 1 frase cada) de como usar essa tendência específica na festa de Ano Novo.
  Seja direta e sofisticada. Use bullet points.`;

  return callGeminiFlash(prompt);
};

// Helper function to call Gemini Flash
const callGeminiFlash = async (promptText: string): Promise<string> => {
  try {
    // CORREÇÃO: 'gemini-2.5' não existe. Use 'gemini-1.5-flash' (estável) ou 'gemini-2.0-flash-exp' (experimental).
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
      }
    );

    const data: GeminiResponse = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }
    return "Não foi possível gerar a resposta.";
  } catch (error) {
    console.error("Erro no Gemini Flash:", error);
    return "Erro ao consultar a IA.";
  }
};