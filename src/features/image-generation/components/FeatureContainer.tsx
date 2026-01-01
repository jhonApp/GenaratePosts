"use client";

import React, { useState } from "react";
import { useCarousel, initialCardData } from "../hooks/useCarousel";
// Components inlined or unused in new layout
// import { ImageGenerator } from "./ImageGenerator";
// import { StyleConsultant } from "./StyleConsultant";
// import { CaptionGenerator } from "./CaptionGenerator";
import {
  generateImageService, // Deprecated but kept for compatibility references if needed
  createGenerationJobs,
  generateSmartCaptionService,
  getStylingTipsService,
  generateCarouselPlanService,
} from "../services/api";
import { CarouselCard } from "../types";
import { useImageJobPoller } from "@/hooks/useImageJobPoller";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export const FeatureContainer: React.FC = () => {
  // States
  const [cards, setCards] = useState<CarouselCard[]>(initialCardData);
  
  const { currentSlide, nextSlide, prevSlide, goToSlide } = useCarousel(
    cards.length
  );
  const [topic, setTopic] = useState("");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [images, setImages] = useState<Record<number, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imgProgress, setImgProgress] = useState("");

  // Queue System State
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
  const { jobs, isPolling } = useImageJobPoller(activeJobIds);
  const [cardJobMapping, setCardJobMapping] = useState<Record<number, string>>({}); // Card Index -> Job ID

  const [caption, setCaption] = useState(
    `O look da virada é sobre celebrar quem você quer ser no próximo ano! ✨\n\nPara 2025, as tendências trazem um mix de conforto, brilho e muita personalidade. Do linho fresquinho ao brilho dos metalizados, o importante é escolher algo que te deixe segura e radiante.`
  );
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  const [stylingTips, setStylingTips] = useState<string | undefined>(undefined);
  const [isConsulting, setIsConsulting] = useState(false);

  // Helper to ensure base64 string has correct prefix
  const formatImageSrc = (src: string | null | undefined) => {
    if (!src) return '/placeholder.png';
    const cleanSrc = src.trim();
    return cleanSrc.startsWith('data:') ? cleanSrc : `data:image/png;base64,${cleanSrc}`;
  };

  // Handlers
  // Effect to sync Jobs Status to UI
  React.useEffect(() => {
    if (!isGeneratingImages && activeJobIds.length === 0) return;

    // Check progress
    const totalJobs = activeJobIds.length;
    if (totalJobs === 0) return;

    let pendingCount = 0;
    let completedCount = 0;

    // Iterate over mapped jobs to update specific cards
    Object.entries(cardJobMapping).forEach(([cardIndexStr, jobId]) => {
      const cardIndex = parseInt(cardIndexStr);
      const job = jobs.find((j) => j.id === jobId);

      if (!job) return; // Not found yet (maybe initial render)

      if (job.status === "PENDING" || job.status === "PROCESSING") {
        pendingCount++;
        setLoadingImages((prev) => ({ ...prev, [cardIndex]: true }));
        setImageErrors((prev) => ({ ...prev, [cardIndex]: false }));
      } else if (job.status === "COMPLETED" && job.imageUrl) {
        setLoadingImages((prev) => ({ ...prev, [cardIndex]: false }));
        // Format the image source before setting state
        const imgSrc = formatImageSrc(job.imageUrl);
        setImages((prev) => ({ ...prev, [cardIndex]: imgSrc })); 
        completedCount++;
      } else if (job.status === "FAILED") {
        setLoadingImages((prev) => ({ ...prev, [cardIndex]: false }));
        setImageErrors((prev) => ({ ...prev, [cardIndex]: true }));
        console.error(`Job ${jobId} failed: ${job.errorMessage}`);
      }
    });

    if (pendingCount > 0) {
      setImgProgress(`Gerando... (${completedCount}/${totalJobs} prontos)`);
    } else if (totalJobs > 0 && pendingCount === 0) {
       // All done
       if (isGeneratingImages) {
         setImgProgress("✨ Visual gerado!");
         setIsGeneratingImages(false);
         // Optional: Clear active jobs if we want to stop polling wholly, 
         // but the hook stops polling automatically when all are done.
       }
    }

  }, [jobs, activeJobIds, cardJobMapping, isGeneratingImages]);


  const handleGeneratePlan = async () => {
    if (!topic.trim()) return;
    setIsGeneratingPlan(true);
    setImgProgress("");
    
    try {
        const newCards = await generateCarouselPlanService(topic);
        setCards(newCards);
        // Reset images since we have new content
        setImages({});
        setLoadingImages({});
        setImageErrors({});
        setCardJobMapping({});
        setActiveJobIds([]); // Stop polling old jobs
        
        // Auto-start image generation for the new plan?
        // Let's let the user click "Gerar Imagens" to be safe and save credits, 
        // or we can just populate the cards and let them refine.
        // For now, just populate text and let them trigger images.
        setImgProgress("Roteiro criado! Clique em 'Gerar Imagens' para visualizar.");

    } catch (error) {
        console.error("Failed to generate plan:", error);
        setImgProgress("Erro ao criar roteiro. Tente novamente.");
    } finally {
        setIsGeneratingPlan(false);
    }
  };

  const handleGenerateAllImages = async () => {
    setIsGeneratingImages(true);
    setImgProgress("Iniciando fila...");

    const newMapping: Record<number, string> = {};
    const promptsToGenerate: string[] = [];
    const indicesToGenerate: number[] = [];

    // Identify which cards need generation
    for (let i = 0; i < cards.length; i++) {
        // Option: Regenerate all or only missing? 
        // Let's assume user clicked "Generate" so they want to fill missing ones OR regenerate all?
        // Typically "Generate All" might mean "Fill Empty". 
        // But for this feature, let's generate ONLY those that don't have images yet 
        // UNLESS we want a "Force Regenerate" button. 
        // For simplicity now: If no image, generate.
        if (!images[i]) {
            promptsToGenerate.push(cards[i].prompt);
            indicesToGenerate.push(i);
            
            // Set initial loading state
            setLoadingImages((prev) => ({ ...prev, [i]: true }));
            setImageErrors((prev) => ({ ...prev, [i]: false }));
        }
    }

    if (promptsToGenerate.length === 0) {
        setImgProgress("Todas as imagens já foram geradas!");
        setIsGeneratingImages(false);
        return;
    }

    try {
        // 1. Create Jobs
        const jobIds = await createGenerationJobs(promptsToGenerate);
        
        // Map Job IDs back to Card Indices
        jobIds.forEach((jobId, idx) => {
            const originalCardIndex = indicesToGenerate[idx];
            newMapping[originalCardIndex] = jobId;
        });

        // Merge with existing mapping in case of partial runs
        const updatedMapping = { ...cardJobMapping, ...newMapping };
        setCardJobMapping(updatedMapping);
        
        // 2. Start Polling (by setting active IDs)
        // We only track the NEW jobs for this session + any previous active ones if we want.
        // For now, let's just track the new ones or all relevant ones.
        const allActiveIds = Object.values(updatedMapping);
        setActiveJobIds(allActiveIds);

        // 3. Trigger Worker (Fire-and-forget)
        // We trigger it once. The worker logic creates a loop, but triggering once per batch is safe.
        // Using fetch to trigger the background processing
        const protocol = window.location.protocol;
        const host = window.location.host;
        const workerUrl = `${protocol}//${host}/api/queue/process`;
        
        fetch(workerUrl, { method: "POST" }).catch(err => 
            console.error("Failed to trigger worker:", err)
        );

    } catch (error) {
        console.error("Failed to start generation batch:", error);
        setImgProgress("Erro ao iniciar geração.");
        setIsGeneratingImages(false);
        // Reset loading states
        indicesToGenerate.forEach(i => {
             setLoadingImages((prev) => ({ ...prev, [i]: false }));
             setImageErrors((prev) => ({ ...prev, [i]: true }));
        });
    }
  };

  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const newCaption = await generateSmartCaptionService(cards);
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
      const currentCard = cards[currentSlide];
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

  // Render
  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      {/* Header - now just title since Layout handles Nav */}
      <div className="text-center mb-10 mt-6">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900">
          Tendências para o Ano Novo
        </h2>
        <p className="text-gray-500 mt-2 text-sm uppercase tracking-widest">
          Coleção 2025
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Carousel Area (Centerpiece) - Span 8 */}
        <div className="lg:col-span-8 lg:col-start-3 w-full">
          <div className="relative aspect-[3/4] md:aspect-[4/3] lg:aspect-[3/4] w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden group">
            
            {/* Main Image Layer */}
            {cards.map((card, index) => {
              // Show only current slide
              if (index !== currentSlide) return null;

              const imageUrl = images[index];
              const isLoading = loadingImages[index];
              const isError = imageErrors[index];

              return (
                <div key={index} className="absolute inset-0 w-full h-full animate-fade-in">
                  
                  {/* Image or Placeholder */}
                  {imageUrl ? (
                    <img
                      src={imageUrl} // Start with formatted, but it's already set in state
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
                           <span className="text-gray-400">Aguardando geração</span> // Or placeholder image
                       )}
                    </div>
                  )}

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                  {/* Text Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10">
                    <h3 className="font-serif text-3xl font-bold mb-2 leading-tight">
                      {card.title}
                    </h3>
                    <p className="text-gray-200 text-lg font-light leading-relaxed mb-4">
                      {card.subtitle || card.text}
                    </p>
                    {/* Dots / Pagination */}
                    <div className="flex gap-2 mt-4">
                        {cards.map((_, idx) => (
                           <div 
                             key={idx}
                             className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-yellow-500 w-8' : 'bg-white/40 w-4'}`}
                           />
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Navigation Arrows (Floating) */}
            <button
               onClick={prevSlide}
               className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white text-white hover:text-black backdrop-blur-md p-3 rounded-full shadow-lg transition-all z-20 group-hover:opacity-100 opacity-0 md:opacity-100"
            >
               <span className="sr-only">Anterior</span>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
               </svg>
            </button>
             <button
               onClick={nextSlide}
               className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white text-white hover:text-black backdrop-blur-md p-3 rounded-full shadow-lg transition-all z-20 group-hover:opacity-100 opacity-0 md:opacity-100"
            >
               <span className="sr-only">Próximo</span>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
               </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Action Area (Cards) */}
      <div className="w-full max-w-4xl mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 px-4 pb-20">
        
        {/* Card 1: Generate New Topic */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
             <div>
               <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                 Novo Tema (Gemini)
               </span>
               <h3 className="font-serif text-xl font-bold text-gray-900 mt-1">Crie seu Conteúdo</h3>
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
                   onClick={handleGeneratePlan}
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

        {/* Card 2: Generate Images Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Imagens (Imagen 3)
            </span>
            <div className="h-4" /> {/* Spacer */}
          </div>
           <button
             onClick={handleGenerateAllImages}
             disabled={isGeneratingImages || isPolling}
             className="w-full bg-indigo-600 text-white py-4 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
              {isGeneratingImages || isPolling ? (
                 <>
                   <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   <span>Processando...</span>
                 </>
              ) : (
                 <><span>🎨</span> Gerar Imagens dos Slides</>
              )}
           </button>
           {imgProgress && (
               <p className="text-center text-xs text-indigo-600 mt-3 font-medium animate-pulse">
                   {imgProgress}
               </p>
           )}
        </div>

        {/* Card 2: Consultant */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
               Consultoria (Gemini)
            </span>
            <div className="h-4" /> {/* Spacer */}
          </div>
          <button
            onClick={handleConsultStylist}
            disabled={isConsulting}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-4 rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {isConsulting ? "Analisando..." : "💡 Dicas para este Look"}
          </button>
        </div>

      </div>

      {/* Helper Area for Styling Tips Output if needed */}
       {stylingTips && (
           <div className="max-w-2xl mx-auto px-4 mb-12 w-full animate-fade-in-up">
               <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 relative">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-sm border border-orange-100 rounded-full p-2">
                       💡
                   </div>
                   <div 
                      className="prose prose-sm prose-orange max-w-none text-gray-700 font-medium"
                      dangerouslySetInnerHTML={{ __html: stylingTips }} 
                   />
               </div>
           </div>
       )}
    </div>
  );
};
