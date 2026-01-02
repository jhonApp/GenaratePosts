export {}; // Needed for build if file is empty
import React from "react";
import Image from "next/image";
import { CarouselCard as CarouselCardType } from "../types";

interface CarouselCardProps {
  data: CarouselCardType;
  index: number;
  total: number;
  imageUrl?: string;
  loading: boolean;
  error?: boolean;
}

export const CarouselCard: React.FC<CarouselCardProps> = ({
  data,
  index,
  total,
  imageUrl,
  loading,
  error,
}) => {
  return (
    <div className="relative shrink-0 w-full aspect-[4/5] bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300 insta-card">
      {/* Background Image Area */}
      <div className={`absolute inset-0 bg-gray-200 flex items-center justify-center ${loading ? "animate-pulse" : ""}`}>
        {loading && (
          <span className="text-gray-400 text-xs text-center px-4">
            Aguardando geração de imagem...
          </span>
        )}
        {error && (
            <span className="text-red-400 text-xs text-center px-4">
            Erro ao carregar imagem.
            </span>
        )}
        {imageUrl && (
          <Image
            src={`${imageUrl}`}
            alt={data.title}
            fill
            className="object-cover animate-fade-in"
            unoptimized
          />
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />

      {/* Content */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end text-white z-10">
        <span className="text-xs uppercase tracking-widest mb-2 opacity-80">
          {index === 0 ? "Réveillon 2025" : `Tendência ${index}`}
        </span>
        <h2 className="font-serif text-3xl font-bold leading-tight mb-2">
          {data.title}
        </h2>
        <p className="text-sm opacity-90 mb-4">{data.subtitle || data.text}</p>
        <div className="h-1 w-12 bg-white/30 mb-4" />
        <p className="text-xs font-semibold mb-1 opacity-70">
          {data.details || ""}
        </p>
        <p className="text-[10px] italic opacity-80">{data.tip || data.cta}</p>
      </div>

      {/* Counter */}
      <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white">
        {index + 1}/{total}
      </div>
    </div>
  );
};
