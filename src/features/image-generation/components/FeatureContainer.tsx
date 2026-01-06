"use client";

import React from "react";
import { useCarouselOrchestrator } from "../hooks/useCarouselOrchestrator";
import { InstagramPreviewCard } from "./InstagramPreviewCard";
import { ControlDeck } from "./ControlDeck";
import { StylistTips } from "./StylistTips";

export const FeatureContainer: React.FC = () => {
  const {
    cards,
    topic,
    setTopic,
    isGeneratingPlan,
    stylingTips,
    caption,
    isConsulting,
    carousel,
    queue,
    handleGeneratePlan,
    handleGenerateAllImages,
    handleConsultStylist
  } = useCarouselOrchestrator();

  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      {/* Main Content Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Carousel Area (Centerpiece) */}
        <InstagramPreviewCard 
            cards={cards}
            currentSlide={carousel.currentSlide}
            images={queue.images}
            loadingImages={queue.loadingImages}
            imageErrors={queue.imageErrors}
            onNext={carousel.nextSlide}
            onPrev={carousel.prevSlide}
            caption={caption}
        />
      </div>

      {/* Action Deck */}
      <ControlDeck 
          topic={topic}
          setTopic={setTopic}
          isGeneratingPlan={isGeneratingPlan}
          onGeneratePlan={handleGeneratePlan}
          isGeneratingImages={queue.isGeneratingImages}
          isPolling={queue.isPolling}
          imgProgress={queue.imgProgress}
          onGenerateImages={handleGenerateAllImages}
          isConsulting={isConsulting}
          onConsult={handleConsultStylist}
      />

      {/* Tips Section */}
      <StylistTips tips={stylingTips} />
    </div>
  );
};
