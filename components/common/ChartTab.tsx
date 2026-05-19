import React from "react";

export type ChartRangePreset = "monthly" | "quarterly" | "annually" | "custom";

interface ChartTabProps {
  value: ChartRangePreset;
  onChange: (preset: "monthly" | "quarterly" | "annually") => void;
}

const ChartTab: React.FC<ChartTabProps> = ({ value, onChange }) => {
  const getButtonClass = (option: "monthly" | "quarterly" | "annually") =>
    value !== "custom" && value === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900   dark:hover:text-white ${getButtonClass(
          "monthly"
        )}`}
      >
        30 days
      </button>

      <button
        type="button"
        onClick={() => onChange("quarterly")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900   dark:hover:text-white ${getButtonClass(
          "quarterly"
        )}`}
      >
        90 days
      </button>

      <button
        type="button"
        onClick={() => onChange("annually")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900   dark:hover:text-white ${getButtonClass(
          "annually"
        )}`}
      >
        365 days
      </button>
    </div>
  );
};

export default ChartTab;
