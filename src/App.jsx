import { useEffect, useState, useCallback } from "react";
import "./App.css";
import { ActionMessage } from "./components/actionMessage/ActionMessage";
import { Button } from "./components/button/Button";
import { Message } from "./components/message/Message";
import { StartButton } from "./components/startButton/StartButton";
import { StopPulls } from "./components/stopPull/StopPulls";
import { Toggle } from "./components/toggle/Toggle";
import { PullStatusMessage } from "./components/pullStatus/PullStatusMessage";
import { RingTimer } from "./components/ringLoader/RingTimer";

function App() {
  const [selectedTab, setSelectedTab] = useState("Listings");
  const [processState, setProcessState] = useState("start");
  const [showStopButton, setShowStopButton] = useState(false);
  const [messageState, setMessageState] = useState("noExecution");

  const updateState = useCallback((newState) => {
    setProcessState(newState);
    chrome.storage.local.set({ processState: newState });
  }, []);

  useEffect(() => {
    setSelectedTab("Listings");
  }, []);

  useEffect(() => {
    const loadInitialState = async () => {
      const result = await chrome.storage.local.get([
        "processState",
        "isScrapingActive",
        "messageState",
      ]);
      if (result.processState) updateState(result.processState);
      if (result.isScrapingActive !== undefined)
        setShowStopButton(result.isScrapingActive);
      if (result.messageState) setMessageState(result.messageState);
    };

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
  }, [updateState]);

  const handleStart = useCallback(() => {
    console.log("Start button clicked");
    chrome.runtime.sendMessage({ action: "openMultipleTabs" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        setMessageState("error");
      } else if (response && response.loggedIn) {
        updateState("inProcess");
        setMessageState("processInProgress");
        setShowStopButton(true);
        chrome.storage.local.set({
          isScrapingActive: true,
          activeTimer: true,
          messageState: "processInProgress",
        });
      } else {
        setMessageState("loginRequired");
      }
    });
  }, [updateState]);

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
        }
      });
    };

    const intervalId = setInterval(checkTabsStatus, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [processState, handleStop]);

  return (
    <div
      className="w-[420px] h-[600px] flex flex-col items-center justify-around bg-[#F5F8FA] px-2"
      style={{ width: "420px", height: "635px" }}
    >
      <div className="flex flex-col items-center justify-around bg-white rounded-b-[12px] w-[420px] h-[539px] border border-[#E3E3E3] p-4">
        <div className="flex flex-row justify-between items-center w-full px-4">
          <img
            src="icons/vettxLogo.svg"
            alt="VETTX Logo"
            className="w-[132px] h-[32px]"
          />
          <div className="flex flex-col w-[142px] h-[44px]">
            <h3 className="text-base font-hkg text-right">Chrome</h3>
            <h3 className="text-[22px] font-bold font-hkg text-right">
              Add On
            </h3>
          </div>
        </div>

        <div className="flex flex-row justify-start w-full mb-4 border-b-[1px] border-[#E3E3E3]">
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
          <div className="flex flex-col items-center">
            <RingTimer />
            <Toggle />
            <div className="flex flex-col items-center">
              <ActionMessage showMessage={processState} />
              <PullStatusMessage />
            </div>
            <StartButton onStart={handleStart} processState={processState} />
            <div className="mt-4">
              <Message processState={messageState} />
            </div>
            {showStopButton && <StopPulls onClick={handleStop} />}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full py-4 px-6 bg-[#F1F3F5] border border-[#E3E3E3] rounded-lg shadow-md">
            <div className="flex items-center flex-col space-y-3">
              <div className="w-8 h-8 animate-spin border-4 border-[#E3E3E3] border-t-4 border-t-[#4F8DFF] rounded-full"></div>
              <p className="text-[#727272] text-lg font-semibold text-center">
                This feature is under construction. Please check back later!
              </p>
              <p className="text-xl">🚧</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-[#BABABA] text-center font-dmSans">
        To seamlessly track and follow up on messages using the VETTX
        Marketplace app, please keep both Facebook Marketplace and VETTX open
        and logged in. This ensures real-time updates and efficient conversation
        management. By using this tool, you grant VETTX access to your Facebook
        inbox messages for syncing with the platform.
      </p>
      <p className="text-[10px] text-[#919191] text-center font-dmSans">
        Copyright © 2024 VETTX. All rights reserved.
      </p>
    </div>
  );
}

export default App;
