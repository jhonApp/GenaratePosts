
import React from "react";
import { CarouselCard } from "../types";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface InstagramPreviewCardProps {
  cards: CarouselCard[];
  currentSlide: number;
  images: Record<number, string>;
  loadingImages: Record<number, boolean>;
  imageErrors: Record<number, boolean>;
  onNext: () => void;
  onPrev: () => void;
  caption?: string; 
  userProfile?: {
    name: string;
    avatar?: string;
  };
}

export const InstagramPreviewCard: React.FC<InstagramPreviewCardProps> = ({
  cards,
  currentSlide,
  images,
  loadingImages,
  imageErrors,
  onNext,
  onPrev,
  caption,
  userProfile = { name: "midianita.ai" },
}) => {
  return (
    <div className="lg:col-span-8 lg:col-start-3 w-full flex justify-center">
      <div className="w-full max-w-[470px] bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
              <div className="w-full h-full bg-white rounded-full p-[2px] overflow-hidden">
                 {/* Avatar Placeholder */}
                 <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                    AI
                 </div>
              </div>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {userProfile.name}
            </span>
          </div>
          <button className="text-gray-900 hover:text-gray-600">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Image Stage (Carousel) */}
        <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden group">
            {cards.map((card, index) => {
              if (index !== currentSlide) return null;

              const imageUrl = images[index];
              const isLoading = loadingImages[index];
              const isError = imageErrors[index];

              return (
                <div key={index} className="absolute inset-0 w-full h-full animate-fade-in">
                  {/* Image */}
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
                        <span className="text-gray-500 text-sm animate-pulse">Criando visual...</span>
                      ) : isError ? (
                        <span className="text-red-400 text-sm">Erro ao carregar</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Aguardando geração</span>
                      )}
                    </div>
                  )}

                  {/* Text Overlay (simulating text on image) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10 text-center">
                    <h3 className="font-serif text-2xl font-bold mb-2 leading-tight drop-shadow-md">
                      {card.title}
                    </h3>
                  </div>
                </div>
              );
            })}

            {/* Navigation Arrows (Only visible on hover/desktop usually, but useful here) */}
             <button
               onClick={onPrev}
               className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
               disabled={currentSlide === 0}
            >
               <ChevronLeft size={20} />
            </button>
             <button
               onClick={onNext}
               className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
               disabled={currentSlide === cards.length - 1}
            >
               <ChevronRight size={20} />
            </button>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center px-4 py-3">
            <div className="flex gap-4">
                <button className="text-gray-900 hover:text-gray-600 hover:scale-110 transition-transform">
                    <Heart size={24} strokeWidth={1.8} />
                </button>
                <button className="text-gray-900 hover:text-gray-600 hover:scale-110 transition-transform">
                    <MessageCircle size={24} strokeWidth={1.8} className="-rotate-90" />
                </button>
                <button className="text-gray-900 hover:text-gray-600 hover:scale-110 transition-transform">
                    <Send size={24} strokeWidth={1.8} />
                </button>
            </div>
            <button className="text-gray-900 hover:text-gray-600">
                <Bookmark size={24} strokeWidth={1.8} />
            </button>
        </div>

        {/* Caption Area */}
        <div className="px-4 pb-6 space-y-2">
            
            {/* Likes */}
            <p className="text-sm font-semibold text-gray-900">
                Curtido por <span className="text-gray-900">milhares de pessoas</span>
            </p>

            {/* Pagination Dots (Moved here per spec "below image" but native style is often often overlay or here) */}
            {/* The spec said "Paginação: logo abaixo dela [Imagem]". 
                Let's put dots in the action bar area or just above caption? 
                Actually, usually dots are on the image, but the prompt asked for separate dots. 
                Let's place them just above Actions or integrated. 
                Actually, standard is dots on image for Carousel, OR dots below for older styles. 
                Let's put dots centered between actions and image if possible, or just ignore specific dot placement and assume overlay is fine? 
                User Spec: "Paginação style native".
                Let's render standard blue dots below image.
            */}
             {cards.length > 1 && (
                <div className="flex justify-center h-2 mb-2">
                    {cards.map((_, idx) => (
                        <div
                        key={idx}
                        className={`h-1.5 w-1.5 rounded-full mx-[2px] transition-all ${
                            idx === currentSlide ? "bg-blue-500 scale-125" : "bg-gray-300"
                        }`}
                        />
                    ))}
                </div>
            )}


            {/* Caption */}
            <div className="text-sm text-gray-900 leading-relaxed">
                <span className="font-semibold mr-2">{userProfile.name}</span>
                {caption ? (
                    <span className="whitespace-pre-wrap">{caption}</span>
                ) : (
                    <span className="text-gray-400 italic">
                        Sua legenda gerada pela IA aparecerá aqui em breve...
                    </span>
                )}
            </div>

            {/* Timestamp */}
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-2">
                Há 2 horas
            </p>

        </div>
      </div>
    </div>
  );
};
