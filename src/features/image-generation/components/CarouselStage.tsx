
import React from "react";
import { CarouselCard } from "../types";

interface CarouselStageProps {
  cards: CarouselCard[];
  currentSlide: number;
  images: Record<number, string>;
  loadingImages: Record<number, boolean>;
  imageErrors: Record<number, boolean>;
  onNext: () => void;
  onPrev: () => void;
}

export const CarouselStage: React.FC<CarouselStageProps> = ({
  cards,
  currentSlide,
  images,
  loadingImages,
  imageErrors,
  onNext,
  onPrev,
}) => {
  return (
    <div className="lg:col-span-8 lg:col-start-3 w-full">
      <div className="relative aspect-[3/4] md:aspect-[4/3] lg:aspect-[3/4] w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden group">
        {/* Main Image Layer */}
        {cards.map((card, index) => {
          if (index !== currentSlide) return null;

          const imageUrl = images[index];
          const isLoading = loadingImages[index];
          const isError = imageErrors[index];

          return (
            <div key={index} className="absolute inset-0 w-full h-full animate-fade-in">
              {/* Image or Placeholder */}
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  {isLoading ? (
                    <span className="text-gray-500 animate-pulse">Criando visual...</span>
                  ) : isError ? (
                    <span className="text-red-400">Erro ao carregar</span>
                  ) : (
                    <span className="text-gray-400">Aguardando geração</span>
                  )}
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

              {/* Text Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10">
                <h3 className="font-serif text-3xl font-bold mb-2 leading-tight">
                  {card.title}
                </h3>
                <p className="text-gray-200 text-lg font-light leading-relaxed mb-4">
                  {card.subtitle || card.text}
                </p>
                {/* Pagination Dots */}
                <div className="flex gap-2 mt-4">
                  {cards.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentSlide ? "bg-yellow-500 w-8" : "bg-white/40 w-4"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Navigation Arrows */}
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white text-white hover:text-black backdrop-blur-md p-3 rounded-full shadow-lg transition-all z-20 group-hover:opacity-100 opacity-0 md:opacity-100"
        >
          <span className="sr-only">Anterior</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white text-white hover:text-black backdrop-blur-md p-3 rounded-full shadow-lg transition-all z-20 group-hover:opacity-100 opacity-0 md:opacity-100"
        >
          <span className="sr-only">Próximo</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};
