import React from "react";

export function Message({ processState }) {
  let message;
  let containerStyle = "rounded-[12px] p-4";
  let textColor = "text-[#007CC4]";
  let iconSrc = "icons/exclamationIcon.svg";

  switch (processState) {
    case "initial":
      containerStyle += " bg-[#A1DBFF80]";
      message = (
        <p className={`text-xs ${textColor} text-center`}>
          Two tabs will open in your browser—one for VETTX and another for
          Facebook. Please keep both tabs open until the process finishes;
          closing them will stop the process.
        </p>
      );
      break;
    case "noExecution":
    case "start":
    case "processInProgress":
      containerStyle += " bg-[#A1DBFF80]";
      message = (
        <p className={`text-xs ${textColor} text-center`}>
          Keep both the VETTX and Facebook tabs open until the process finishes;
          closing them will stop the process.
        </p>
      );
      break;
    case "manuallyStopped":
      containerStyle += " bg-[#FDBCC280]";
      textColor = "text-[#F82032]";
      iconSrc = "icons/exclamationAlertIcon.svg";
      message = (
        <p className={`text-xs ${textColor} text-center`}>
          The process was stopped manually. To continue, please start it again.
        </p>
      );
      break;
    case "facebookClosed":
    case "vettxClosed":
      containerStyle += " bg-[#FDBCC280]";
      textColor = "text-[#F82032]";
      iconSrc = "icons/exclamationAlertIcon.svg";
      message = (
        <p className={`text-xs ${textColor} text-center`}>
          {processState === "facebookClosed"
            ? "The process stopped because the Facebook tab was closed. Please start the process to proceed."
            : "The process stopped because the VETTX tab was closed. Please start the process to proceed."}
        </p>
      );
      break;
    case "success":
      containerStyle += " bg-[#D1FAE5]";
      message = (
        <p className={`text-xs ${textColor} text-center font-bold`}>
          Process completed successfully!
        </p>
      );
      break;
    case "error":
      containerStyle += " bg-[#FECACA]";
      textColor = "text-[#F82032]";
      message = (
        <p className={`text-xs ${textColor} text-center font-bold`}>
          An error occurred. Please try again later.
        </p>
      );
      break;
    default:
      return null;
  }

  return (
    <div className={`flex flex-row items-center ${containerStyle}`}>
      <img src={iconSrc} alt="Info Icon" className="mb-2 mr-2" />
      {message}
    </div>
  );
}
