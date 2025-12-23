import React from "react";
import { render, screen } from "@testing-library/react";
import { CarouselCard } from "../CarouselCard";
import { CarouselCard as CarouselCardType } from "../../types";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

const mockData: CarouselCardType = {
  title: "Test Title",
  subtitle: "Test Subtitle",
  prompt: "Test Prompt",
};

describe("CarouselCard", () => {
  it("renders title and subtitle correctly", () => {
    render(
      <CarouselCard
        data={mockData}
        index={0}
        total={3}
        loading={false}
      />
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <CarouselCard
        data={mockData}
        index={0}
        total={3}
        loading={true}
      />
    );

    expect(screen.getByText("Aguardando geração de imagem...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(
      <CarouselCard
        data={mockData}
        index={0}
        total={3}
        loading={false}
        error={true}
      />
    );

    expect(screen.getByText("Erro ao carregar imagem.")).toBeInTheDocument();
  });

  it("renders image when imageUrl is provided", () => {
    render(
      <CarouselCard
        data={mockData}
        index={0}
        total={3}
        loading={false}
        imageUrl="base64string"
      />
    );

    const img = screen.getByAltText("Test Title");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "data:image/png;base64,base64string");
  });
});
