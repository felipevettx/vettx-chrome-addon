import React, { useState, useEffect, useRef } from "react";
import "./ring-timer.css";

export function RingTimer({ maxTime }) {
  const [percentage, setPercentage] = useState(100);
  const [isVisible, setIsVisible] = useState(true);
  const animationFrameRef = useRef();
  const startTimeRef = useRef(0);
  const remainingTimeRef = useRef(0);

  useEffect(() => {
    const animate = (timestamp) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const remaining = Math.max(0, remainingTimeRef.current - elapsed / 1000);
      const newPercentage = (remaining / (maxTime / 1000)) * 100;

      setPercentage(newPercentage);

      if (remaining > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setPercentage(0);
      }
    };

    const handleStorageChange = (changes) => {
      if (
        changes.remaining ||
        changes.MAX_TIME ||
        changes.isScrapingActive !== undefined
      ) {
        chrome.storage.local.get(
          ["remaining", "MAX_TIME", "isScrapingActive"],
          (result) => {
            const remainingTime = result.remaining || 0;
            const isActive = result.isScrapingActive;

            setIsVisible(true);

            if (!isActive) {
              setPercentage(100);
              if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
              }
            } else {
              remainingTimeRef.current = remainingTime;
              startTimeRef.current = 0;
              if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
              }
              animationFrameRef.current = requestAnimationFrame(animate);
            }
          }
        );
      }
    };

    chrome.storage.local.get(
      ["remaining", "MAX_TIME", "isScrapingActive"],
      (result) => {
        const remainingTime = result.remaining || 0;
        const isActive = result.isScrapingActive;

        if (!isActive) {
          setPercentage(100);
        } else {
          remainingTimeRef.current = remainingTime;
          startTimeRef.current = 0;
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      }
    );

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [maxTime]);

  if (!isVisible) return null;

  const circumference = 2 * Math.PI * 66;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-[138px] h-[138px]">
      <svg
        width="138"
        height="138"
        viewBox="0 0 138 138"
        className="transform -rotate-90"
      >
        <circle cx="69" cy="69" r="66" className="ring-loader-bg" />
        <circle
          cx="69"
          cy="69"
          r="66"
          className="ring-loader-progress"
          style={{ strokeDasharray: circumference, strokeDashoffset }}
        />
      </svg>
    </div>
  );
}
