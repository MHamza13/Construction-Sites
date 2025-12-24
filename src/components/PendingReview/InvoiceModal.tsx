"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  X,
  User,
  Mail,
  Clock,
  Receipt,
  ChevronDown,
  FileText,
} from "lucide-react";
import { createMasterInvoice } from "@/redux/invoiceMaster/invoiceMasterSlice";
import LiveLocationModal from "@/components/shifts/LiveLocationModal";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaEuroSign } from "react-icons/fa";
import { DateTime } from "luxon";
import { sendNotificationToUser } from "@/redux/userDeviceTokken/userDeviceTokkenSlice";
import { RootState } from "@/redux/store";

const UK_TIMEZONE = "Europe/London";

export const formatDateToUK = (
  dateStr: string | Date | undefined,
  formatStr: string = "dd MMM yyyy, hh:mm a"
): string => {
  if (!dateStr) return "—";
  try {
    const dt = typeof dateStr === "string"
      ? DateTime.fromISO(dateStr)
      : DateTime.fromJSDate(dateStr);
    if (!dt.isValid) return "Invalid";
    return dt.setZone(UK_TIMEZONE).toFormat(formatStr);
  } catch {
    return "Invalid";
  }
};

export const formatDateOnlyUK = (dateStr?: string | Date): string =>
  formatDateToUK(dateStr, "dd MMM yyyy");

export const formatTimeOnlyUK = (dateStr?: string): string =>
  formatDateToUK(dateStr, "hh:mm a");

const DEFAULT_OVERTIME_MULTIPLIER = 1;
const STANDARD_WORK_HOURS_PER_DAY = 8;

interface ShiftDetailApi {
  ShiftId: number;
  Date: string;
  CheckIn: string;
  CheckOut: string;
  TotalHours: number;
  DailyWagesHours: number;
  ExtraHours: number;
  AdjustedHours: number;
  DailyWagesRate: number | null | undefined;
  HourlyRate?: number | null;
  OvertimeRate?: number | null;
  createdByRole?: string;
  createdByName?: string;
}

interface JsonWorker {
  Worker: string;
  Email: string;
  TotalHours: number;
  Overtime: number;
  TotalPay: number | null;
  Status: string;
  Shifts: number;
  PayPeriod: string;
  WorkerID: string | number;
  DailyWagesRate: number | null | undefined;
  Actions?: string[];
  ShiftDetails: ShiftDetailApi[] | undefined;
  HourlyRate?: number;
}

interface InvoiceModalProps {
  worker: JsonWorker;
  closeModal: () => void;
  populateDetailedShifts: (worker: JsonWorker) => ShiftDetailApi[];
  updateDetailedShift: (
    workerId: string,
    shiftIndex: number,
    field: string,
    value: number
  ) => void;
  addDetailedShift: (workerId: string) => void;
  removeDetailedShift: (workerId: string, shiftIndex: number) => void;
  recalculateDetailedTotals: (worker: JsonWorker) => {
    totalShifts: number;
    totalHours: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    totalRegularPay: number;
    totalOvertimePay: number;
    totalPay: number;
  };
  setModalWorker: React.Dispatch<React.SetStateAction<JsonWorker | null>>;
  fromDate?: Date;
  toDate?: Date;
  refreshMasterPayRole?: () => void;
}

