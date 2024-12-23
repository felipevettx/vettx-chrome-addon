import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import { ActionMessage } from "./components/actionMessage/ActionMessage";
import { Button } from "./components/button/Button";
import { Message } from "./components/message/Message";
import { StartButton } from "./components/startButton/StartButton";
import { StopPulls } from "./components/stopPull/StopPulls";
import { Toggle } from "./components/toggle/Toggle";
import { PullStatusMessage } from "./components/pullStatus/PullStatusMessage";
import { MessageSyncing } from "./components/messageSyncing";

const MAX_TIME = 280000; // 4 minutes y 40 seconds en milliseconds
const MESSAGE_RESET_DELAY = 5000; // set time to restart alert message

function App() {
  const [selectedTab, setSelectedTab] = useState("Listings");
  const [processState, setProcessState] = useState("start");
  const [showStopButton, setShowStopButton] = useState(false);
  const [messageState, setMessageState] = useState("noExecution");
  const [isToggleActive, setIsToggleActive] = useState(false);

  //logic for toggle
  useEffect(() => {
    chrome.storage.local.get(
      ["isToggleActive", "processState", "isScrapingActive"],
      (result) => {
        setIsToggleActive(result.isToggleActive || false);
        setProcessState(result.processState || "start");
        setShowStopButton(result.isScrapingActive || false);
      }
    );
  }, []);

  useEffect(() => {
    if (isToggleActive) {
      startFullProcess();
    }
  }, [isToggleActive]);

  const startFullProcess = useCallback(() => {
    chrome.runtime.sendMessage({ action: "startFullProcess" }, (response) => {
      if (response.success) {
        setProcessState("inProcess");
        setShowStopButton(true);
        setMessageState("processInProgress");
      } else {
        setMessageState(
          response.error === "loginRequired" ? "loginRequired" : "error"
        );
      }
    });
  }, []);

  const handleToggleChange = useCallback(
    (newState) => {
      setIsToggleActive(newState);
      chrome.storage.local.set({ isToggleActive: newState });
      if (newState) {
        startFullProcess();
      } else {
        chrome.runtime.sendMessage({ action: "stopScrape" });
        setProcessState("start");
        setShowStopButton(false);
        setMessageState("manuallyStopped");
      }
    },
    [startFullProcess]
  );

  //logic for tabs
  const updateState = useCallback((newState) => {
    setProcessState(newState);
    chrome.storage.local.set({ processState: newState });
  }, []);

  useEffect(() => {
    setSelectedTab("Listings");
  }, []);

  const loadInitialState = async () => {
    const result = await chrome.storage.local.get([
      "processState",
      "isScrapingActive",
      "messageState",
      "MAX_TIME",
    ]);
    if (result.processState) updateState(result.processState);
    if (result.isScrapingActive !== undefined)
      setShowStopButton(result.isScrapingActive);
    if (result.messageState) {
      setMessageState(result.messageState);
    } else {
      setMessageState("initial");
    }
    if (!result.MAX_TIME) chrome.storage.local.set({ MAX_TIME });
  };

  useEffect(() => {
    loadInitialState();

    const handleStorageChange = (changes) => {
      if (changes.processState) updateState(changes.processState.newValue);
      if (changes.isScrapingActive)
        setShowStopButton(changes.isScrapingActive.newValue);
      if (changes.messageState) setMessageState(changes.messageState.newValue);
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [updateState, loadInitialState]);

  const handleStart = useCallback(() => {
    console.log("Start button clicked");
    setMessageState("initial");
    chrome.runtime.sendMessage({ action: "openMultipleTabs" }, (response) => {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError);
        setMessageState("error");
      } else if (response && response.loggedIn) {
        updateState("inProcess");
        setMessageState("processInProgress");
        setShowStopButton(true);
        chrome.storage.local.set({
          isScrapingActive: true,
          activeTimer: true,
          messageState: "processInProgress",
          remaining: MAX_TIME / 1000,
        });
        chrome.action.setIcon({ path: "icons/enable.png" });
      } else {
        setMessageState("loginRequired");
      }
    });
  }, [updateState]);

  const checkTabsAndUpdateMessage = useCallback(() => {
    chrome.tabs.query({}, (tabs) => {
      const facebookTab = tabs.find(
        (tab) => tab.url && tab.url.includes("facebook.com")
      );
      const vettxTab = tabs.find(
        (tab) => tab.url && tab.url.includes("vettx.com")
      );

      if (facebookTab && vettxTab) {
        setMessageState("tabsOpen");
      } else {
        setMessageState("initial");
      }
      chrome.storage.local.set({
        messageState: facebookTab && vettxTab ? "noExecution" : "initial",
      });
    });
  }, []);

  const handleStop = useCallback(() => {
    chrome.runtime.sendMessage({ action: "stopScraping" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        updateState("start");
        setShowStopButton(false);
        setMessageState("manuallyStopped");
        chrome.storage.local.set({
          isScrapingActive: false,
          activeTimer: false,
          remaining: 0,
          messageState: "manuallyStopped",
        });

        // Retry after de 10 seconds
        setTimeout(() => {
          checkTabsAndUpdateMessage();
        }, MESSAGE_RESET_DELAY);
      }
    });
  }, [updateState]);

  useEffect(() => {
    const checkTabsStatus = () => {
      chrome.tabs.query({}, (tabs) => {
        const facebookTab = tabs.find(
          (tab) => tab.url && tab.url.includes("facebook.com")
        );
        const vettxTab = tabs.find(
          (tab) => tab.url && tab.url.includes("vettx.com")
        );

        if (processState === "inProcess") {
          if (!facebookTab) {
            setMessageState("facebookClosed");
            handleStop();
          } else if (!vettxTab) {
            setMessageState("vettxClosed");
            handleStop();
          }
        } else {
          checkTabsAndUpdateMessage();
        }
      });
    };

    const intervalId = setInterval(checkTabsStatus, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [processState, handleStop, checkTabsAndUpdateMessage]);

  useEffect(() => {
    chrome.storage.local.get("remaining", (result) => {
      if (result.remaining !== undefined) {
        setRemainingTime(result.remaining);
      }
    });
  }, []);

  return (
    <div
      className="w-[420px] h-[585px] flex flex-col items-center bg-[#F5F8FA]"
      style={{ width: "420px", height: "600px" }}
    >
      <div className="flex flex-col items-center justify-around  w-[420px] h-[527px] border border-[#E3E3E3]">
        <div className="flex flex-row justify-between items-center w-full px-4 pt-4">
          <div className="justify-between flex flex-row items-center w-full mb-[10px] ">
            <img
              src="icons/vettxLogo.svg"
              alt="VETTX Logo"
              className="w-[132px] h-[32px]"
            />
            <div className="flex flex-col w-[142px] h-[44px] ">
              <h3 className="text-base font-normal font-hkg text-right text-[#181c30] leading-[22px] ">
                Chrome
              </h3>
              <h3 className="text-[22px] font-bold font-hkg text-right capitalize leading-[22px] text-[#181C30] ">
                Add On
              </h3>
            </div>
          </div>
        </div>

        <div className="flex flex-row justify-start w-full border-b-[1px]   h-[48px]">
          <Button
            text="Listings"
            isSelected={selectedTab === "Listings"}
            onClick={() => setSelectedTab("Listings")}
          />
          <Button
            text="Message syncing"
            isSelected={selectedTab === "Message syncing"}
            onClick={() => setSelectedTab("Message syncing")}
          />
        </div>

        {selectedTab === "Listings" ? (
          <div className="flex flex-col items-center h-[410px] w-full">
            <div className="mt-[24px]">
              <Toggle checked={isToggleActive} onChange={handleToggleChange} />
            </div>

            <ActionMessage showMessage={processState} />
            <div className="mt-[12px]">
              <PullStatusMessage processState={processState} />
            </div>
            <div className="mt-[16px] mb-[22.5px]">
              <StartButton
                onStart={handleStart}
                processState={processState}
                maxTime={MAX_TIME}
              />
            </div>
            <div className="px-4 w-full">
              <Message processState={messageState} />
            </div>
            <div className="mt-[13px] ">
              {showStopButton && <StopPulls onClick={handleStop} />}
            </div>
          </div>
        ) : (
          <div className="h-[420px]">
            <MessageSyncing />
          </div>
        )}
      </div>

      <p className="text-[10px] text-[#919191] text-center font-normal font-dmSans my-auto">
        Copyright © 2024 VETTX. All rights reserved.
      </p>
    </div>
  );
}

export default App;
