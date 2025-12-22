import { useState } from "react";
import { CarouselCard } from "../types";

export const useCarousel = (totalSlides: number) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return {
    currentSlide,
    nextSlide,
    prevSlide,
    goToSlide,
  };
};

export const initialCardData: CarouselCard[] = [
  {
    title: "Tendências para o Ano Novo 2025",
    subtitle: "Além do branco: o que vai bombar na virada!",
    cta: "Arraste para o lado 👉",
    type: "cover",
    prompt:
      "A stunning, high-fashion portrait of a stylist with a festive look, subtle glitter background, warm luxury lighting, golden hour",
  },
  {
    title: "O Poder dos Metalizados",
    text: "O brilho continua em alta, mas agora com foco em texturas.",
    details: "Prata, dourado e o 'rosé gold' em tecidos acetinados.",
    tip: "Dica: Use acessórios metalizados para elevar o visual.",
    prompt:
      "Close up of metallic silver and rose gold satin fabrics, sequins texture, luxury fashion photography",
  },
  {
    title: "Transparências e Rendas",
    text: "A leveza do verão brasileiro ganha sofisticação.",
    details: "Crochê artesanal e transparências estratégicas.",
    tip: "Perfeito para passar a virada na praia.",
    prompt:
      "Elegant handmade crochet white lace dress, beach sunset background, airy summer fashion",
  },
  {
    title: "Além do Branco",
    text: "Dopamine Dressing: atraia energias específicas!",
    details: "Azul Bebê, Amarelo Manteiga e Vermelho Paixão.",
    tip: "Escolha a cor que favorece sua cartela pessoal!",
    prompt:
      "Palette of soft butter yellow, baby blue and vibrant red silk clothes, minimalist chic",
  },
  {
    title: "Alfaiataria Despojada",
    text: "Conforto e elegância em peças estruturadas.",
    details: "Conjuntos de colete e calça de linho.",
    tip: "Traz elegância imediata para aproveitar a festa.",
    prompt:
      "Woman wearing a chic white linen vest and trousers set, minimal elegant aesthetic",
  },
  {
    title: "Qual dessas combina com você?",
    text: "Você é do time 'branco tradicional' ou gosta de ousar?",
    details: "Comenta aqui embaixo! 👇",
    tip: "Salve para não esquecer! 💾",
    prompt:
      "Social media engagement card, festive aesthetic, stylish New Year elements",
  },
];
