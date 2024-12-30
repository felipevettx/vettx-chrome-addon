import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StartButton } from "../components/startButton/StartButton";

jest.mock("../components/ringLoader/RingTimer", () => ({
  RingTimer: () => <div data-testid="mock-ring-timer" />,
}));

const mockChromeStorage = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockChromeAPI = {
  storage: {
    local: mockChromeStorage,
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
};

global.chrome = mockChromeAPI;

describe("StartButton", () => {
  const mockOnStart = jest.fn();
  const maxTime = 60000;

  beforeEach(() => {
    jest.clearAllMocks();
    mockChromeStorage.get.mockImplementation(() =>
      Promise.resolve({
        activeTimer: false,
        remaining: 60,
        processState: "start",
      })
    );
  });

  test("renders correctly in initial state", async () => {
    await act(async () => {
      render(
        <StartButton
          onStart={mockOnStart}
          processState="start"
          maxTime={maxTime}
        />
      );
    });

    expect(screen.getByText("START!")).toBeInTheDocument();
    expect(screen.getByTestId("mock-ring-timer")).toBeInTheDocument();
  });

  test("changes state when clicked", async () => {
    await act(async () => {
      render(
        <StartButton
          onStart={mockOnStart}
          processState="start"
          maxTime={maxTime}
        />
      );
    });

    const button = screen.getByText("START!");
    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockOnStart).toHaveBeenCalled();
    expect(mockChromeStorage.set).toHaveBeenCalledWith({
      activeTimer: true,
      remaining: 60,
      processState: "inProcess",
    });
  });
});
