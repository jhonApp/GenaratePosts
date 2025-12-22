"use client";

import React from "react";
import { useCarousel } from "../hooks/useCarousel";
import { CarouselCard as CarouselCardType } from "../types";
import { CarouselCard } from "./CarouselCard";

interface CarouselProps {
  slides: CarouselCardType[];
  images: Record<number, string>; // Map index -> base64 string
  loadingStates: Record<number, boolean>;
  errors: Record<number, boolean>;
  currentIndex: number;
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
}

export const Carousel: React.FC<CarouselProps> = ({
  slides,
  images,
  loadingStates,
  errors,
  currentIndex,
  goToSlide,
  nextSlide,
  prevSlide,
}) => {
  return (
    <div className="w-full max-w-[400px] relative mx-auto perspective-1000">
      <div className="overflow-hidden rounded-lg shadow-xl">
        <div
            className="flex transition-transform duration-500 ease-out will-change-transform"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
            {slides.map((slide, index) => (
            <div key={index} className="w-full shrink-0">
                <CarouselCard
                data={slide}
                index={index}
                total={slides.length}
                imageUrl={images[index]}
                loading={loadingStates[index]}
                error={errors[index]}
                />
            </div>
            ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-[-20px] top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg z-20 hover:scale-110 transition-transform md:flex hidden text-gray-800"
        aria-label="Previous slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-[-20px] top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg z-20 hover:scale-110 transition-transform md:flex hidden text-gray-800"
        aria-label="Next slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Dots */}
      <div className="flex gap-2 mt-6 justify-center">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "w-6 bg-yellow-600" : "w-2 bg-gray-300"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