// --- PDF GENERATION (بغیر Public Notes) ---
const generateInvoicePDF = (
  worker: JsonWorker,
  shifts: ShiftDetailApi[],
  totals: ReturnType<InvoiceModalProps["recalculateDetailedTotals"]>
): string => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("RBS Construction", 14, 20);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("BUILDING DREAMS, CREATING REALITY", 14, 24);

  doc.setFontSize(9);
  doc.text("Website: www.rbsconstruction.com", pageWidth - 14, 15, { align: "right" });
  doc.text("Email: contact@rbsconstruction.com", pageWidth - 14, 20, { align: "right" });
  doc.text("Phone: (123) 456-7890", pageWidth - 14, 25, { align: "right" });
  doc.text("Address: 123 Construction Way, Buildington, 45678", pageWidth - 14, 30, { align: "right" });

  doc.setFillColor(220, 220, 220);
  doc.rect(14, 38, pageWidth - 28, 10, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Work Invoice", pageWidth / 2, 45, { align: "center" });

  doc.setFontSize(11);
  doc.text(`Worker Name: ${worker.Worker} (ID: ${worker.WorkerID})`, 14, 60);
  doc.text(`Email: ${worker.Email}`, 14, 66);
  doc.text(`Daily Wages Rate: €${(worker.DailyWagesRate ?? 0).toFixed(2)}`, 14, 72);

  const today = formatDateOnlyUK(new Date());
  doc.text(`Date: ${today}`, pageWidth - 14, 60, { align: "right" });
  doc.text(`Hourly Rate: €${(worker.HourlyRate ?? 0).toFixed(2)}`, pageWidth - 14, 66, { align: "right" });

  const tableBody: any[][] = [];
  const groupedShifts = shifts.reduce((acc, shift) => {
    const date = shift.Date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, ShiftDetailApi[]>);

  const sortedDates = Object.keys(groupedShifts).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  sortedDates.forEach((date) => {
    const dailyShifts = groupedShifts[date];
    let dailyTotalRegularHours = 0;
    let dailyTotalAdjustedHours = 0;
    let dailyTotalOvertimeHours = 0;
    let dailyTotalPay = 0;

    dailyShifts.forEach((shift) => {
      const adjustedHours = shift.AdjustedHours ?? shift.TotalHours ?? 0;
      const regularHours = Math.min(adjustedHours, 8);
      const overtimeHours = Math.max(0, adjustedHours - 8);
      const dailyWages = shift.DailyWagesRate ?? worker.DailyWagesRate ?? 0;
      const hourly = shift.HourlyRate ?? worker.HourlyRate ?? 0;
      const regularPay = (regularHours / 8) * dailyWages;
      const overtimePay = overtimeHours * (shift.OvertimeRate ?? hourly * regularPay);

      dailyTotalRegularHours += regularHours;
      dailyTotalAdjustedHours += adjustedHours;
      dailyTotalOvertimeHours += overtimeHours;
      dailyTotalPay += regularPay + overtimePay;
    });

    const formattedDate = formatDateOnlyUK(date);
    tableBody.push([
      { content: formattedDate, rowSpan: dailyShifts.length + 1, styles: { valign: "middle", fontStyle: "bold", fillColor: "#e6f2ff" } },
      { content: `Daily Hours: ${dailyTotalRegularHours.toFixed(1)}h`, styles: { fontStyle: "bold", fillColor: "#f0f0f0", halign: "center" } },
      { content: `Overtime: ${dailyTotalOvertimeHours.toFixed(1)}h`, styles: { fontStyle: "bold", fillColor: "#f0f0f0", halign: "center" } },
      { content: `Total: ${dailyTotalAdjustedHours.toFixed(1)}h`, styles: { fontStyle: "bold", fillColor: "#f0f0f0", halign: "center" } },
      { content: `Adjusted: ${dailyTotalAdjustedHours.toFixed(1)}h`, styles: { fontStyle: "bold", fillColor: "#f0f0f0", halign: "center" } },
      { content: `€${dailyTotalPay.toFixed(2)}`, styles: { fontStyle: "bold", fillColor: "#f0f0f0", halign: "right", textColor: "#0a7c0a" } },
    ]);

    dailyShifts.forEach((shift) => {
      const adjustedHours = shift.AdjustedHours ?? shift.TotalHours ?? 0;
      const checkIn = formatTimeOnlyUK(shift.CheckIn);
      const checkOut = formatTimeOnlyUK(shift.CheckOut);

      tableBody.push([
        `Shift #${shift.ShiftId}`,
        `Check In: ${checkIn}`,
        `Check Out: ${checkOut}`,
        `Hours: ${adjustedHours.toFixed(1)}`,
        ''
      ]);
    });
  });

  autoTable(doc, {
    startY: 75,
    head: [["Date", "Description", "Details", "Info", "Hours", "Amount"]],
    body: tableBody,
    theme: "grid",
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 2.2 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30, halign: "right" },
    },
  });

  let finalY = (doc as any).lastAutoTable.finalY;
  const summaryData = [
    ["Subtotal (Regular Pay)", `€ ${totals.totalRegularPay.toFixed(2)}`],
    ["Subtotal (Overtime Pay)", `€ ${totals.totalOvertimePay.toFixed(2)}`],
    ["Discount", "€ 0.00"],
    [
      { content: "Grand Total", styles: { fontStyle: "bold", fontSize: 12 } },
      { content: `€ ${totals.totalPay.toFixed(2)}`, styles: { fontStyle: "bold", fontSize: 12, halign: "right" } },
    ],
  ];

  autoTable(doc, {
    startY: finalY + 5,
    body: summaryData,
    theme: "plain",
    tableWidth: 90,
    margin: { left: pageWidth - 104 },
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 1: { halign: "right" } },
  });

  finalY = (doc as any).lastAutoTable.finalY;

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("This is a computer-generated document and does not require a signature.", 14, finalY + 15);

  return doc.output("datauristring");
};

