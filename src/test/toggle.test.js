import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Toggle } from "../components/toggle/Toggle";

jest.mock("react-icons/fa", () => ({
  FaCheck: () => <div data-testid="fa-check-icon" />,
}));

describe("Toggle", () => {
  test("renders correctly when unchecked", () => {
    render(<Toggle checked={false} onChange={() => {}} />);

    expect(screen.getByText("Automatic pulls")).toBeInTheDocument();
    expect(screen.queryByTestId("fa-check-icon")).not.toBeInTheDocument();
  });

  test("renders correctly when checked", () => {
    render(<Toggle checked={true} onChange={() => {}} />);

    expect(screen.getByText("Automatic pulls")).toBeInTheDocument();
    expect(screen.getByTestId("fa-check-icon")).toBeInTheDocument();
  });

  test("calls onChange when clicked", () => {
    const mockOnChange = jest.fn();
    render(<Toggle checked={false} onChange={mockOnChange} />);

    fireEvent.click(screen.getByText("Automatic pulls"));

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });
});
