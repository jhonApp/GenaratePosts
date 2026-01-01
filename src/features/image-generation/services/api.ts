import { CarouselCard } from "../types";

// Removed hardcoded GEMINI_API_KEY. All keys are now server-side.

/**
 * @deprecated Use createGenerationJobs instead for async queue.
 */
export const generateImageService = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro ao gerar imagem: ${response.status}`);
    }

    const result = await response.json();
    return result.bytesBase64Encoded;
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    throw error;
  }
};

interface CreateJobsResponse {
  jobIds: string[];
}

export const createGenerationJobs = async (prompts: string[]): Promise<string[]> => {
  try {
    const response = await fetch("/api/queue/create-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompts }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro ao criar jobs: ${response.status}`);
    }

    const data: CreateJobsResponse = await response.json();
    return data.jobIds;
  } catch (error) {
    console.error("Erro ao criar fila de jobs:", error);
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

  return callInternalTextApi(prompt);
};

export const getStylingTipsService = async (card: CarouselCard): Promise<string> => {
  const prompt = `Atue como uma Personal Stylist experiente. O usuário está vendo um card sobre a tendência: "${card.title}".
  Detalhes do card: "${card.subtitle || card.text} - ${card.details || ""}".

  Por favor, forneça 3 dicas práticas e curtas (máximo 1 frase cada) de como usar essa tendência específica na festa de Ano Novo.
  Seja direta e sofisticada. Use bullet points.`;

  return callInternalTextApi(prompt);
};

// Helper function to call internal text API
const callInternalTextApi = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch("/api/generate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      console.error("Erro na API de texto:", response.status);
      return "Erro ao consultar a IA.";
    }

    const data = await response.json();
    return data.text || "Não foi possível gerar a resposta.";
  } catch (error) {
    console.error("Erro ao chamar API interna:", error);
    return "Erro ao consultar a IA.";
  }
};

export const generateCarouselPlanService = async (topic: string): Promise<CarouselCard[]> => {
    try {
        const response = await fetch("/api/gemini/plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to generate plan");
        }

        return await response.json();
    } catch (error) {
        console.error("Error generating plan:", error);
        throw error;
    }
};
