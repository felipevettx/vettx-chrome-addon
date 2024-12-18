import { useEffect, useState, useCallback } from "react";
import "./App.css";
import { ActionMessage } from "./components/actionMessage/ActionMessage";
import { Button } from "./components/button/Button";
import { Message } from "./components/message/Message";
import { StartButton } from "./components/startButton/StartButton";
import { StopPulls } from "./components/stopPull/StopPulls";
import { Toggle } from "./components/toggle/Toggle";

function App() {
  const [processState, setProcessState] = useState("start");
  const [showStopButton, setShowStopButton] = useState(false);
  const [messageState, setMessageState] = useState("noExecution");

  const updateState = useCallback((newState) => {
    setProcessState(newState);
    chrome.storage.local.set({ processState: newState });
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
    <div className="w-[420px] h-[653px] flex flex-col items-center justify-around bg-[#F5F8FA] overflow-hidden">
      <div className="flex flex-col items-center justify-around bg-white rounded-b-[12px] w-[420px] h-[539px] border border-[#E3E3E3] p-2 ">
        <div className="flex flex-row justify-between items-center w-full px-4">
          <img
            src="icons/vettxLogo.svg"
            alt="VETTX Logo"
            className="w-[132px] h-[32px]"
          />
          <div className="flex flex-col w-[142px] h-[44px] ">
            <h3 className="text-base font-hkg text-right">Chrome</h3>
            <h3 className="text-[22px] font-bold font-hkg text-right">
              Add On
            </h3>
          </div>
        </div>
        <div className="flex justify-start">
          <Button text={"Listings"} />
          <Button text={"Message syncing"} />
        </div>
        <Toggle />
        <div className="flex flex-col items-center">
          <ActionMessage showMessage={processState} />
          <h1 className="text-[#919191] text-base ">
            Your latest pull added 322 listings
          </h1>
        </div>
        <StartButton onStart={handleStart} processState={processState} />
        <Message processState={messageState} />
        {showStopButton && <StopPulls onClick={handleStop} />}
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