// --- SUB-COMPONENTS ---
const WorkerInfo: React.FC<{ worker: JsonWorker }> = ({ worker }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700">
    <div className="flex items-center space-x-3 mb-6">
      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Worker Information</h4>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-2">
          <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Name</span>
        </div>
        <p className="font-medium text-gray-900 dark:text-gray-100">{worker.Worker}</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-2">
          <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Worker ID</span>
        </div>
        <p className="font-medium font-mono text-gray-900 dark:text-gray-100">{worker.WorkerID}</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-2">
          <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Email</span>
        </div>
        <p className="font-medium text-blue-600 dark:text-blue-400">{worker.Email}</p>
      </div>
    </div>
  </div>
);

const PayRateSettings: React.FC<{
  dailyWagesRate: number | null;
  hourlyRate: number | null;
  handleUpdateAllDailyWagesRates: (newRate: number) => void;
  handleUpdateAllHourlyRates: (newRate: number) => void;
}> = ({ dailyWagesRate, hourlyRate, handleUpdateAllDailyWagesRates, handleUpdateAllHourlyRates }) => (
  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-amber-100 dark:border-gray-700">
    <div className="flex items-center space-x-3 mb-6">
      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
        <FaEuroSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </div>
      <h4 className="text-lg font-semibold text-amber-900 dark:text-amber-300">Global Pay Rate Settings</h4>
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Daily Wages (Apply to All Shifts)</label>
        <div className="relative flex items-center">
          <FaEuroSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
          <input
            type="number"
            step="0.01"
            value={dailyWagesRate ?? ""}
            className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            onChange={(e) => handleUpdateAllDailyWagesRates(parseFloat(e.target.value) || 0)}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Sets a new daily wage for <strong>all</strong> shifts.</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hourly Rate (Apply to All Shifts)</label>
        <div className="relative flex items-center">
          <FaEuroSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
          <input
            type="number"
            step="0.01"
            value={hourlyRate ?? ""}
            className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            onChange={(e) => handleUpdateAllHourlyRates(parseFloat(e.target.value) || 0)}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Sets a new hourly rate for <strong>all</strong> shifts (used for overtime).</p>
      </div>
    </div>
  </div>
);

const LocationCell: React.FC<{ shift: any; workerId: string | number }> = ({ shift, workerId }) => {
  const [openLiveModal, setOpenLiveModal] = useState(false);
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setOpenLiveModal(true)}
          className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:underline"
          title="Live Location"
        >
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Live
        </button>
      </div>
      {openLiveModal && (
        <LiveLocationModal
          onClose={() => setOpenLiveModal(false)}
          shiftId={Number(shift?.ShiftId)}
          workerId={Number(workerId)}
        />
      )}
    </>
  );
};

