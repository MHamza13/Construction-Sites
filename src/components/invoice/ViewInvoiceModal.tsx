"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  User,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  ChevronDown,
} from "lucide-react";
import { DateTime } from "luxon";

const UK_TIMEZONE = "Europe/London";

/**
 * Convert UTC → UK Local Time (auto BST/GMT)
 */
export const formatDateToUK = (
  dateStr: string | undefined,
  formatStr: string = "dd MMM yyyy, hh:mm a"
): string => {
  if (!dateStr) return "—";

  try {
    let isoString: string;
    if (dateStr.includes("T")) {
      isoString = dateStr;
    } else {
      const cleaned = dateStr.split(".")[0].replace(" ", "T");
      isoString = `${cleaned}Z`;
    }

    const dt = DateTime.fromISO(isoString, { zone: "utc" });
    if (!dt.isValid) return "Invalid";

    const ukDt = dt.setZone(UK_TIMEZONE);
    return ukDt.toFormat(formatStr);
  } catch (err) {
    console.error("formatDateToUK Error:", err);
    return "Invalid";
  }
};

/** Only Date (UK) */
export const formatDateOnlyUK = (dateStr?: string): string =>
  formatDateToUK(dateStr, "dd MMM yyyy");

/** Only Time (UK, 12-hour format with AM/PM) */
export const formatTimeOnlyUK = (dateStr?: string): string =>
  formatDateToUK(dateStr, "hh:mm a");

// --- Type Definitions ---
interface Worker {
  id?: string | number;
  name?: string;
  email?: string;
}

interface InvoiceTotals {
  totalHours?: number;
  totalRegularHours?: number;
  totalOvertimeHours?: number;
  totalRegularPay?: number;
  totalOvertimePay?: number;
  totalShifts?: number;
  totalPay?: number;
}

interface ShiftDetail {
  shiftId: string | number;
  date: string;
  checkIn?: string;
  endShift?: string;
  adjustedHours?: number;
  calculatedHours?: number;
  dailyWage?: number;
  payData?: {
    totalPay?: number;
  };
}

interface Invoice {
  invoiceid: string | number;
  workerId: string | number;
  workerName: string;
  email?: string;
  ShiftDetails?: ShiftDetail[];
  payPeriod?: string;
  approval?: string;
  payment?: string;
  internalNotes?: string;
  totals: InvoiceTotals;
}

interface ViewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  worker: Worker | null;
}

