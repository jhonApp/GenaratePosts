
import { useState, useCallback, useEffect } from "react";
import { useCarousel, initialCardData } from "./useCarousel";
import { useGenerationQueue } from "./useGenerationQueue";
import { generateCarouselPlanService, getStylingTipsService } from "../services/api";
import { CarouselCard } from "../types";

export const useCarouselOrchestrator = () => {
    const [cards, setCards] = useState<CarouselCard[]>(initialCardData);
    const [topic, setTopic] = useState("");
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    
    // Consultant State
    const [stylingTips, setStylingTips] = useState<string | undefined>(undefined);
    const [caption, setCaption] = useState<string>(""); // Added caption state
    const [isConsulting, setIsConsulting] = useState(false);

    // Hooks
    const carousel = useCarousel(cards.length);
    const queue = useGenerationQueue();

    // Reset tips on slide change
    useEffect(() => {
        setStylingTips(undefined);
    }, [carousel.currentSlide]);

    const handleGeneratePlan = async () => {
        if (!topic.trim()) return;
        setIsGeneratingPlan(true);
        // queue.resetGenerationState(); // Optional: Clear old images? Yes.
        
        try {
            const newCards = await generateCarouselPlanService(topic);
            setCards(newCards);
            queue.resetGenerationState();
            /* 
               Note: The original code showed "Roteiro criado! Clique em 'Gerar Imagens'..."
               We can set that via queue.imgProgress potentially, or handle it via a toast.
               For now, we leave the queue specific messages to the queue.
            */
            
        } catch (error) {
            console.error("Failed to generate plan:", error);
            // We might want to expose an error state here or use the queue's progress for generic messages if we abuse it,
            // but for cleaner separation, let's keep plan errors local or passed out.
            // For now, simple logging.
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleGenerateAllImages = async () => {
        const generationItems: { index: number; prompt: string }[] = [];
        
        // Identify which cards need generation
        cards.forEach((card, index) => {
            if (!queue.images[index]) {
                generationItems.push({ index, prompt: card.prompt });
            }
        });

        await queue.startGeneration(generationItems);
    };

    const handleConsultStylist = async () => {
        setIsConsulting(true);
        setStylingTips(undefined);
        try {
            const currentCard = cards[carousel.currentSlide];
            const rawText = await getStylingTipsService(currentCard);
            
            // Simple Markdown to HTML conversion (preserved from original)
            let html = rawText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
            html = html.replace(/^\* (.*)/gm, "<li>$1</li>");
            html = html.replace(/^- (.*)/gm, "<li>$1</li>");
            
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

    return {
        cards,
        topic,
        setTopic,
        isGeneratingPlan,
        stylingTips,
        caption, // Exposed
        setCaption, // Exposed
        isConsulting,
        carousel,
        queue,
        handleGeneratePlan,
        handleGenerateAllImages,
        handleConsultStylist
    };
};
