import { useState, useEffect } from "react";
import PropTypes from "prop-types";
export function ActionMessage({ showMessage }) {
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setMessage(getMessageContent(showMessage));
      setIsVisible(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [showMessage]);

  function getMessageContent(state) {
    switch (state) {
      case "start":
        return (
          <div className="flex flex-row items-center justify-center">
            <p className="mr-2 font-bold font-dmSans text-2xl">
              Let&apos;s begin the next pull!
            </p>
            <img src="icons/rocket.png" alt="Rocket icon" className="w-6 h-6" />
          </div>
        );
      case "inProcess":
        return (
          <div className="flex flex-row items-center justify-center">
            <p className="mr-2 font-bold font-dmSans text-2xl">
              New listings are on the way!
            </p>
            <img src="icons/car.png" alt="Car icon" className="w-6 h-6" />
          </div>
        );
      default:
        return <p>No message available</p>;
    }
  }

  return (
    <div
      className={`
        text-center  transition-opacity duration-300 ease-in-out
        ${isVisible ? "opacity-100" : "opacity-0"}
      `}
    >
      {message}
    </div>
  );
}

ActionMessage.propTypes = {
  showMessage: PropTypes.string.isRequired,
};
