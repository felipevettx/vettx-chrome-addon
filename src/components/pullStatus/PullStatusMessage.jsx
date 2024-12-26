import { useState, useEffect } from "react";

export function PullStatusMessage({ processState }) {
  const [scrapedCount, setScrapedCount] = useState(0);
  const [timeLastPull, setTimeLastPull] = useState("0 hours");
  const [currentMessage, setCurrentMessage] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const updateData = () => {
      chrome.storage.local.get(["scrapedCount", "lastPullTime"], (result) => {
        setScrapedCount(result.scrapedCount || 0);
        if (result.lastPullTime) {
          const hoursElapsed = calculateHoursElapsed(result.lastPullTime);
          setTimeLastPull(`${hoursElapsed} hours`);
        } else {
          setTimeLastPull("0 hours");
        }
      });
    };

    const handleStorageChange = (changes) => {
      if (changes.scrapedCount) {
        setScrapedCount(changes.scrapedCount.newValue);
      }
      if (changes.lastPullTime) {
        const hoursElapsed = calculateHoursElapsed(
          changes.lastPullTime.newValue
        );
        setTimeLastPull(`${hoursElapsed} hours`);
      }
    };

    updateData();
    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    let intervalId;

    if (processState === "inProcess") {
      setCurrentMessage("Your pull is running");
    } else {
      const messages = [
        <span>
          <span className="font-bold">{timeLastPull}</span> from your last pull.
        </span>,
        <span>
          Your latest pull added
          <span className="font-bold"> {scrapedCount} listings.</span>
        </span>,
      ];
      let messageIndex = 0;

      setCurrentMessage(messages[messageIndex]);
      intervalId = setInterval(() => {
        setIsVisible(false);
        setTimeout(() => {
          messageIndex = (messageIndex + 1) % messages.length;
          setCurrentMessage(messages[messageIndex]);
          setIsVisible(true);
        }, 500);
      }, 4000);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [processState, timeLastPull, scrapedCount]);

  const calculateHoursElapsed = (lastPullTime) => {
    const now = new Date();
    const lastPull = new Date(lastPullTime);
    const difference = now - lastPull;
    return Math.floor(difference / (1000 * 60 * 60));
  };

  return (
    <div className="flex flex-col items-center text-center">
      <p
        className={`text-[#919191] text-base transition-opacity duration-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {currentMessage}
      </p>
    </div>
  );
}
