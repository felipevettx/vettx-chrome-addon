export function Message({ processState }) {
  let message;
  let containerStyle = "rounded-[12px] p-4";
  let textColor = "text-[#007CC4]";
  let iconSrc = "icons/exclamationIcon.svg";

  switch (processState) {
    case "noExecution":
      containerStyle += " bg-[#A1DBFF80]";
      message = (
        <p className={`text-xs ${textColor} text-center`}>
          Two tabs will open in your browser—one for VETTX and another for
          Facebook. Please keep both tabs open until the process finishes;
          closing them will stop the process.
        </p>
      );
      break;
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
    case "facebookClosed":
    case "vettxClosed":
      containerStyle += " bg-[#FDBCC280]";
      textColor = "text-[#F82032]";
      iconSrc = "icons/exclamationAlertIcon.svg";
      message = (
        <p className={`text-xs ${textColor} text-center`}>
          {processState === "manuallyStopped"
            ? "The process was stopped manually. To continue, please start it again."
            : processState === "facebookClosed"
            ? "The process stopped because the Facebook tab was closed. Please start the process to proceed."
            : "The process stopped because the VETTX tab was closed. Please start the process to proceed."}
        </p>
      );
      break;
    default:
      return null;
  }

  return (
    <div className={`flex flex-row items-center w-full ${containerStyle}`}>
      <img src={iconSrc} alt="Info Icon" className="mb-2 mr-2" />
      {message}
    </div>
  );
}
