import { NextResponse } from "next/server";

export const maxDuration = 60; // Set max execution time to 60s (Next.js limit)

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

    // Use 'gemini-pro' (stable v1.0)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const promptText = `
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

    // 1. Configure Timeout (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
        }),
        signal: controller.signal, // 2. Pass signal
        cache: "no-store",         // 3. Disable cache
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", response.status, errorText);
        throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("No text returned from Gemini API");
      }

      // Cleanup potential markdown fences
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      const slides = JSON.parse(text);
      return NextResponse.json(slides);

    } finally {
      clearTimeout(timeoutId); // Build good habits: always clear timeout
    }

  } catch (error: unknown) {
    console.error("Plan Generation Error:", error);
    
    // Handle Timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Request timed out after 30 seconds" },
        { status: 504 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to generate plan";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
