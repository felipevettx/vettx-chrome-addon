import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { StopPulls } from "../components/stopPull/StopPulls";

describe("StopPulls", () => {
  test("It should render correctly", () => {
    render(<StopPulls onClick={jest.fn()} />);
    const buttonElement = screen.getByText(/Do you need stop pull?/i);
    expect(buttonElement).toBeInTheDocument();
  });

  test("It should call onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<StopPulls onClick={handleClick} />);
    const buttonElement = screen.getByText(/Do you need stop pull?/i);
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
