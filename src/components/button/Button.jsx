import React, { useState } from "react";

export function Button({ text, isSelected, onClick }) {
  return (
    <button
      className={`text-base font-medium font-dmSans px-4 py-1 transition-all ${
        isSelected
          ? "text-[#009BF5] border-b-[2px] border-[#009BF5]"
          : "text-[#727272]"
      }`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
