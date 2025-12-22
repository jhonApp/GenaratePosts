"use client";

import React, { useState } from "react";

interface CaptionGeneratorProps {
  onGenerate: () => void;
  isLoading: boolean;
  caption: string;
}

export const CaptionGenerator: React.FC<CaptionGeneratorProps> = ({
  onGenerate,
  isLoading,
  caption,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 w-full max-w-xl bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-600" />
          <span className="font-bold text-sm">Legenda do Post</span>
        </div>
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className={`text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1 ${
            isLoading ? "opacity-50" : "hover:bg-purple-200"
          }`}
        >
          <span>✨ {isLoading ? "Escrevendo..." : "Criar com IA"}</span>
        </button>
      </div>
      <p
        className={`text-gray-700 text-sm leading-relaxed whitespace-pre-line transition-opacity duration-300 ${
          isLoading ? "opacity-50" : "opacity-100"
        }`}
      >
        {caption}
      </p>
      {caption && (
        <button
          onClick={handleCopy}
          className="mt-4 text-blue-600 text-sm font-semibold flex items-center gap-1 hover:underline"
        >
          {copied ? "Copiado!" : "Copiar legenda"}
        </button>
      )}
    </div>
  );
};
