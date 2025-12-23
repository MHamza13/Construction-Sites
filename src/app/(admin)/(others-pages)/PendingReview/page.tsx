"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearPayrollCache, fetchPayroll } from "@/redux/payRole/payRole";
import FiltersAndActions from "@/components/PendingReview/FiltersAndActions";
import WorkersTable from "@/components/PendingReview/WorkersTable";
import InvoiceModal from "@/components/PendingReview/InvoiceModal";
import Banner from "@/layout/Banner";
import { AppDispatch, RootState } from "@/redux/store";

// Interfaces (same as before)
interface ApiShift {
  ShiftId: number;
  created_at: string;
  CheckIn: string;
  EndShift: string;
  CalculatedHours: number;
}

interface ApiWorker {
  UserId: number | string;
  Name: string;
  Surname: string;
  Email: string;
  PhoneNumber: string;
  IsActive: boolean;
  ProfilePictureUrl: string;
  Experience: number;
  DailyWages: number;
  PerHourSalary: number;
  Shifts: ApiShift[];
}

interface ShiftDetailApi {
  ShiftId: number;
  Date: string;
  CheckIn: string;
  CheckOut: string;
  TotalHours: number;
  DailyWagesHours: number;
  ExtraHours: number;
}

interface JsonWorker {
  WorkerID: string;
  Worker: string;
  Email: string;
  TotalHours: number;
  Overtime: number;
  TotalPay: number | null;
  Status: string;
  Shifts: number;
  PayPeriod: string;
  workerId: number | null;
  DailyWagesRate: number | null;
  HourlyRate: number | null;
  Actions: string;
  ShiftDetails: ShiftDetailApi[] | null;
  uploadedFiles?: Array<{
    id: string;
    name: string;
    size: string;
    uploadDate: string;
    type: string;
  }>;
}

