import { renderHook, act } from "@testing-library/react";
import { useCarousel } from "../useCarousel";

describe("useCarousel", () => {
  it("should initialize with the first slide (index 0)", () => {
    const { result } = renderHook(() => useCarousel(5));
    expect(result.current.currentSlide).toBe(0);
  });

  it("should move to the next slide", () => {
    const { result } = renderHook(() => useCarousel(5));
    
    act(() => {
      result.current.nextSlide();
    });

    expect(result.current.currentSlide).toBe(1);
  });

  it("should loop back to the first slide after the last one", () => {
    const { result } = renderHook(() => useCarousel(3));
    
    // Move to last slide
    act(() => {
      result.current.goToSlide(2);
    });
    expect(result.current.currentSlide).toBe(2);

    // Next slide should be 0
    act(() => {
      result.current.nextSlide();
    });
    expect(result.current.currentSlide).toBe(0);
  });

  it("should move to the previous slide", () => {
    const { result } = renderHook(() => useCarousel(5));
    
    // Move to slide 1
    act(() => {
      result.current.goToSlide(1);
    });
    
    // Prev slide should be 0
    act(() => {
      result.current.prevSlide();
    });
    expect(result.current.currentSlide).toBe(0);
  });

  it("should loop to the last slide when going prev from the first", () => {
    const { result } = renderHook(() => useCarousel(5));
    
    // Initial is 0. Prev should be 4
    act(() => {
      result.current.prevSlide();
    });
    expect(result.current.currentSlide).toBe(4);
  });

  it("should go to a specific slide", () => {
    const { result } = renderHook(() => useCarousel(5));
    
    act(() => {
      result.current.goToSlide(3);
    });
    expect(result.current.currentSlide).toBe(3);
  });
});
