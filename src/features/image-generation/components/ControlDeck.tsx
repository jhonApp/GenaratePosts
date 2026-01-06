
import React from "react";

interface ControlDeckProps {
  topic: string;
  setTopic: (val: string) => void;
  isGeneratingPlan: boolean;
  onGeneratePlan: () => void;
  
  isGeneratingImages: boolean;
  isPolling: boolean;
  imgProgress: string;
  onGenerateImages: () => void;

  isConsulting: boolean;
  onConsult: () => void;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  topic,
  setTopic,
  isGeneratingPlan,
  onGeneratePlan,
  isGeneratingImages,
  isPolling,
  imgProgress,
  onGenerateImages,
  isConsulting,
  onConsult,
}) => {
  return (
    <div className="w-full max-w-4xl mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 px-4 pb-20">
      {/* Card 1: Generate New Topic */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Novo Tema (Gemini)
          </span>
          <h3 className="font-serif text-xl font-bold text-gray-900 mt-1">
            Crie seu Conteúdo
          </h3>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Ex: Dicas de Maquiagem para o Natal..."
            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-700"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGeneratingPlan}
          />
          <button
            onClick={onGeneratePlan}
            disabled={isGeneratingPlan || !topic.trim()}
            className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGeneratingPlan ? (
              <span className="animate-pulse">Criando roteiro...</span>
            ) : (
              <span>✨ Gerar Tópicos</span>
            )}
          </button>
        </div>
      </div>

      {/* Card 2: Generate Images + Consultant */}
      <div className="flex flex-col gap-6">
        {/* Images */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Imagens (Imagen 3)
            </span>
            <div className="h-4" />
          </div>
          <button
            onClick={onGenerateImages}
            disabled={isGeneratingImages || isPolling}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGeneratingImages || isPolling ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Processando...</span>
              </>
            ) : (
              <>
                <span>🎨</span> Gerar Imagens dos Slides
              </>
            )}
          </button>
          {imgProgress && (
            <p className="text-center text-xs text-indigo-600 mt-3 font-medium animate-pulse">
              {imgProgress}
            </p>
          )}
        </div>

        {/* Consultant */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Consultoria (Gemini)
            </span>
            <div className="h-4" />
          </div>
          <button
            onClick={onConsult}
            disabled={isConsulting}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-4 rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConsulting ? "Analisando..." : "💡 Dicas para este Look"}
          </button>
        </div>
      </div>
    </div>
  );
};
