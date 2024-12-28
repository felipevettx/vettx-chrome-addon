import React from "react";

/**
 * Message Component
 *
 * Displays a contextual message based on the current state of the process.
 * Each state customizes the appearance, icon, and message content to inform users about
 * the process's progress, errors, or requirements.
 *
 * @param {Object} props - Component props.
 * @param {string} props.processState - Current state of the process. Determines the displayed message and style.
 *
 * States handled:
 * - "initial", "tabsClosed": Inform the user that two tabs will open and should remain open during the process.
 * - "noExecution", "start", "processInProgress", "tabsOpen": Remind the user to keep the tabs open.
 * - "manuallyStopped": Notify that the process was manually stopped and needs to be restarted.
 * - "facebookClosed", "vettxClosed": Indicate which specific tab was closed and stopped the process.
 * - "success": Congratulate the user on successfully completing the process.
 * - "error": Notify that an error occurred.
 * - "loginRequired": Prompt the user to log in to both VETTX and Facebook.
 *
 * @returns {JSX.Element} A styled message box with an icon and text, or `null` for unknown states.
 */

export function Message({ processState }) {
  let message;
  let containerStyle = "rounded-[12px] px-[10px] py-[12px] w-full  w-[388px]";
  let textColor = "text-[#007CC4]";
  let iconSrc = "icons/leadingIcon.png";

  switch (processState) {
    case "initial":
    case "tabsClosed":
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
    case "tabsOpen":
      containerStyle += " bg-[#A1DBFF80]";
      message = (
        <p className={`text-xs ${textColor} text-left`}>
          Keep both the VETTX and Facebook tabs open until the process finishes;
          closing them will stop the process.
        </p>
      );
      break;
    case "manuallyStopped":
      containerStyle += " bg-[#FDBCC280] w-[388px] ";
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
