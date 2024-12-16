import { FaCheck } from "react-icons/fa";
import { useState } from "react";

export function Toggle() {
  const [checked, setChecked] = useState(false);

  return (
    <label
      className="inline-flex items-center cursor-pointer gap-4"
      onClick={() => setChecked(!checked)}
    >
      <div
        className={`relative w-10 h-5 ${
          checked ? "bg-[#2BBF7A]" : "bg-gray-200"
        } rounded-full transition-colors`}
      >
        <div
          className={`absolute top-[2px] ${
            checked ? "left-[22px]" : "left-[2px]"
          } flex items-center justify-center bg-white border-gray-300 border rounded-full h-4 w-4 transition-all`}
        >
          {checked && <FaCheck className="text-[#2BBF7A] text-[10px]" />}
        </div>
      </div>
      <span className="text-sm text-[#919191] font-dmSans">
        Automatic pulls
      </span>
    </label>
  );
}
