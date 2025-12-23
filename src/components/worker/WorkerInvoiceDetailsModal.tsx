"use client";

import React, { JSX, useState, useMemo } from "react";
import { X, FileText, Clock, DollarSign } from "lucide-react";

// Interface for ShiftDetail (parsed from shiftJson)
interface ShiftDetail {
  ShiftId: number;
  Date: string;
  CheckIn: string;
  CheckOut: string;
  TotalHours: number;
  AdjustedHours?: number;
  DailyWagesRate?: number | null;
  HourlyRate?: number | null;
  OvertimeRate?: number | null;
}

// Interface for InvoiceDetail
interface InvoiceDetail {
  id: number;
  masterInvoiceId: number;
  invoicePeriod: string;
  dailyWagesRate: number;
  hourlyRate: number;
  dailyHours: number;
  overtimeHours: number;
  adjustedHours: number;
  totalAmount: number;
  totalHours: number;
  shiftJson: string;
  createdOn: string;
  createdBy: number;
  modifiedOn: string | null;
  modifiedBy: number | null;
  isActive: boolean;
  isDeleted: boolean;
}

// Interface for MasterInvoice
interface MasterInvoice {
  id: number;
  workerId: number;
  invoiceStatus: string;
  totalAmount: number;
  totalHours: number;
  invoiceDetails: InvoiceDetail[];
  createdOn: string;
  createdBy: number;
  modifiedOn: string | null;
  modifiedBy: number | null;
  isActive: boolean;
  isDeleted: boolean;
  invoicePdfPath: string | null;
  paymentDate: string | null;
  paymentMethod: string | null;
  paymentNote: string | null;
  paymentSlipPaths: string | null;
  shiftIds: string;
  notes: string;
  dailyWagesRate: number;
  hourlyWagesRate: number;
}

interface WorkerInvoiceDetailsModalProps {
  invoice: MasterInvoice | null;
  onClose: () => void;
}

const STANDARD_WORK_HOURS_PER_DAY = 8;
const DEFAULT_OVERTIME_MULTIPLIER = 1.5;