const ShiftTable: React.FC<{ shifts: ShiftDetailApi[]; workerId: string | number }> = ({ shifts, workerId }) => (
  <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
    <table className="min-w-full">
      <thead className="bg-slate-100 dark:bg-gray-800 border-b-2 border-slate-200 dark:border-gray-700">
        <tr>
          <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Shift ID</th>
          <th className="px-5 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Check In</th>
          <th className="px-5 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Check Out</th>
          <th className="px-5 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Shifts Hours</th>
          <th className="px-5 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Manual</th>
          <th className="px-5 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Location</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
        {shifts.map((shift) => (
          <tr key={shift.ShiftId} className="hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors duration-150">
            <td className="px-5 py-2">
              <span className="inline-block bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold px-2 py-1 rounded-full font-mono">
                #{shift.ShiftId}
              </span>
            </td>
            <td className="px-3 py-2 text-center">
              <input
                type="text"
                value={formatTimeOnlyUK(shift.CheckIn)}
                disabled
                className="bg-transparent text-gray-800 font-medium text-center border-none outline-none cursor-default disabled:opacity-100 dark:text-gray-200"
              />
            </td>
            <td className="px-3 py-2 text-center">
              <input
                type="text"
                value={formatTimeOnlyUK(shift.CheckOut)}
                disabled
                className="bg-transparent text-gray-800 font-medium text-center border-none outline-none cursor-default disabled:opacity-100 dark:text-gray-200"
              />
            </td>
            <td className="px-5 py-2 text-center">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {(shift.TotalHours ?? 0).toFixed(1)}h
              </span>
            </td>
            <td className="px-5 py-2 text-center">
              <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                {shift.createdByRole === "Admin" ? "Manual" : shift.createdByRole === "Worker" ? "Own" : shift.createdByRole} ({shift.createdByName})
              </span>
            </td>
            <td className="px-5 py-2 text-center">
              <LocationCell shift={shift} workerId={workerId} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ShiftDetails: React.FC<{
  worker: JsonWorker;
  detailedShifts: ShiftDetailApi[];
  updateDetailedShift: (workerId: string, shiftIndex: number, field: string, value: number) => void;
  updateHourlyRateForDate: (date: string, newHourlyRate: number) => void;
  updateDailyWagesRateForDate: (date: string, newDailyWagesRate: number) => void;
  expandedDates: string[];
  toggleDate: (date: string) => void;
  setModalWorker: React.Dispatch<React.SetStateAction<JsonWorker | null>>;
}> = ({
  worker,
  detailedShifts,
  updateHourlyRateForDate,
  updateDailyWagesRateForDate,
  expandedDates,
  toggleDate,
  setModalWorker,
}) => {
  const globalHourlyRate = worker.HourlyRate ?? 0;
  const globalDailyWagesRate = worker.DailyWagesRate ?? 0;
  const [adjustedHoursInput, setAdjustedHoursInput] = useState<Record<string, string>>({});
  const [rateInputs, setRateInputs] = useState<Record<string, { daily: string; hourly: string }>>({});

  const groupedShifts = useMemo(() => {
    return detailedShifts.reduce((acc, shift) => {
      (acc[shift.Date] = acc[shift.Date] || []).push(shift);
      return acc;
    }, {} as Record<string, ShiftDetailApi[]>);
  }, [detailedShifts]);

  const dates = useMemo(() => Object.keys(groupedShifts).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()), [groupedShifts]);

  const calculateDailyTotals = useCallback((shifts: ShiftDetailApi[]) => {
    if (!shifts || shifts.length === 0) return { totalAdjustedHours: 0, totalOTHours: 0, totalPay: 0, totalRegularHours: 0 };

    const totalAdjustedHours = shifts.reduce((sum, s) => sum + (s.AdjustedHours ?? s.TotalHours ?? 0), 0);
    const totalHours = shifts.reduce((sum, s) => sum + (s.TotalHours ?? 0), 0);
    const dailyOvertimeHours = Math.max(0, totalAdjustedHours - STANDARD_WORK_HOURS_PER_DAY);
    const dailyRegularHours = totalAdjustedHours - dailyOvertimeHours;

    const repShift = shifts[0];
    const dailyWagesRate = repShift.DailyWagesRate ?? globalDailyWagesRate;
    const hourlyRate = repShift.HourlyRate ?? globalHourlyRate;
    const overtimeRate = repShift.OvertimeRate ?? hourlyRate * DEFAULT_OVERTIME_MULTIPLIER;

    const regularPay = (dailyRegularHours / STANDARD_WORK_HOURS_PER_DAY) * dailyWagesRate;
    const overtimePay = dailyOvertimeHours * overtimeRate;

    return {
      totalHours: Number(totalHours.toFixed(1)), 
      totalAdjustedHours: Number(totalAdjustedHours.toFixed(1)),
      totalRegularHours: Number(dailyRegularHours.toFixed(1)),
      totalOTHours: Number(dailyOvertimeHours.toFixed(1)),
      totalPay: Number((regularPay + overtimePay).toFixed(2)),
    };
  }, [globalDailyWagesRate, globalHourlyRate]);

  useEffect(() => {
    const newAdjustedHours: Record<string, string> = {};
    dates.forEach((date) => {
      const total = groupedShifts[date].reduce((sum, s) => sum + (s.AdjustedHours ?? s.TotalHours ?? 0), 0);
      newAdjustedHours[date] = total.toFixed(1);
    });
    setAdjustedHoursInput(newAdjustedHours);
  }, [dates, groupedShifts]);

  useEffect(() => {
    const newRateInputs: Record<string, { daily: string; hourly: string }> = {};
    dates.forEach(date => {
      const shifts = groupedShifts[date];
      if (shifts.length > 0) {
        newRateInputs[date] = {
          daily: (shifts[0].DailyWagesRate ?? globalDailyWagesRate).toFixed(2),
          hourly: (shifts[0].HourlyRate ?? globalHourlyRate).toFixed(2),
        };
      }
    });
    setRateInputs(newRateInputs);
  }, [dates, groupedShifts, globalDailyWagesRate, globalHourlyRate]);

  const handleDailyAdjustedHoursChange = useCallback((date: string, newTotalStr: string) => {
    const newTotal = parseFloat(newTotalStr) || 0;
    if (isNaN(newTotal) || newTotal < 0) return;

    const dailyShifts = groupedShifts[date];
    const currentTotal = dailyShifts.reduce((sum, s) => sum + (s.AdjustedHours ?? s.TotalHours ?? 0), 0);
    const ratio = currentTotal > 0 ? newTotal / currentTotal : 1;

    let accumulated = 0;

    setModalWorker(prev => {
      if (!prev || !prev.ShiftDetails) return prev;

      const updatedShifts = prev.ShiftDetails.map(shift => {
        if (shift.Date !== date) return shift;

        const oldAdj = shift.AdjustedHours ?? shift.TotalHours ?? 0;
        let newAdj = oldAdj * ratio;
        accumulated += newAdj;

        if (dailyShifts[dailyShifts.length - 1].ShiftId === shift.ShiftId) {
          newAdj = newTotal - (accumulated - newAdj);
        }

        return { ...shift, AdjustedHours: parseFloat(newAdj.toFixed(2)) };
      });

      return { ...prev, ShiftDetails: updatedShifts };
    });

    setAdjustedHoursInput(p => ({ ...p, [date]: newTotal.toFixed(1) }));
  }, [groupedShifts, setModalWorker]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
          <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 ml-3">Shift Details</h4>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {dates.length === 0 ? (
          <div className="p-6 text-center text-gray-600 dark:text-gray-400">No shifts available.</div>
        ) : (
          dates.map((date) => {
            const dailyShifts = groupedShifts[date];
            const isExpanded = expandedDates.includes(date);
            const dailyTotals = calculateDailyTotals(dailyShifts);

            return (
              <div key={date}>
                <div
                  className="w-full flex cursor-pointer flex-col p-4 bg-white hover:bg-slate-50 dark:bg-gray-900 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 transition-colors duration-200"
                  onClick={() => toggleDate(date)}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{formatDateOnlyUK(date)}</span>
                      <span className="text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
                        {dailyShifts.length} shifts
                      </span>
                    </div>
                    <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 ml-auto transition-colors duration-200">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* PDF جیسا ترتیب: Standard → Overtime → Total → Adjusted → Daily Wages → Hourly Rate → Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm" onClick={(e) => e.stopPropagation()}>
               

                    {/* 3. Total */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Total</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400">{dailyTotals.totalHours.toFixed(1)}h</p>
                    </div>

                    {/* 4. Adjusted (Manual Input) */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Adjusted</label>
                      <div className="relative flex items-center">
                        <Clock className="absolute left-2 w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <input
                          type="number"
                          step="0.1"
                          value={adjustedHoursInput[date] || ""}
                          className="w-full pl-6 pr-2 py-1.5 border border-blue-400 dark:border-blue-600 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          onChange={(e) => setAdjustedHoursInput(p => ({ ...p, [date]: e.target.value }))}
                          onBlur={(e) => handleDailyAdjustedHoursChange(date, e.target.value)}
                        />
                      </div>
                    </div>

                    {/* 5. Daily Wages */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Daily Wages</p>
                      <div className="relative flex items-center">
                        <FaEuroSign className="absolute left-2 w-3 h-3 text-gray-500 dark:text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={rateInputs[date]?.daily ?? ""}
                          className="w-full pl-6 pr-2 py-1.5 border border-blue-400 dark:border-blue-600 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          onChange={(e) => setRateInputs((prev) => ({ ...prev, [date]: { ...prev[date], daily: e.target.value } }))}
                          onBlur={(e) => updateDailyWagesRateForDate(date, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* 6. Hourly Rate */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Hourly Rate</p>
                      <div className="relative flex items-center">
                        <FaEuroSign className="absolute left-2 w-3 h-3 text-gray-500 dark:text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={rateInputs[date]?.hourly ?? ""}
                          className="w-full pl-6 pr-2 py-1.5 border border-blue-400 dark:border-blue-600 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          onChange={(e) => setRateInputs((prev) => ({ ...prev, [date]: { ...prev[date], hourly: e.target.value } }))}
                          onBlur={(e) => updateHourlyRateForDate(date, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* 7. Amount */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Amount</p>
                      <p className="font-bold text-green-600 dark:text-green-400">€{dailyTotals.totalPay.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
                    <ShiftTable shifts={dailyShifts} workerId={worker.WorkerID} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// صرف Internal Notes
const NotesSection: React.FC<{
  internalNotes: string;
  setInternalNotes: (notes: string) => void;
}> = ({ internalNotes, setInternalNotes }) => (
  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
    <div className="flex items-center mb-4">
      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
        <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      </div>
      <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-300">Internal Notes</h4>
    </div>
    <textarea
      value={internalNotes}
      onChange={(e) => setInternalNotes(e.target.value)}
      className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      rows={4}
      placeholder="Private notes for internal use..."
    />
  </div>
);

const Summary: React.FC<{
  totals: ReturnType<InvoiceModalProps["recalculateDetailedTotals"]>;
}> = ({ totals }) => (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-green-100 dark:border-green-800">
    <div className="flex items-center space-x-3 mb-6">
      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
        <Receipt className="w-4 h-4 text-green-600 dark:text-green-400" />
      </div>
      <h4 className="text-lg font-semibold text-green-900 dark:text-green-300">Invoice Summary</h4>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
      <div><p className="text-sm text-gray-600 dark:text-gray-400">Total Shifts</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{totals.totalShifts}</p></div>
      <div><p className="text-sm text-gray-600 dark:text-gray-400">Total Regular Hours</p><p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">{totals.totalRegularHours.toFixed(1)}h</p></div>
      <div><p className="text-sm text-gray-600 dark:text-gray-400">Total Overtime Hours</p><p className="text-lg font-semibold text-orange-600 dark:text-orange-400">{totals.totalOvertimeHours.toFixed(1)}h</p></div>
      <div><p className="text-sm text-gray-600 dark:text-gray-400">Total Regular Pay</p><p className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">€{totals.totalRegularPay.toFixed(2)}</p></div>
      <div><p className="text-sm text-gray-600 dark:text-gray-400">Total Overtime Pay</p><p className="text-lg font-semibold text-orange-700 dark:text-orange-300">€{totals.totalOvertimePay.toFixed(2)}</p></div>
      <div className="col-span-2 md:col-span-3 pt-4 mt-2 border-t border-green-200 dark:border-green-800">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Grand Total</p>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">€{totals.totalPay.toFixed(2)}</p>
      </div>
    </div>
  </div>
);

// --- MAIN MODAL ---
const InvoiceModal: React.FC<InvoiceModalProps> = ({
  worker,
  closeModal,
  populateDetailedShifts,
  updateDetailedShift,
  setModalWorker,
  refreshMasterPayRole,
  fromDate,
  toDate,
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [internalNotes, setInternalNotes] = useState("");
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allDetailedShifts = useMemo(() => {
    return (populateDetailedShifts(worker) || []).map((shift) => ({
      ...shift,
      AdjustedHours: shift.AdjustedHours ?? shift.TotalHours ?? 0,
    }));
  }, [worker, populateDetailedShifts]);

  const filteredShifts = useMemo(() => {
    if (!fromDate || !toDate) return allDetailedShifts;
    const start = new Date(fromDate); start.setHours(0, 0, 0, 0);
    const end = new Date(toDate); end.setHours(23, 59, 59, 999);
    return allDetailedShifts.filter((s) => {
      const d = new Date(s.Date);
      return d >= start && d <= end;
    });
  }, [allDetailedShifts, fromDate, toDate]);

  const handleUpdateAllRates = useCallback((newRate: number, type: "daily" | "hourly") => {
    setModalWorker((prev) => {
      if (!prev) return null;
      const updatedShifts = (prev.ShiftDetails || []).map((shift) => ({
        ...shift,
        ...(type === "daily" ? { DailyWagesRate: newRate } : {
          HourlyRate: newRate,
          OvertimeRate: newRate * DEFAULT_OVERTIME_MULTIPLIER,
        }),
      }));
      return {
        ...prev,
        ...(type === "daily" ? { DailyWagesRate: newRate } : { HourlyRate: newRate }),
        ShiftDetails: updatedShifts,
      };
    });
  }, [setModalWorker]);

  const updateRateForDate = useCallback((date: string, newRate: number, type: "daily" | "hourly") => {
    setModalWorker((prev) => {
      if (!prev) return null;
      const updatedShifts = (prev.ShiftDetails || []).map((s) =>
        s.Date === date
          ? {
              ...s,
              ...(type === "daily" ? { DailyWagesRate: newRate } : {
                HourlyRate: newRate,
                OvertimeRate: newRate * DEFAULT_OVERTIME_MULTIPLIER,
              }),
            }
          : s
      );
      return { ...prev, ShiftDetails: updatedShifts };
    });
  }, [setModalWorker]);

  const toggleDate = useCallback((date: string) =>
    setExpandedDates((p) => p.includes(date) ? p.filter((d) => d !== date) : [...p, date]), []);

  const totals = useMemo(() => {
    const groupedByDate = filteredShifts.reduce((acc, shift) => {
      (acc[shift.Date] = acc[shift.Date] || []).push(shift);
      return acc;
    }, {} as Record<string, ShiftDetailApi[]>);

    let totalOvertimeHours = 0, totalRegularPay = 0, totalOvertimePay = 0;

    for (const date in groupedByDate) {
      const dailyShifts = groupedByDate[date];
      const dailyAdjustedHours = dailyShifts.reduce((sum, s) => sum + (s.AdjustedHours ?? s.TotalHours ?? 0), 0);
      const dailyOT = Math.max(0, dailyAdjustedHours - STANDARD_WORK_HOURS_PER_DAY);
      const dailyRegular = dailyAdjustedHours - dailyOT;
      totalOvertimeHours += dailyOT;

      const repShift = dailyShifts[0];
      const dWagesRate = repShift.DailyWagesRate ?? worker.DailyWagesRate ?? 0;
      const hRate = repShift.HourlyRate ?? worker.HourlyRate ?? 0;
      const otRate = repShift.OvertimeRate ?? hRate * DEFAULT_OVERTIME_MULTIPLIER;

      totalRegularPay += (dailyRegular / STANDARD_WORK_HOURS_PER_DAY) * dWagesRate;
      totalOvertimePay += dailyOT * otRate;
    }

    const totalAdjusted = filteredShifts.reduce((sum, s) => sum + (s.AdjustedHours ?? s.TotalHours ?? 0), 0);
    const totalOriginal = filteredShifts.reduce((sum, s) => sum + (s.TotalHours ?? 0), 0);

    return {
      totalShifts: filteredShifts.length,
      totalHours: totalOriginal,
      totalRegularHours: totalAdjusted - totalOvertimeHours,
      totalOvertimeHours,
      totalRegularPay,
      totalOvertimePay,
      totalPay: totalRegularPay + totalOvertimePay,
    };
  }, [filteredShifts, worker.DailyWagesRate, worker.HourlyRate]);

  const buildInvoicePayload = useCallback((invoicePDF_Base64: string) => {
    const totalAdjustedHours = totals.totalRegularHours + totals.totalOvertimeHours;

    const invoicePeriod = (fromDate && toDate)
      ? `${formatDateOnlyUK(fromDate)} to ${formatDateOnlyUK(toDate)}`
      : 'N/A';

    const shiftIds = filteredShifts.map(s => s.ShiftId).join(",");

    return {
      workerId: Number(worker.WorkerID) || 0,
      dailyWagesRate: worker.DailyWagesRate ?? 0,
      hourlyWagesRate: worker.HourlyRate ?? 0,
      shiftIds: shiftIds,
      totalHours: totals.totalHours,
      adjustedHours: totalAdjustedHours,
      totalAmount: parseFloat(totals.totalPay.toFixed(2)),
      invoiceStatus: "UnPaid",
      notes: internalNotes,
      publicNotes: "",
      invoicePdfBase64: invoicePDF_Base64,
      invoicePeriod: invoicePeriod,
      invoiceDetails: filteredShifts.map(shift => {
        const adjustedHours = shift.AdjustedHours ?? shift.TotalHours ?? 0;
        const regularHours = Math.min(adjustedHours, 8);
        const overtimeHours = Math.max(0, adjustedHours - 8);

        const dailyWagesRate = shift.DailyWagesRate ?? worker.DailyWagesRate ?? 0;
        const hourlyRate = shift.HourlyRate ?? worker.HourlyRate ?? 0;
        const overtimeRate = shift.OvertimeRate ?? hourlyRate * 1.5;

        const regularPay = (regularHours / 8) * dailyWagesRate;
        const overtimePay = overtimeHours * overtimeRate;
        const totalAmount = parseFloat((regularPay + overtimePay).toFixed(2));

        return {
          shiftId: shift.ShiftId,
          date: shift.Date,
          checkIn: shift.CheckIn,
          checkOut: shift.CheckOut,
          totalHours: shift.TotalHours,
          adjustedHours: adjustedHours,
          overtimeHours: overtimeHours,
          dailyWagesRate: dailyWagesRate,
          hourlyRate: hourlyRate,
          overtimeRate: overtimeRate,
          totalAmount: totalAmount,
          shiftJson: JSON.stringify(shift)
        };
      }),
    };
  }, [worker, filteredShifts, totals, internalNotes, fromDate, toDate]);

  const handleAction = async (action: "generate" | "view") => {
    if (filteredShifts.length === 0) {
      Swal.fire({ icon: "info", title: "No Shifts", text: "No shifts to generate invoice.", timer: 3000 });
      return;
    }
    setIsSubmitting(true);
    try {
      const pdfDataUri = generateInvoicePDF(worker, filteredShifts, totals);
      if (action === "view") {
        const win = window.open("");
        win?.document.write(`<iframe src="${pdfDataUri}" style="width:100%;height:100vh;border:none;"></iframe>`);
      } else {
        const payload = buildInvoicePayload(pdfDataUri.split(',')[1]);
        await dispatch(createMasterInvoice(payload)).unwrap();
        refreshMasterPayRole?.();
        if (user?.userId) {
          const notificationPayload = {
            userId: Number(worker.WorkerID) || 0,
            type: "invoice",
            title: "New Invoice Generated",
            body: `An invoice for ${payload.invoicePeriod} amounting to €${payload.totalAmount.toFixed(2)} is ready for review.`,
            senderID: user.userId,
          };
          dispatch(sendNotificationToUser(notificationPayload));
        }
        Swal.fire({ icon: "success", title: "Success!", text: "Invoice generated and worker notified!", timer: 2000 });
        closeModal();
      }
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Failed", text: err.message || "Unknown error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] p-4" onClick={closeModal}>
      <div className="flex items-center justify-center min-h-screen" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <header className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Invoice Details</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Worker: {worker.Worker}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50 dark:bg-slate-900">
            <WorkerInfo worker={worker} />
            <PayRateSettings
              dailyWagesRate={worker.DailyWagesRate}
              hourlyRate={worker.HourlyRate}
              handleUpdateAllDailyWagesRates={(r) => handleUpdateAllRates(r, "daily")}
              handleUpdateAllHourlyRates={(r) => handleUpdateAllRates(r, "hourly")}
            />
            <ShiftDetails
              worker={worker}
              detailedShifts={filteredShifts}
              updateDetailedShift={updateDetailedShift}
              updateDailyWagesRateForDate={(d, r) => updateRateForDate(d, r, "daily")}
              updateHourlyRateForDate={(d, r) => updateRateForDate(d, r, "hourly")}
              expandedDates={expandedDates}
              toggleDate={toggleDate}
              setModalWorker={setModalWorker}
            />
            <NotesSection internalNotes={internalNotes} setInternalNotes={setInternalNotes} />
            <Summary totals={totals} />
          </main>
          <footer className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 border-t">
            <div className="flex justify-end space-x-4">
              <button onClick={() => handleAction('generate')} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-70">
                <Receipt className="w-5 h-5" /> {isSubmitting ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;