"use client";

import React from "react";

interface StyleConsultantProps {
  onConsult: () => void;
  isLoading: boolean;
  response?: string;
}

export const StyleConsultant: React.FC<StyleConsultantProps> = ({
  onConsult,
  isLoading,
  response,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full"> 
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
        Consultoria (Gemini)
      </h3>
      <button
        onClick={onConsult}
        disabled={isLoading}
        className={`w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-opacity ${
          isLoading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
        }`}
      >
        <span>✨ {isLoading ? "Consultando..." : "Dicas para este Look"}</span>
      </button>
      
      {response && (
        <div className="mt-4 w-full bg-amber-50 p-4 rounded-xl border border-amber-100 animate-fade-in flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">✨</span>
            <h4 className="font-bold text-amber-900 text-sm">Dicas da Gemini Stylist</h4>
          </div>
          {/* Using dangerouslySetInnerHTML because we format the response with HTML tags in the parent or service */}
          <div 
            className="text-sm text-amber-900/80 ai-response space-y-2"
            dangerouslySetInnerHTML={{ __html: response }}
          />
        </div>
      )}
    </div>
  );
};
