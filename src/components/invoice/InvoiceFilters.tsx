"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import Swal from "sweetalert2";
import {
  Search,
  FileCheck2,
  CreditCard,
  Users,
  Calendar,
  XCircle,
} from "lucide-react";

// --- Type Definitions ---
interface InvoiceFiltersProps {
  onFilterChange: (filters: FiltersState) => void;
}

interface FiltersState {
  status: string;
  payment: string;
  worker: string;
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  search: string;
}

// --- Component ---
export default function InvoiceFilters({ onFilterChange }: InvoiceFiltersProps) {
  const dispatch = useDispatch<AppDispatch>();
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  const {
    items: workers,
    loading: workersLoading,
    error: workersError,
  } = useSelector((state: RootState) => state.workers);

  const [filters, setFilters] = useState<FiltersState>({
    status: "",
    payment: "",
    worker: "",
    from: "",
    to: "",
    search: "",
  });

  // Fetch workers on mount
  useEffect(() => {
    dispatch(fetchWorkers())
      .unwrap()
      .catch(() =>
        Swal.fire({
          icon: "error",
          title: "Failed to Load Workers",
          text: "Unable to fetch workers from the server. Please try again.",
          confirmButtonColor: "#dc2626",
        })
      );
  }, [dispatch]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };

    // Date validation
    if (name === "from" && filters.to && value > filters.to) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Date Range",
        text: "'From' date cannot be after 'To' date.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }
    if (name === "to" && filters.from && value < filters.from) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Date Range",
        text: "'To' date cannot be before 'From' date.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: FiltersState = {
      status: "",
      payment: "",
      worker: "",
      from: "",
      to: "",
      search: "",
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  // Open native date picker
  const openDatePicker = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.showPicker?.();
  };

  // Max date = today
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="w-full mx-auto relative">
      <div className="absolute inset-0 rounded-2xl -z-10"></div>

      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg shadow-sm">
              <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Filter Invoices
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Refine your invoice search with multiple criteria
              </p>
            </div>
          </div>
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            <XCircle className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-300" />
            Clear Filters
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Search Input */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Search Invoices
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                name="search"
                placeholder="Search by worker name or invoice ID..."
                value={filters.search}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Payment Status
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <select
                name="payment"
                value={filters.payment}
                onChange={handleChange}
                className="w-full pl-10 pr-8 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 appearance-none"
              >
                <option value="">All Payments</option>
                <option value="Paid">Paid</option>
                <option value="UnPaid">Unpaid</option>
              </select>
            </div>
          </div>

          {/* Worker Select */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Worker
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <select
                name="worker"
                value={filters.worker}
                onChange={handleChange}
                disabled={workersLoading || !!workersError}
                className="w-full pl-10 pr-8 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">
                  {workersLoading
                    ? "Loading..."
                    : workersError
                    ? "Error loading"
                    : "All Workers"}
                </option>
                {workers.map((w) => (
                  <option key={w.id} value={`${w.firstName} ${w.lastName}`}>
                    {w.firstName} {w.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range Inputs - Only Date, No Time */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* From Date */}
            <div className="cursor-pointer" onClick={() => openDatePicker(fromDateRef)}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  ref={fromDateRef}
                  type="date"
                  name="from"
                  value={filters.from}
                  onChange={handleChange}
                  max={filters.to || today}
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                />
              </div>
            </div>

            {/* To Date */}
            <div className="cursor-pointer" onClick={() => openDatePicker(toDateRef)}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                To Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  ref={toDateRef}
                  type="date"
                  name="to"
                  value={filters.to}
                  onChange={handleChange}
                  min={filters.from}
                  max={today}
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}