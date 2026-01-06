
import React from "react";

interface StylistTipsProps {
  tips?: string;
}

export const StylistTips: React.FC<StylistTipsProps> = ({ tips }) => {
  if (!tips) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 mb-12 w-full animate-fade-in-up">
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-sm border border-orange-100 rounded-full p-2">
          💡
        </div>
        <div
          className="prose prose-sm prose-orange max-w-none text-gray-700 font-medium"
          dangerouslySetInnerHTML={{ __html: tips }}
        />
      </div>
    </div>
  );
};
