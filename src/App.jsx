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

const MAX_TIME = 300000; //Maximum time in milliseconds to show in the timer
const MESSAGE_RESET_DELAY = 5000; // Time delay for resetting toast alerts in message component

function App() {
  const [selectedTab, setSelectedTab] = useState("Listings");
  const [processState, setProcessState] = useState("start");
  const [showStopButton, setShowStopButton] = useState(false);
  const [messageState, setMessageState] = useState("noExecution");
  const [isToggleActive, setIsToggleActive] = useState(false);
  /**
   * Initiates the full process by sending a message to the background script. When the toggle is active, this function is called.
   */
  const startFullProcess = useCallback(() => {
    console.log("calling to  startFullProcess");
    chrome.runtime.sendMessage({ action: "startFullProcess" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error:", chrome.runtime.lastError);
        setMessageState("error");
      } else if (response && response.success) {
        console.log("Complete process started successfully");
        setProcessState("inProcess");
        setShowStopButton(true);
        setMessageState("processInProgress");
      } else if (response && response.error === "processAlreadyRunning") {
        console.log("The process is already running");
        setProcessState("inProcess");
        setShowStopButton(true);
        setMessageState("processInProgress");
      } else if (response && response.error === "loginRequired") {
        console.log("Login required");
        setMessageState("loginRequired");
      } else {
        console.error("Failed to start entire process:", response);
        setMessageState("error");
      }
    });
  }, []);

  /**
   * Checks the status of open tabs to ensure required domains are active.
   */

  const checkTabsStatus = useCallback(() => {
    chrome.tabs.query({}, (tabs) => {
      const facebookTab = tabs.find(
        (tab) => tab.url && tab.url.includes("facebook.com")
      );
      const vettxTab = tabs.find(
        (tab) => tab.url && tab.url.includes("vettx.com")
      );

      const newMessageState =
        facebookTab && vettxTab ? "tabsOpen" : "tabsClosed";

      setMessageState(newMessageState);
      chrome.storage.local.set({
        messageState: newMessageState,
      });
    });
  }, []);

  /**
   * Loads the initial state from local storage and sets up listeners.
   */

  useEffect(() => {
    const loadInitialState = async () => {
      const result = await chrome.storage.local.get([
        "isToggleActive",
        "processState",
        "isScrapingActive",
        "messageState",
      ]);

      const toggleState = result.isToggleActive || false;
      setIsToggleActive(toggleState);
      setProcessState(result.processState || "start");
      setShowStopButton(result.isScrapingActive || false);
      setMessageState(result.messageState || "noExecution");

      if (toggleState) {
        startFullProcess();
      }
    };

    loadInitialState();

    const handleStorageChange = (changes) => {
      if (changes.processState) setProcessState(changes.processState.newValue);
      if (changes.isScrapingActive)
        setShowStopButton(changes.isScrapingActive.newValue);
      if (changes.messageState) setMessageState(changes.messageState.newValue);
      if (changes.isToggleActive) {
        setIsToggleActive(changes.isToggleActive.newValue);
        if (changes.isToggleActive.newValue) {
          startFullProcess();
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [startFullProcess, checkTabsStatus]);

  /**
   * Handles changes in the toggle switch.
   * @param {boolean} newState - The new state of the toggle.
   */
  const handleToggleChange = useCallback(
    (newState) => {
      setIsToggleActive(newState);
      chrome.storage.local.set({ isToggleActive: newState });

      if (newState) {
        chrome.storage.local.set({
          activeTimer: true,
          remaining: MAX_TIME / 1000,
          processState: "inProcess",
        });
        startFullProcess();
      } else {
        chrome.runtime.sendMessage({ action: "stopScraping" });
        setProcessState("start");
        setShowStopButton(false);
        setMessageState("manuallyStopped");
        chrome.storage.local.set({
          processState: "start",
        });
      }
    },
    [startFullProcess]
  );

  /**
   * Starts the scraping process by opening necessary tabs and updating state.
   */
  const handleStart = useCallback(() => {
    setMessageState("initial");
    chrome.runtime.sendMessage({ action: "openMultipleTabs" }, (response) => {
      if (chrome.runtime.lastError) {
        setMessageState("error");
      } else if (response && response.loggedIn) {
        setProcessState("inProcess");
        setMessageState("processInProgress");
        setShowStopButton(true);
        chrome.storage.local.set({
          isScrapingActive: true,
          activeTimer: true,
          messageState: "processInProgress",
          remaining: MAX_TIME / 1000,
        });
      } else {
        setMessageState("loginRequired");
      }
    });
  }, []);

  /**
   * Stops the scraping process and updates state accordingly.
   */
  const handleStop = useCallback(() => {
    chrome.runtime.sendMessage({ action: "stopScraping" }, () => {
      setProcessState("start");
      setShowStopButton(false);
      setMessageState("manuallyStopped");
      chrome.storage.local.set({
        isScrapingActive: false,
        activeTimer: false,
        remaining: 0,
        messageState: "manuallyStopped",
      });

      setTimeout(() => {
        checkTabsStatus();
      }, MESSAGE_RESET_DELAY);
    });
  }, [checkTabsStatus]);

  /**
   * Sets an interval to periodically check the status of required tabs.
   */
  useEffect(() => {
    const tabCheckInterval = setInterval(checkTabsStatus, 5000);

    return () => {
      clearInterval(tabCheckInterval);
    };
  }, [checkTabsStatus]);

  return (
    <div className="w-[420px] h-[585px] flex flex-col items-center bg-[#F5F8FA]">
      <div className="flex flex-col items-center justify-around  w-[420px] h-[527px] border border-[#E3E3E3]">
        <div className="flex flex-row justify-between items-center w-full px-4 pt-4">
          <div className="justify-between flex flex-row items-center w-full  mb-[10px] ">
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

        <div className="flex flex-row justify-start w-full border-b-[1px] h-[48px]">
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
          <div className="flex flex-col items-center h-[410px] w-full px-4">
            <div className="mt-[24px] mb-[22.5px] ">
              <Toggle checked={isToggleActive} onChange={handleToggleChange} />
            </div>
            <ActionMessage showMessage={processState} />
            <PullStatusMessage processState={processState} />
            <div
              className={`flex flex-col items-center mt-4 ${
                showStopButton ? "space-y-[13.5px]" : "space-y-[16px]"
              }`}
            >
              <StartButton
                onStart={handleStart}
                processState={processState}
                maxTime={MAX_TIME}
              />
              <div className="mt-4 w-[388px]">
                <Message processState={messageState} />
              </div>
              <div className="mt-4">
                {showStopButton && <StopPulls onClick={handleStop} />}
              </div>
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
