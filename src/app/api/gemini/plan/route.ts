import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const maxDuration = 30; // Set timeout to 30s

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set" },
        { status: 500 }
      );
    }

    const { topic } = await request.json();
    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Você é um especialista em Social Media e Design. Crie um plano de conteúdo para um Carrossel do Instagram sobre o tema: "${topic}".
      
      Gere 5 a 7 slides. O primeiro deve ser a capa e o último uma chamada para ação (CTA).
      
      Retorne APENAS um JSON válido (sem markdown, sem \`\`\`) com a seguinte estrutura de array:
      [
        {
          "title": "Titulo curto do slide",
          "subtitle": "Subtitulo ou texto principal do slide (max 20 palavras)",
          "prompt": "Um prompt detalhado em INGLÊS para gerar uma imagem fotorealista de alta qualidade sobre este slide. Estilo: Foto profissional, iluminação de estúdio.",
          "type": "cover" | "content" | "cta"
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Cleanup potential markdown fences if Gemini adds them
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        const slides = JSON.parse(text);
        return NextResponse.json(slides);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini:", text);
        return NextResponse.json(
            { error: "Failed to parse AI response" },
            { status: 500 }
        );
    }

  } catch (error: any) {
    console.error("Plan Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate plan" },
      { status: 500 }
    );
  }
}