export default function ViewInvoiceModal({
  isOpen,
  onClose,
  invoice,
  worker,
}: ViewInvoiceModalProps) {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const groupedShifts = useMemo(() => {
    if (!invoice?.ShiftDetails) return {};

    return invoice.ShiftDetails.reduce((acc, shift) => {
      const dateKey = shift.date.split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(shift);
      return acc;
    }, {} as Record<string, ShiftDetail[]>);
  }, [invoice]);

  useEffect(() => {
    if (isOpen && Object.keys(groupedShifts).length > 0) {
      setOpenAccordion(Object.keys(groupedShifts)[0]);
    } else if (!isOpen) {
      setOpenAccordion(null);
    }
  }, [isOpen, groupedShifts]);

  if (!isOpen || !invoice || !worker) return null;

  const toggleAccordion = (dateKey: string) => {
    setOpenAccordion(openAccordion === dateKey ? null : dateKey);
  };

  const getStatusColor = (status?: string) => {
    const s = status?.toLowerCase() || "unknown";
    switch (s) {
      case "approved":
      case "paid":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-800 dark:text-green-100 dark:border-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 dark:border-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-800 dark:text-red-100 dark:border-red-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700";
    }
  };

  const workerFullName = worker.name || "Unknown Worker";
  const workerInitials =
    workerFullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "W";

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 dark:bg-white/10 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Invoice Details</h2>
              <p className="text-blue-100 dark:text-blue-200 text-sm">
                Invoice #{invoice.invoiceid} - {workerFullName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="w-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side */}
            <div className="space-y-6">
              {/* Worker Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-5">
                <div className="flex items-center space-x-3 mb-4">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Worker Information
                  </h3>
                </div>
                <div className="flex items-center space-x-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg
                    bg-gradient-to-br from-blue-400 to-purple-500 
                    text-white dark:from-blue-600 dark:to-purple-700 dark:text-gray-100"
                  >
                    {workerInitials}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                      {workerFullName}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      ID: #{worker.id || "N/A"}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {worker.email || invoice.email || "No email"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-5">
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Invoice Details
                  </h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Pay Period:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {invoice.payPeriod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Invoice ID:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      #{invoice.invoiceid}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Payment:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        invoice.payment
                      )}`}
                    >
                      {invoice.payment || "Not Set"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-5">
                <div className="flex items-center space-x-3 mb-4">
                  <DollarSign className="h-5 w-5 text-amber-400 dark:text-amber-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Amount Breakdown
                  </h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Total Shifts:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {invoice.totals?.totalShifts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-gray-900 dark:text-gray-100 font-bold text-base">
                      Total Amount:
                    </span>
                    <span className="font-bold text-blue-700 dark:text-blue-400 text-lg">
                      €{(invoice.totals?.totalPay || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="space-y-6">
              {/* Shift Details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center space-x-3 mb-4">
                  <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Shift Details ({invoice.ShiftDetails?.length || 0})
                  </h3>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {Object.keys(groupedShifts).length > 0 ? (
                    Object.entries(groupedShifts).map(([dateKey, shifts]) => {
                      const dailyTotalAdjustedHours = shifts.reduce(
                        (sum, s) =>
                          sum + (s.adjustedHours || s.calculatedHours || 0),
                        0
                      );
                      const dailyOvertimeHours = Math.max(0, dailyTotalAdjustedHours - 8);
                      const dailyRegularHours = dailyTotalAdjustedHours - dailyOvertimeHours;
                      const dailyTotalPay = shifts.reduce(
                        (sum, s) => sum + (s.payData?.totalPay || 0),
                        0
                      );

                      return (
                        <div
                          key={dateKey}
                          className="border rounded-lg overflow-hidden transition-all duration-300"
                        >
                          <button
                            onClick={() => toggleAccordion(dateKey)}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none text-left"
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                                {formatDateOnlyUK(dateKey + "T00:00:00")}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {shifts.length} {shifts.length > 1 ? "Shifts" : "Shift"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                                €{dailyTotalPay.toFixed(2)}
                              </span>
                              <ChevronDown
                                size={20}
                                className={`text-gray-500 dark:text-gray-400 transition-transform duration-300 ${
                                  openAccordion === dateKey ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </button>

                          {openAccordion === dateKey && (
                            <div className="border-t bg-white dark:bg-gray-900">
                              {/* Daily Summary */}
                              <div className="bg-gray-50/50 dark:bg-gray-800/50 p-3 text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-300">Adjusted Hours:</span>
                                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                                    {dailyTotalAdjustedHours.toFixed(2)}h
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-300">Regular Hours:</span>
                                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    {dailyRegularHours.toFixed(2)}h
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-300">Overtime:</span>
                                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                                    {dailyOvertimeHours.toFixed(2)}h
                                  </span>
                                </div>
                                <div className="flex justify-between mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                                  <span className="font-bold text-gray-700 dark:text-gray-100">
                                    Total Pay for Day:
                                  </span>
                                  <span className="font-bold text-green-700 dark:text-green-400 text-lg">
                                    €{dailyTotalPay.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {/* Individual Shifts */}
                              <div className="p-4 space-y-4">
                                {shifts.map((shift) => {
                                  const shiftPay = shift.payData?.totalPay ?? 0;
                                  const hoursWorked = (shift.adjustedHours || shift.calculatedHours || 0).toFixed(2);

                                  return (
                                    <div
                                      key={shift.shiftId}
                                      className="text-sm border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0"
                                    >
                                      {/* Shift ID + Pay */}
                                      <div className="flex justify-between font-semibold text-gray-700 dark:text-gray-100 mb-1.5">
                                        <span>Shift ID: {shift.shiftId}</span>
                                        <span className="text-green-600 dark:text-green-400">
                                          €{shiftPay.toFixed(2)}
                                        </span>
                                      </div>

                                      {/* Time & Hours */}
                                      <div className="space-y-1 text-gray-600 dark:text-gray-300">
                                        <div className="flex justify-between">
                                          <span>Time:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-100">
                                            {formatTimeOnlyUK(shift.checkIn)} - {formatTimeOnlyUK(shift.endShift)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Hours Worked:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-100">
                                            {hoursWorked}h
                                          </span>
                                        </div>
                                      </div>

                                      {/* Individual Shift Pay */}
                                      <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-gray-300 dark:border-gray-600">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                          Pay for this shift:
                                        </span>
                                        <span className="font-bold text-green-600 dark:text-green-400">
                                          €{shiftPay.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                      No shift details available.
                    </p>
                  )}
                </div>
              </div>

              {/* Internal Notes */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
                <div className="flex items-center space-x-3 mb-4">
                  <FileText className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Internal Notes
                  </h3>
                </div>
                {invoice.internalNotes ? (
                  <p className="text-gray-700 dark:text-gray-200 text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600">
                    {invoice.internalNotes}
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No notes provided.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-t dark:border-gray-700 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}