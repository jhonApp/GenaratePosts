"use client";

import React from "react";

interface ImageGeneratorProps {
  onGenerate: () => void;
  isGenerating: boolean;
  progressMessage?: string;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  onGenerate,
  isGenerating,
  progressMessage,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
        Imagens (Imagen 3)
      </h3>
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className={`w-full bg-black text-white py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
          isGenerating ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
        }`}
      >
        <span>🎨 {isGenerating ? "Gerando..." : "Gerar Imagens"}</span>
      </button>
      <div className="text-center text-xs text-gray-400 mt-2 min-h-[1rem]">
        {progressMessage}
      </div>
    </div>
  );
};
