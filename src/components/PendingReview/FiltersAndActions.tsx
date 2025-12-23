"use client";

import { Search, RotateCcw, Calendar } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { DateTime } from "luxon";
import { formatDateOnlyUK } from "@/utils/date";

const UK_TIMEZONE = "Europe/London";

interface FiltersAndActionsProps {
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  searchInput: string;
  setSearchInput: React.Dispatch<React.SetStateAction<string>>;
  showCustomDateRange: boolean;
  setShowCustomDateRange: React.Dispatch<React.SetStateAction<boolean>>;
  fromDate: string;
  setFromDate: React.Dispatch<React.SetStateAction<string>>;
  toDate: string;
  setToDate: React.Dispatch<React.SetStateAction<string>>;
  filterStatus: string;
  resetFilters: () => void;
}

const FiltersAndActions: React.FC<FiltersAndActionsProps> = ({
  statusFilter,
  setStatusFilter,
  searchInput,
  setSearchInput,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  filterStatus,
  resetFilters,
}) => {
  const [localFilterStatus, setLocalFilterStatus] = useState(filterStatus);
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  // === DEFAULT: UK TODAY & LAST 7 DAYS ===
  useEffect(() => {
    const nowUK = DateTime.now().setZone(UK_TIMEZONE);
    const todayUK = nowUK.toFormat("yyyy-MM-dd");
    const last7DaysUK = nowUK.minus({ days: 7 }).toFormat("yyyy-MM-dd");

    if (!fromDate) setFromDate(last7DaysUK);
    if (!toDate) setToDate(todayUK);
  }, [fromDate, toDate, setFromDate, setToDate]);

  useEffect(() => {
    setLocalFilterStatus(filterStatus);
  }, [filterStatus]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    return formatDateOnlyUK(dateStr);
  };

  const filterStatusText = useCallback(() => {
    let count = 0;
    try {
      const match = localFilterStatus.match(/Showing:\s*(\d+)/);
      count = match ? parseInt(match[1], 10) : 0;
    } catch {
      count = 0;
    }

    let statusText = `Showing: ${count} worker${count !== 1 ? "s" : ""}`;
    if (statusFilter !== "all") statusText += ` with status "${statusFilter}"`;
    if (searchInput.trim()) statusText += ` matching "${searchInput.trim()}"`;
    if (fromDate && !toDate)
      statusText += ` on ${formatDateDisplay(fromDate)}`;
    else if (fromDate && toDate)
      statusText += ` from ${formatDateDisplay(fromDate)} to ${formatDateDisplay(toDate)}`;

    return statusText;
  }, [localFilterStatus, statusFilter, searchInput, fromDate, toDate]);

  const openDatePicker = (inputRef: React.RefObject<HTMLInputElement>) => {
    inputRef.current?.showPicker?.();
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    if (toDate && value && toDate < value) {
      setToDate(value);
    }
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
  };

  const handleReset = () => {
    const nowUK = DateTime.now().setZone(UK_TIMEZONE);
    const todayUK = nowUK.toFormat("yyyy-MM-dd");
    const last7DaysUK = nowUK.minus({ days: 7 }).toFormat("yyyy-MM-dd");

    setFromDate(last7DaysUK);
    setToDate(todayUK);
    setStatusFilter("all");
    setSearchInput("");
    resetFilters();
  };

  const maxDateUK = DateTime.now().setZone(UK_TIMEZONE).toFormat("yyyy-MM-dd");

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
      <div className="space-y-6">
        {/* Pay Period Filter Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-5 border dark:border-gray-600 border-blue-100">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center mr-3">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              Pay Period Filter
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* From Date */}
            <div className="cursor-pointer" onClick={() => openDatePicker(fromDateRef)}>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
                <input
                  ref={fromDateRef}
                  type="date"
                  value={fromDate}
                  onChange={(e) => handleFromDateChange(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors duration-300"
                  max={maxDateUK}
                />
              </div>
            </div>

            {/* To Date */}
            <div className="cursor-pointer" onClick={() => openDatePicker(toDateRef)}>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
                <input
                  ref={toDateRef}
                  type="date"
                  value={toDate}
                  onChange={(e) => handleToDateChange(e.target.value)}
                  min={fromDate || undefined}
                  max={maxDateUK}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors duration-300"
                />
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-3 pt-3 border-t border-blue-100 dark:border-gray-600">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded-full">
              {filterStatusText()}
            </span>
          </div>
        </div>

        {/* Search + Status Filter */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 gap-4">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 flex-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-200 shadow-sm transition-all duration-200 min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="processed">Processed</option>
            </select>

            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search worker..."
                className="w-full px-4 py-2.5 pl-10 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 bg-white dark:bg-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersAndActions;
