import "./App.css";
import { ActionMessage } from "./components/actionMessage/ActionMessage";
import { Button } from "./components/button/Button";
import { Message } from "./components/message/Message";
import { StartButton } from "./components/startButton/StartButton";
import { StopPulls } from "./components/stopPull/StopPulls";
import { Toggle } from "./components/toggle/Toggle";
import { useState } from "react";
function App() {
  const [processState, setProcessState] = useState("start");
  const [showStopButton, setShowStopButton] = useState(false);
  const [message, setMessage] = useState("noExecution");
  const handleStart = () => {
    setProcessState("inProcess");
    setMessage("processInProgress");
    setShowStopButton(true);
  };

  const handleStop = () => {
    setProcessState("start");
    setMessage("noExecution");
    setShowStopButton(false);
  };
  return (
    <div className="w-[420px] h-[653px] flex flex-col items-center bg-[#F5F8FA]">
      <div className="flex flex-col items-center bg-white rounded-b-[12px] w-[420px] h-[539px] border border-[#E3E3E3] p-2 ">
        <div className="flex flex-row justify-between items-center w-full px-4">
          <img src="icons/vettxLogo.svg" alt="VETTX Logo w-[132px] h-[32px]" />
          <div className="flex flex-col w-[142px] h-[44px] ">
            <h3 className="text-base font-hkg text-right">Chrome</h3>
            <h3 className="text-[22px] font-bold font-hkg text-right">
              Add On
            </h3>
          </div>
        </div>
        <div className="flex justify-start">
          <Button text={"Linstings"} />
          <Button text={"Message syncing"} />
        </div>
        <Toggle />
        <ActionMessage showMessage={processState} />
        <StartButton onStart={handleStart} processState={processState} />
        <Message processState={message} />
        {showStopButton && <StopPulls onClick={handleStop} />}
      </div>
      <p className="text-[10px] text-[#BABABA] text-center font-dmSans">
        To seamlessly track and follow up on messages using the VETTX
        Marketplace app, please keep both Facebook Marketplace and VETTX open
        and logged in. This ensures real-time updates and efficient conversation
        management.. By using this tool, you grant VETTX access to your Facebook
        inbox messages for syncing with the platform.
      </p>
      <p className="text-[10px] text-[#BABABA] text-center font-dmSans">
        Copyright © 2024 VETTX. All rights reserved.
      </p>
    </div>
  );
}

export default App;
