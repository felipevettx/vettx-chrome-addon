import { useState } from "react";

export function StopPulls() {
  const [stop, setStop] = useState(false);
  return (
    <div className="text-[#ACACAC] hover:text-[#009BF5] text-sm transform-color ease-in-out duration-300 cursor-pointer font-dmSans">
      <h3 className="underline">Do you need stop pull?</h3>
    </div>
  );
}
