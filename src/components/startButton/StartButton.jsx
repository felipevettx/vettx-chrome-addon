import { useEffect, useState, useCallback } from "react";

export function StartButton({ processState, onStart }) {
  const [remaining, setRemaining] = useState(0);
  const [activeTimer, setActiveTimer] = useState(false);
  const [maxTime, setMaxTime] = useState(280000);

  const resetButton = useCallback(() => {
    setActiveTimer(false);
    setRemaining(0);
  }, []);

  useEffect(() => {
    const loadInitialState = async () => {
      const result = await chrome.storage.local.get([
        "MAX_TIME",
        "activeTimer",
        "remaining",
        "processState",
      ]);
      setMaxTime(result.MAX_TIME || 280000);
      setActiveTimer(result.activeTimer || false);
      setRemaining(result.remaining || 0);

      if (result.processState === "start") {
        resetButton();
      }
    };

    loadInitialState();

    const handleStorageChange = (changes) => {
      if (changes.activeTimer) setActiveTimer(changes.activeTimer.newValue);
      if (changes.remaining) setRemaining(changes.remaining.newValue);
      if (changes.processState && changes.processState.newValue === "start") {
        resetButton();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [resetButton]);

  useEffect(() => {
    if (processState === "start") {
      resetButton();
    }
  }, [processState, resetButton]);

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

  const formatTime = `${String(Math.floor(remaining / 60)).padStart(
    2,
    "0"
  )}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <div
      className={`flex items-center justify-center w-[150px] h-[150px] rounded-full 
      ${activeTimer ? "bg-[#009BF5]" : "bg-[#2BB1FF]"} 
      hover:bg-[#009BF5] transform-color ease-in-out duration-300 cursor-pointer`}
    >
      <div className="bg-none">
        <button
          onClick={handleClick}
          className="flex items-center flex-col justify-center rounded-full w-[138px] h-[138px] border-[5px] border-white text-white font-hkg font-medium leading-none"
          disabled={activeTimer}
        >
          <span className="font-hkg text-[22px] font-medium ">
            {!activeTimer ? "START!" : formatTime}
          </span>
          {activeTimer && (
            <div className="font-hkg text-[11px] tracking-wide text-white ">
              REMAINING
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
