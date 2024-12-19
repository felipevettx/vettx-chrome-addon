import { useState, useEffect } from "react";

export function PullStatusMessage() {
  const [scrapedCount, setScrapedCount] = useState(0);
  const [timeLastPull, setTimeLastPull] = useState("0 hours");
  useEffect(() => {
    chrome.storage.local.get(["scrapedCount", "lastPullTime"], (result) => {
      setScrapedCount(result.scrapedCount || 0);
      if (result.lastPullTime) {
        const hoursElapsed = calculateHoursElapsed(result.lastPullTime);
        setTimeLastPull(`${hoursElapsed} hours`);
      }
    });
    const handleStorageChange = (changes) => {
      if (changes.scrapedCount) {
        setScrapedCount(changes.scrapedCount.newValue);
      }
      if (changes.lastPullTime) {
        const hourElapsed = calculateHoursElapsed(
          changes.lastPullTime.newValue
        );
        setTimeLastPull(`${hourElapsed} hours`);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  //calculate the hours elapsed since the last pull
  const calculateHoursElapsed = (lastPullTime) => {
    const now = new Date();
    const lastPull = new Date(lastPullTime);
    const difference = now - lastPull;

    return Math.floor(difference / (1000 * 60 * 60));
  };

  return (
    <div className="flex flex-col items-center mt-4 text-center">
      <p className="text-[#919191] text-base">
        Your latest pull added <span>{scrapedCount} </span> listings.
      </p>
      <p className="text-[#919191] text-base">
        {timeLastPull} from your last pull.
      </p>
    </div>
  );
}
