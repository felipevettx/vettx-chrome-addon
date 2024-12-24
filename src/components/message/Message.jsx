import React from "react";

export function Message({ processState }) {
  let message;
  let containerStyle = "rounded-[12px] px-[10px] py-[12px] w-full  w-[388px]";
  let textColor = "text-[#007CC4]";
  let iconSrc = "icons/leadingIcon.png";

  switch (processState) {
    case "initial":
      containerStyle += " bg-[#A1DBFF80]";
      message = (
        <p className={`text-xs ${textColor} text-left`}>
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
        <p className={`text-xs ${textColor} text-left`}>
          Keep both the VETTX and Facebook tabs open until the process finishes;
          closing them will stop the process.
        </p>
      );
      break;
    case "manuallyStopped":
      containerStyle += " bg-[#FDBCC280] w-full";
      textColor = "text-[#F82032]";
      iconSrc = "icons/leadingIconError.png";
      message = (
        <p className={`text-xs ${textColor} text-left`}>
          <span>
            The process was stopped manually. To continue,
            <br />
            <span>please start it again.</span>
          </span>
        </p>
      );
      break;
    case "facebookClosed":
    case "vettxClosed":
      containerStyle += " bg-[#FDBCC280] w-full";
      textColor = "text-[#F82032]";
      iconSrc = "icons/leadingIconError.png";
      message = (
        <p className={`text-xs ${textColor} text-left`}>
          {processState === "facebookClosed"
            ? "The process stopped because the Facebook tab was closed. Please start the process to proceed."
            : "The process stopped because the VETTX tab was closed. Please start the process to proceed."}
        </p>
      );
      break;
    case "success":
      containerStyle += " bg-[#D1FAE5]";
      message = (
        <p className={`text-xs ${textColor} text-left font-bold`}>
          Process completed successfully!
        </p>
      );
      break;
    case "error":
      containerStyle += " bg-[#FECACA]";
      textColor = "text-[#F82032]";
      message = (
        <p className={`text-xs ${textColor} text-left font-bold`}>
          An error occurred. Please try again later.
        </p>
      );
      break;
    case "loginRequired":
      containerStyle += " bg-[#FDBCC280] w-full";
      textColor = "text-[#F82032]";
      iconSrc = "icons/leadingIconError.png";
      message = (
        <p className={`text-xs ${textColor} text-left`}>
          Please log in to both VETTX and Facebook to continue the process.
        </p>
      );
      break;
    default:
      return null;
  }

  return (
    <div className={`flex flex-row items-center gap-[10px] ${containerStyle}`}>
      <img src={iconSrc} alt="Info Icon" className="" />
      {message}
    </div>
  );
}
