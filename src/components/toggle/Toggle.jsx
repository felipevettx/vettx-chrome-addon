import { FaCheck } from "react-icons/fa";
import { useState } from "react";

export function Toggle({ checked, onChange }) {
  const handleToggle = () => {
    onChange(!checked);
  };

  return (
    <label
      className="inline-flex items-center cursor-pointer gap-2"
      onClick={handleToggle}
    >
      <div
        className={`relative w-[40px] h-[20px] ${
          checked ? "bg-[#2BBF7A]" : "bg-gray-200"
        } rounded-full transition-colors p-[2px]`}
      >
        <div
          className={`absolute top-[2px] ${
            checked ? "left-[22px]" : "left-[2px]"
          } flex items-center justify-center bg-white rounded-full h-4 w-4 transition-all`}
        >
          {checked && <FaCheck className="text-[#2BBF7A] text-[10px]" />}
        </div>
      </div>
      <span className="text-sm text-[#919191] font-dmSans leading-[18.23px]">
        Automatic pulls
      </span>
    </label>
  );
}
