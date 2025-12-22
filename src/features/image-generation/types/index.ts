export interface CarouselCard {
  title: string;
  subtitle?: string;
  cta?: string;
  type?: "cover" | "content";
  prompt: string;
  text?: string;
  details?: string;
  tip?: string;
}

export interface ImagenResponse {
  predictions: {
    bytesBase64Encoded: string;
    mimeType: string;
  }[];
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}
