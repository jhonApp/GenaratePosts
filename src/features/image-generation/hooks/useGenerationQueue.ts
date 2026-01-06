
import { useState, useEffect, useCallback } from "react";
import { createGenerationJobs } from "../services/api";

interface GenerationQueueHook {
  images: Record<number, string>;
  loadingImages: Record<number, boolean>;
  imageErrors: Record<number, boolean>;
  isGeneratingImages: boolean;
  imgProgress: string;
  startGeneration: (items: { index: number; prompt: string }[]) => Promise<void>;
  setImages: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  resetGenerationState: () => void;
  isPolling: boolean;
}

export const useGenerationQueue = (): GenerationQueueHook => {
  const [images, setImages] = useState<Record<number, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imgProgress, setImgProgress] = useState("");
  
  // Queue System State
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
  const [cardJobMapping, setCardJobMapping] = useState<Record<number, string>>({});

  const isPolling = activeJobIds.length > 0;

  const formatImageSrc = (src: string | null | undefined) => {
    if (!src) return '/placeholder.png';
    return src.trim();
  };

  const resetGenerationState = useCallback(() => {
    setImages({});
    setLoadingImages({});
    setImageErrors({});
    setCardJobMapping({});
    setActiveJobIds([]);
    setImgProgress("");
    setIsGeneratingImages(false);
  }, []);

  const startGeneration = useCallback(async (items: { index: number; prompt: string }[]) => {
    if (items.length === 0) {
        setImgProgress("Todas as imagens já foram geradas!");
        return;
    }

    setIsGeneratingImages(true);
    setImgProgress("Iniciando fila...");

    const newMapping: Record<number, string> = {};
    const prompts = items.map(i => i.prompt);
    const indices = items.map(i => i.index);

    // Set initial loading state
    items.forEach(({ index }) => {
        setLoadingImages((prev) => ({ ...prev, [index]: true }));
        setImageErrors((prev) => ({ ...prev, [index]: false }));
    });

    try {
        const jobIds = await createGenerationJobs(prompts);
        
        jobIds.forEach((jobId, idx) => {
            const originalCardIndex = indices[idx];
            newMapping[originalCardIndex] = jobId;
        });

        // Merge mappings
        const updatedMapping = { ...cardJobMapping, ...newMapping };
        setCardJobMapping(updatedMapping);
        
        // Start Polling
        setActiveJobIds(Object.values(updatedMapping));

        // Trigger Worker
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
        indices.forEach(i => {
             setLoadingImages((prev) => ({ ...prev, [i]: false }));
             setImageErrors((prev) => ({ ...prev, [i]: true }));
        });
    }
  }, [cardJobMapping]);

  // Polling Effect
  useEffect(() => {
    if (activeJobIds.length === 0) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/queue/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobIds: activeJobIds }),
        });

        if (!response.ok) return;

        const data = await response.json();
        const jobsStatus: { id: string, status: string, imageUrl?: string, errorMessage?: string }[] = data.jobs;

        let pendingCount = 0;
        let completedCount = 0;

        Object.entries(cardJobMapping).forEach(([cardIndexStr, jobId]) => {
            const cardIndex = parseInt(cardIndexStr);
            const job = jobsStatus.find(j => j.id === jobId);
            
            if (!job) return;

            if (job.status === "COMPLETED" && job.imageUrl) {
                const formattedSrc = formatImageSrc(job.imageUrl);
                setImages(prev => {
                    // Prevent unnecessary updates
                    if (prev[cardIndex] === formattedSrc) return prev;
                    return { ...prev, [cardIndex]: formattedSrc };
                });
                setLoadingImages(prev => ({ ...prev, [cardIndex]: false }));
                setImageErrors(prev => ({ ...prev, [cardIndex]: false }));
                completedCount++;
            } else if (job.status === "FAILED") {
                setLoadingImages(prev => ({ ...prev, [cardIndex]: false }));
                setImageErrors(prev => ({ ...prev, [cardIndex]: true }));
            } else {
                pendingCount++; 
                setLoadingImages(prev => ({ ...prev, [cardIndex]: true }));
            }
        });

         if (pendingCount > 0) {
            setImgProgress(`Gerando... (${completedCount}/${activeJobIds.length} prontos)`);
        } else {
            setImgProgress("✨ Visual gerado!");
            setIsGeneratingImages(false);
            setActiveJobIds([]); 
        }

      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 2000);

    return () => clearInterval(intervalId);

  }, [activeJobIds, cardJobMapping]);

  return {
    images,
    loadingImages,
    imageErrors,
    isGeneratingImages,
    imgProgress,
    startGeneration,
    setImages,
    resetGenerationState,
    isPolling
  };
};
