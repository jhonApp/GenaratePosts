"use client";

import React, { useState } from "react";
import { useCarousel, initialCardData } from "../hooks/useCarousel";
import { Carousel } from "./Carousel";
import { ImageGenerator } from "./ImageGenerator";
import { StyleConsultant } from "./StyleConsultant";
import { CaptionGenerator } from "./CaptionGenerator";
import {
  generateImageService,
  generateSmartCaptionService,
  getStylingTipsService,
} from "../services/api";

export const FeatureContainer: React.FC = () => {
  const { currentSlide, nextSlide, prevSlide, goToSlide } = useCarousel(
    initialCardData.length
  );

  // States
  const [images, setImages] = useState<Record<number, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imgProgress, setImgProgress] = useState("");

  const [caption, setCaption] = useState(
    `O look da virada é sobre celebrar quem você quer ser no próximo ano! ✨\n\nPara 2025, as tendências trazem um mix de conforto, brilho e muita personalidade. Do linho fresquinho ao brilho dos metalizados, o importante é escolher algo que te deixe segura e radiante.`
  );
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  const [stylingTips, setStylingTips] = useState<string | undefined>(undefined);
  const [isConsulting, setIsConsulting] = useState(false);

  // Handlers
  const handleGenerateAllImages = async () => {
    setIsGeneratingImages(true);
    setImgProgress("Iniciando...");

    // Loop through all cards
    for (let i = 0; i < initialCardData.length; i++) {
      if (images[i]) continue; // Skip if already generated

      setImgProgress(`Gerando ${i + 1}/${initialCardData.length}...`);
      setLoadingImages((prev) => ({ ...prev, [i]: true }));
      setImageErrors((prev) => ({ ...prev, [i]: false }));

      try {
        const base64 = await generateImageService(initialCardData[i].prompt);
        setImages((prev) => ({ ...prev, [i]: base64 }));
      } catch (error) {
        console.error(`Erro ao gerar imagem ${i}`, error);
        setImageErrors((prev) => ({ ...prev, [i]: true }));
      } finally {
        setLoadingImages((prev) => ({ ...prev, [i]: false }));
      }
    }

    setImgProgress("✨ Visual gerado!");
    setIsGeneratingImages(false);
  };

  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const newCaption = await generateSmartCaptionService(initialCardData);
      setCaption(newCaption);
    } catch (error) {
      console.error(error);
      // Fallback or alert could go here
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleConsultStylist = async () => {
    setIsConsulting(true);
    setStylingTips(undefined);
    try {
      const currentCard = initialCardData[currentSlide];
      const rawText = await getStylingTipsService(currentCard);
      
      // Simple Markdown to HTML conversion
      let html = rawText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); // Bold
      html = html.replace(/^\* (.*)/gm, "<li>$1</li>"); // List items using *
      html = html.replace(/^- (.*)/gm, "<li>$1</li>"); // List items using -
      
      if (html.includes("<li>")) {
        html = `<ul>${html}</ul>`;
      } else {
        html = `<p>${html}</p>`;
      }

      setStylingTips(html);
    } catch (error) {
      console.error(error);
      setStylingTips("Erro ao obter dicas. Tente novamente.");
    } finally {
      setIsConsulting(false);
    }
  };

  // Effect to clear tips on slide change? 
  // Legacy code did: document.getElementById('stylistResponseArea').classList.add('hidden');
  // We can just clear `stylingTips` when currentSlide changes if we want.
  // But React state helps us here; we can keep it or clear it. 
  // I'll clear it to match legacy behavior.
  React.useEffect(() => {
    setStylingTips(undefined);
  }, [currentSlide]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4">
      {/* Header */}
      <header className="text-center mb-8 max-w-lg">
        <h1 className="font-serif text-3xl font-bold text-gray-800">
          Preview do Carrossel
        </h1>
        <p className="text-gray-500 mt-2">
          Visualize como suas tendências de Réveillon 2025 ficarão no feed.
        </p>
      </header>

      {/* Carousel */}
      <Carousel
        slides={initialCardData}
        images={images}
        loadingStates={loadingImages}
        errors={imageErrors}
        currentIndex={currentSlide}
        goToSlide={goToSlide}
        nextSlide={nextSlide}
        prevSlide={prevSlide}
      />

      {/* Tools Panel */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
        <ImageGenerator
          onGenerate={handleGenerateAllImages}
          isGenerating={isGeneratingImages}
          progressMessage={imgProgress}
        />
        <StyleConsultant
          onConsult={handleConsultStylist}
          isLoading={isConsulting}
          response={stylingTips}
        />
      </div>

      {/* Caption */}
      <CaptionGenerator
        onGenerate={handleGenerateCaption}
        isLoading={isGeneratingCaption}
        caption={caption}
      />
    </div>
  );
};