const PendingReview = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: apiWorkersData, loading, error } = useSelector((state: RootState) => state.payroll);

  // State - initialized as empty strings (no default override)
  const [workers, setWorkers] = useState<JsonWorker[]>([]);
  const [originalData, setOriginalData] = useState<JsonWorker[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [modalWorker, setModalWorker] = useState<JsonWorker | null>(null);

  // Format date helper
  const formatDateString = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const refreshMasterPayRole = async () => {

     if (!fromDate || !toDate) return;

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    end.setHours(23, 59, 59, 999);
  dispatch(clearPayrollCache());
  try {
    await dispatch(fetchPayroll({ startDate: start, endDate: end }));
  } catch (err) {
    console.error("Refresh failed:", err);
  }
};

  // === FETCH PAYROLL ONLY WHEN fromDate & toDate ARE VALID ===
  useEffect(() => {
    if (!fromDate || !toDate) return;

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    end.setHours(23, 59, 59, 999);

    dispatch(fetchPayroll({ startDate: start, endDate: end }));
  }, [fromDate, toDate, dispatch]);

  // === TRANSFORM API DATA ===
  const calculateDetailedHours = (checkIn: string, endShift: string): number => {
    if (!checkIn || !endShift) return 0;
    const [ciH, ciM] = checkIn.split(":").map(Number);
    const [eoH, eoM] = endShift.split(":").map(Number);
    let total = (eoH * 60 + eoM) - (ciH * 60 + ciM);
    if (total < 0) total += 24 * 60;
    return total / 60;
  };

  const calculateDetailedPay = (
    totalHours: number,
    adjustedHours: number | null,
    dailyWage: number,
    overtimeRate: number
  ) => {
    const hours = adjustedHours ?? totalHours;
    const regular = Math.min(hours, 8);
    const overtime = Math.max(hours - 8, 0);
    const hourly = dailyWage / 8;
    return {
      regularHours: regular,
      overtimeHours: overtime,
      regularPay: regular * hourly,
      overtimePay: overtime * hourly * overtimeRate,
      totalPay: regular * hourly + overtime * hourly * overtimeRate,
    };
  };

  const transformWorkerData = useCallback((apiWorker: ApiWorker): JsonWorker => {
    const name = `${apiWorker.Name || ""} ${apiWorker.Surname || ""}`.trim() || "Unknown";
    const shifts = Array.isArray(apiWorker.Shifts) ? apiWorker.Shifts : [];
    const dailyWage = apiWorker.DailyWages || 200;
    const hourly = apiWorker.PerHourSalary || dailyWage / 8;
    const overtimeMultiplier = 1.5;

    let totalHours = 0, totalOvertime = 0, totalPay = 0;

    const details: ShiftDetailApi[] = shifts.map((s, i) => {
      const date = s.CheckIn ? new Date(s.CheckIn).toISOString().split("T")[0] : "2025-01-01";
      const checkIn = s.CheckIn ? new Date(s.CheckIn).toTimeString().slice(0, 5) : "09:00";
      const checkOut = s.EndShift ? new Date(s.EndShift).toTimeString().slice(0, 5) : "17:00";
      const hours = s.CalculatedHours || calculateDetailedHours(checkIn, checkOut);
      const extra = Math.max(hours - 8, 0);
      const pay = calculateDetailedPay(hours, s.CalculatedHours, dailyWage, overtimeMultiplier);

      totalHours += hours;
      totalOvertime += extra;
      totalPay += pay.totalPay;

      return {
        ShiftId: s.ShiftId || i + 1,
        Date: date,
        CheckIn: checkIn,
        CheckOut: checkOut,
        TotalHours: hours,
        DailyWagesHours: hours,
        ExtraHours: extra,
        createdByName: s.createdByName,
        createdByRole: s.createdByRole,
      };
    });

    return {
      WorkerID: String(apiWorker.UserId ?? "unknown"),
      Worker: name,
      Email: apiWorker.Email || "No email",
      TotalHours: totalHours,
      Overtime: totalOvertime,
      TotalPay: totalPay,
      Status: "pending",
      Shifts: shifts.length,
      PayPeriod: `${fromDate} - ${toDate}`,
      workerId: typeof apiWorker.UserId === "number" ? apiWorker.UserId : null,
      DailyWagesRate: dailyWage,
      HourlyRate: hourly,
      Actions: "",
      ShiftDetails: details,
      uploadedFiles: [],
    };
  }, [fromDate, toDate]);

  // Transform when API data arrives
  useEffect(() => {
    if (apiWorkersData && fromDate && toDate) {
      const transformed = (apiWorkersData as unknown as ApiWorker[]).map(transformWorkerData);
      setWorkers(transformed);
      setOriginalData(transformed);
      updateFilterStatus(transformed.length);
    }
  }, [apiWorkersData, transformWorkerData, fromDate, toDate]);

  // === FILTERS ===
  const resetFilters = () => {
    setStatusFilter("all");
    setSearchInput("");
    setWorkers([...originalData]);
    updateFilterStatus(originalData.length);
  };

  const updateFilterStatus = useCallback((count: number) => {
    let text = `Showing: ${count} worker${count !== 1 ? "s" : ""}`;
    if (statusFilter !== "all") text += ` with status "${statusFilter}"`;
    if (searchInput.trim()) text += ` matching "${searchInput.trim()}"`;
    setFilterStatus(text);
  }, [statusFilter, searchInput]);

  const applyFilters = useCallback(() => {
    let filtered = [...originalData];

    if (statusFilter !== "all") {
      filtered = filtered.filter(w => w.Status?.toLowerCase().includes(statusFilter.toLowerCase()));
    }

    if (searchInput.trim()) {
      const term = searchInput.toLowerCase().trim();
      filtered = filtered.filter(w =>
        w.Worker.toLowerCase().includes(term) ||
        w.Email.toLowerCase().includes(term) ||
        w.WorkerID.includes(term)
      );
    }

    setWorkers(filtered);
    updateFilterStatus(filtered.length);
  }, [originalData, statusFilter, searchInput, updateFilterStatus]);

  useEffect(() => {
    if (!loading && apiWorkersData) applyFilters();
  }, [applyFilters, loading, apiWorkersData]);

  // === ACTIONS ===
  const viewDetails = (id: string) => {
    const worker = workers.find(w => w.WorkerID === id);
    if (worker) setModalWorker(worker);
  };

  const closeModal = () => setModalWorker(null);

  const processInvoice = (id: string) => {
    if (window.confirm("Process this invoice?")) {
      const updated = workers.map(w => w.WorkerID === id ? { ...w, Status: "Processed" } : w);
      setWorkers(updated);
      setOriginalData(updated);
      closeModal();
    }
  };

  const processAllApproved = () => {
    const approved = workers.filter(w => w.Status?.toLowerCase().includes("approved"));
    if (approved.length && window.confirm(`Process ${approved.length} invoices?`)) {
      const updated = workers.map(w => w.Status?.toLowerCase().includes("approved") ? { ...w, Status: "Processed" } : w);
      setWorkers(updated);
      setOriginalData(updated);
    }
  };

  const exportPayroll = () => {
    // Implement export
  };

  // === STATUS HELPERS ===
  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase().replace(/\s/g, "") || "pending";
    const map: Record<string, string> = {
      pending: "bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500 text-white shadow-amber-500/30 border border-yellow-300/40",
      approved: "bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 text-white shadow-emerald-500/30 border border-green-400/40",
      processed: "bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600 text-white shadow-indigo-500/30 border border-blue-400/40",
    };
    return map[s] || "bg-gradient-to-r from-gray-500 via-slate-600 to-gray-700 text-gray-100 shadow-gray-700/30 border border-gray-500/40";
  };

  const getStatusText = (status: string) => {
    const s = status?.toLowerCase().replace(/\s/g, "") || "pending";
    return s === "pending" ? "Pending" : s === "approved" ? "Approved" : s === "processed" ? "Processed" : "Unknown";
  };

  // === RENDER ===
  if (loading) return <div className="flex justify-center py-10">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">Error: {error}</div>;

  return (
    <div className="max-w-full">
      <Banner title="Pending Reviews" breadcrumb={[{ label: "Home", href: "#" }, { label: "Pending Reviews" }]} />
      <div className="mt-6">
        <FiltersAndActions
          dateFilter="" // not used
          setDateFilter={() => {}}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          showCustomDateRange={false}
          setShowCustomDateRange={() => {}}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          filterStatus={filterStatus}
          resetFilters={resetFilters}
          processAllApproved={processAllApproved}
          exportPayroll={exportPayroll}
        />
        <WorkersTable
          workers={workers}
          fromDate={fromDate}
          toDate={toDate}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
          viewDetails={viewDetails}
          processInvoice={processInvoice}
        />
        {modalWorker && (
          <InvoiceModal
            worker={modalWorker}
            closeModal={closeModal}
            populateDetailedShifts={() => modalWorker.ShiftDetails || []}
            updateDetailedShift={() => {}}
            fromDate={fromDate}
            toDate={toDate}
            addDetailedShift={() => {}}
            removeDetailedShift={() => {}}
            updateAllDailyWages={() => {}}
            recalculateDetailedTotals={() => ({ totalShifts: 0, totalHours: 0, totalRegularHours: 0, totalOvertimeHours: 0, totalRegularPay: 0, totalOvertimePay: 0, totalPay: 0 })}
            saveChanges={() => {}}
            resetToOriginal={() => {}}
            handleFileUpload={() => {}}
            downloadFile={() => {}}
            removeFile={() => {}}
            sendInvoiceEmail={() => {}}
            generateInvoice={() => {}}
            setModalWorker={setModalWorker}
            refreshMasterPayRole={refreshMasterPayRole}
          />
        )}
      </div>
    </div>
  );
};

export default PendingReview;