export default function WorkerInvoiceDetailsModal({
  invoice,
  onClose,
}: WorkerInvoiceDetailsModalProps): JSX.Element {
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

  if (!invoice) return <></>;

  const toggleDate = (date: string) => {
    setExpandedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  // Parse shiftJson for each invoice detail
  const parsedShifts = useMemo(() => {
    return invoice.invoiceDetails.reduce((acc, detail) => {
      try {
        const shifts: ShiftDetail[] = JSON.parse(detail.shiftJson) || [];
        shifts.forEach((shift) => {
          const dateKey = shift.Date.split('T')[0];
          (acc[dateKey] = acc[dateKey] || []).push({
            ...shift,
            AdjustedHours: shift.AdjustedHours ?? shift.TotalHours ?? 0,
          });
        });
      } catch (error) {
        console.error(`Error parsing shiftJson for invoice detail ${detail.id}:`, error);
      }
      return acc;
    }, {} as Record<string, ShiftDetail[]>);
  }, [invoice.invoiceDetails]);

  const dates = useMemo(
    () =>
      Object.keys(parsedShifts).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      ),
    [parsedShifts]
  );

  const calculateDailyTotals = (shifts: ShiftDetail[], detail: InvoiceDetail) => {
    if (!shifts || shifts.length === 0) {
      return {
        totalAdjustedHours: detail.adjustedHours,
        totalOTHours: detail.overtimeHours,
        totalPay: detail.totalAmount,
      };
    }
    const totalAdjustedHours = shifts.reduce(
      (sum, s) => sum + (s.AdjustedHours ?? s.TotalHours ?? 0),
      0
    );
    const dailyOvertimeHours = Math.max(
      0,
      totalAdjustedHours - STANDARD_WORK_HOURS_PER_DAY
    );
    const dailyRegularHours = totalAdjustedHours - dailyOvertimeHours;
    const dailyWagesRate = detail.dailyWagesRate;
    const hourlyRate = detail.hourlyRate;
    const overtimeRate = hourlyRate * DEFAULT_OVERTIME_MULTIPLIER;
    const regularPay = (dailyRegularHours / STANDARD_WORK_HOURS_PER_DAY) * dailyWagesRate;
    const overtimePay = dailyOvertimeHours * overtimeRate;
    return {
      totalAdjustedHours: Number(totalAdjustedHours.toFixed(2)),
      totalOTHours: Number(dailyOvertimeHours.toFixed(2)),
      totalPay: Number((regularPay + overtimePay).toFixed(2)),
    };
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .modal-content {
          animation: fadeIn 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      <div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-xl flex flex-col modal-content border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Invoice Details - ID: {invoice.id}</h2>
                <p className="text-blue-100 text-sm">Worker ID: {invoice.workerId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side: Master Invoice Info */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-5">
                  <div className="flex items-center space-x-3 mb-4">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Master Invoice</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Invoice ID:</span>
                      <span className="font-semibold text-gray-900">{invoice.id}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Worker ID:</span>
                      <span className="font-semibold text-gray-900">{invoice.workerId}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-semibold text-gray-900">{invoice.invoiceStatus}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-blue-600">${invoice.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Total Hours:</span>
                      <span className="font-semibold text-gray-900">{invoice.totalHours.toFixed(2)}h</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Daily Wages Rate:</span>
                      <span className="font-semibold text-blue-600">${invoice.dailyWagesRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Hourly Wages Rate:</span>
                      <span className="font-semibold text-blue-600">${invoice.hourlyWagesRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Created On:</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(invoice.createdOn)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Notes:</span>
                      <span className="font-semibold text-gray-900">{invoice.notes || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Shift Details */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-5">
                  <div className="flex items-center space-x-3 mb-4">
                    <Clock className="h-5 w-5 text-teal-600" />
                    <h3 className="text-lg font-bold text-gray-900">Shift Details ({invoice.invoiceDetails.length})</h3>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {dates.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">No shift details available.</p>
                    ) : (
                      dates.map((date) => {
                        const dailyShifts = parsedShifts[date] || [];
                        const detail = invoice.invoiceDetails.find(
                          (d) => new Date(d.invoicePeriod).toISOString().split('T')[0] === date
                        );
                        const isExpanded = expandedDates.includes(date);
                        const dailyTotals = detail ? calculateDailyTotals(dailyShifts, detail) : {
                          totalAdjustedHours: 0,
                          totalOTHours: 0,
                          totalPay: 0,
                        };

                        return (
                          <div key={date} className="border rounded-lg overflow-hidden transition-all duration-300">
                            <button
                              onClick={() => toggleDate(date)}
                              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 focus:outline-none text-left"
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-800 text-sm">{formatDate(date)}</span>
                                <span className="text-xs text-gray-500">{dailyShifts.length} {dailyShifts.length > 1 ? 'Shifts' : 'Shift'}</span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="font-semibold text-gray-800 text-sm">${dailyTotals.totalPay.toFixed(2)}</span>
                                <X
                                  size={20}
                                  className={`text-gray-500 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                                />
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="border-t bg-white">
                                <div className="bg-gray-50/50 p-3 text-xs space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Adjusted Hours:</span>
                                    <span className="font-semibold text-gray-800">{dailyTotals.totalAdjustedHours.toFixed(2)}h</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Regular Hours:</span>
                                    <span className="font-semibold text-blue-600">{(dailyTotals.totalAdjustedHours - dailyTotals.totalOTHours).toFixed(2)}h</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Overtime:</span>
                                    <span className="font-semibold text-orange-600">{dailyTotals.totalOTHours.toFixed(2)}h</span>
                                  </div>
                                  <div className="flex justify-between mt-1 pt-1 border-t">
                                    <span className="font-bold text-gray-700">Total Pay for Day:</span>
                                    <span className="font-bold text-green-700">${dailyTotals.totalPay.toFixed(2)}</span>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <ShiftTable shifts={dailyShifts} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-xl border p-5">
                  <div className="flex items-center space-x-3 mb-4">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    <h3 className="text-lg font-bold text-gray-900">Invoice Summary</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Total Shifts:</span>
                      <span className="font-semibold text-gray-900">{invoice.invoiceDetails.length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Total Regular Hours:</span>
                      <span className="font-semibold text-blue-600">{invoice.invoiceDetails.reduce((sum, d) => sum + (d.dailyHours - d.overtimeHours), 0).toFixed(2)}h</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Total Overtime Hours:</span>
                      <span className="font-semibold text-orange-600">{invoice.invoiceDetails.reduce((sum, d) => sum + d.overtimeHours, 0).toFixed(2)}h</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-blue-700 text-lg">${invoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t flex justify-end flex-shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper Component for Shift Table
interface ShiftTableProps {
  shifts: ShiftDetail[];
}

function ShiftTable({ shifts }: ShiftTableProps) {
  return (
    <div className="space-y-4">
      {shifts.map((shift) => (
        <div key={shift.ShiftId} className="text-sm border-b pb-3 last:border-b-0">
          <div className="flex justify-between font-semibold text-gray-700 mb-1.5">
            <span>Shift ID: {shift.ShiftId}</span>
          </div>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Time:</span>
              <span className="font-medium text-gray-800">{shift.CheckIn || 'N/A'} - {shift.CheckOut || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Hours Worked:</span>
              <span className="font-medium text-gray-800">{(shift.AdjustedHours ?? shift.TotalHours ?? 0).toFixed(2)}h</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}