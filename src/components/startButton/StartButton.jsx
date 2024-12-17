import { useEffect, useState } from "react";

export function StartButton({ processState, onStart }) {
  const [remaining, setRemaining] = useState(480);
  const [activeTimer, setActiveTimer] = useState(false);

  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        setRemaining((prevTime) => {
          if (prevTime <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  useEffect(() => {
    if (processState === "start") {
      setActiveTimer(false);
      setRemaining(480);
    }
  }, [processState]);

  const handleClick = () => {
    setActiveTimer(true);
    onStart();
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
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
