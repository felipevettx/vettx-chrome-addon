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
          setCurrentMessage(`${hoursElapsed} hours from your last pull.`);
        } else {
          setCurrentMessage(`0 hours from your last pull.`);
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
    if (processState === "inProcess") {
      setCurrentMessage("Your pull is running");
      return;
    }

    // Switch between messages every 6 seconds.
    const messages = [
      `${timeLastPull} from your last pull.`,
      `Your latest pull added ${scrapedCount} listings.`,
    ];
    let messageIndex = 1;

    const intervalId = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessage(messages[messageIndex]);
        setIsVisible(true);
        messageIndex = (messageIndex + 1) % messages.length;
      }, 500); //fade-out (0.5s)
    }, 6000);

    return () => clearInterval(intervalId);
  }, [processState, timeLastPull, scrapedCount]);

  // Calculate the hours elapsed since the last pull.
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
