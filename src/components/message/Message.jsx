export function Message({ processState }) {
  let message;
  let containerStyle = "rounded-[12px] bg-[#A1DBFF80] opacity-50 p-4";
  let exclamationStyle = "text-[#007CC4]";
  let exclamationALertStyle = "text-[#F82032]";
  let textColor = "text-[#007CC4]";

  switch (processState) {
    case "noExecution":
      message = (
        <p className="text-xs text-[#007CC4] text-center">
          Two tabs will open in your browser—one for VETTX and another for
          Facebook. Please keep both tabs open until the process finishes;
          closing them will stop the process.
        </p>
      );
      break;
    case "processInProgress":
      message = (
        <p className="text-xs text-[#007CC4] text-center">
          Keep both the VETTX and Facebook tabs open until the process finishes;
          closing them will stop the process.
        </p>
      );
      break;
    case "manuallyStopped":
      message = (
        <p className="text-xs text-[#F82032] text-center">
          The process was stopped manually. To continue, please start it again.
        </p>
      );
      break;
    case "facebookClosed":
      message = (
        <p className="text-xs text-[#F82032] text-center">
          The process stopped because the Facebook tab was closed. Please start
          the process to proceed.
        </p>
      );
      break;
    case "vettxCLosed":
      message = (
        <p className="text-xs text-[#F82032] text-center">
          The process stopped because the VETTX tab was closed. Please start the
          process to proceed.
        </p>
      );
      break;
    default:
      message = null;
      break;
  }

  return (
    <div className={`flex flex-row items-center ${containerStyle}`}>
      <img src="icons/exclamationIcon.svg" alt="Info Icon" className="mb-2" />
      {message}
    </div>
  );
}
