"use client";

import React from "react";

// ✅ Define the type for the view mode
type ViewType = "daily" | "weekly";

// ✅ Define component props interface
interface DateSelectorProps {
  selectedDate: string;
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
  view: ViewType;
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
}

export default function DateSelector({
  selectedDate,
  setSelectedDate,
  view,
  setView,
}: DateSelectorProps) {
  return (
    <div className="bg-white rounded-md shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* ✅ Date Picker */}
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Select Date</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 shadow-sm 
                       focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 
                       cursor-pointer transition-all text-gray-700 hover:border-blue-400"
          />
        </div>

        {/* ✅ View Toggle Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setView("daily")}
            className={`px-5 py-2 rounded-md font-medium cursor-pointer transition-all duration-200 
              ${
                view === "daily"
                  ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Daily View
          </button>

          <button
            onClick={() => setView("weekly")}
            className={`px-5 py-2 rounded-md font-medium cursor-pointer transition-all duration-200 
              ${
                view === "weekly"
                  ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Weekly View
          </button>
        </div>
      </div>
    </div>
  );
}
