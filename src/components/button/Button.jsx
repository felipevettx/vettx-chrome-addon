import React, { useState } from "react";

export function Button({ text, oncCLick, isSelected, onClick }) {
  return (
    <button
      className={`text-[21px] font-dmSans p-2 ${
        isSelected
          ? "text-[#009BF5] border border-b-[2px] border-[#009BF5]"
          : "text-[#727272]"
      }`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
