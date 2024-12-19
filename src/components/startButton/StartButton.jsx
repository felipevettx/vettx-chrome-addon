import React, { useState, useEffect, useCallback } from "react";
import { RingTimer } from "../ringLoader/RingTimer";

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
          <span className="font-hkg text-[22px] font-medium">
            {!activeTimer ? "START!" : formatTime(remaining)}
          </span>
          {activeTimer && (
            <div className="font-hkg text-[11px] tracking-wide text-white">
              REMAINING
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
