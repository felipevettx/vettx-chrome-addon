import React, { useState, useEffect } from "react";
import { RingTimer } from "../ringLoader/RingTimer";

/**
 * StartButton Component
 *
 * A circular button that initiates a timer process and displays a countdown using the
 * `RingTimer` component. The button dynamically updates its state and appearance based on
 * user interaction and data stored in Chrome's local storage.
 *
 * @param {Object} props - Component props.
 * @param {Function} props.onStart - Callback function triggered when the button is clicked to start the process.
 * @param {string} props.processState - Current state of the process ("start", "inProcess", etc.).
 * @param {number} props.maxTime - Maximum time for the timer in milliseconds.
 *
 * Features:
 * - Displays a circular button with dynamic text and background color.
 * - Integrates with the `RingTimer` component to show a visual countdown.
 * - Syncs state with Chrome's local storage (`activeTimer`, `remaining`, `processState`).
 * - Handles click events to transition the process state and initiate the timer.
 *
 * @returns {JSX.Element} A stylized button with timer functionality.
 */
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

export function StartButton({ onStart, processState, maxTime }) {
  const [activeTimer, setActiveTimer] = useState(false);
  const [remaining, setRemaining] = useState(maxTime / 1000);

  useEffect(() => {
    const loadInitialState = async () => {
      const result = await chrome.storage.local.get([
        "activeTimer",
        "remaining",
        "processState",
      ]);
      setActiveTimer(result.activeTimer || false);
      setRemaining(result.remaining || maxTime / 1000);

      if (result.processState === "start") {
        setActiveTimer(false);
        setRemaining(maxTime / 1000);
      }
    };

    loadInitialState();

    const handleStorageChange = (changes) => {
      if (changes.activeTimer) setActiveTimer(changes.activeTimer.newValue);
      if (changes.remaining) setRemaining(changes.remaining.newValue);
      if (changes.processState && changes.processState.newValue === "start") {
        setActiveTimer(false);
        setRemaining(maxTime / 1000);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [maxTime]);

  const handleClick = () => {
    if (processState === "start" && !activeTimer) {
      setActiveTimer(true);
      setRemaining(maxTime / 1000);
      chrome.storage.local.set({
        activeTimer: true,
        remaining: maxTime / 1000,
        processState: "inProcess",
      });
      onStart();
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center w-[150px] h-[150px] rounded-full 
    ${activeTimer ? "bg-[#009BF5]" : "bg-[#2BB1FF]"} 
    hover:bg-[#009BF5] transform-color ease-in-out duration-300 cursor-pointer`}
      onClick={handleClick}
    >
      <RingTimer maxTime={maxTime} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-white">
          <span className="font-hkg text-[22px] font-medium leading-none">
            {!activeTimer ? "START!" : formatTime(remaining)}
          </span>
          {activeTimer && (
            <div className="font-hkg text-[11px] tracking-wide text-white mt-1 leading-none">
              REMAINING
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
