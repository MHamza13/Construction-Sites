"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMasterInvoices, deleteMasterInvoice } from "@/redux/invoiceMaster/invoiceMasterSlice";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import BulkPaymentModal from "@/components/invoice/BulkPaymentModal";
import ViewInvoiceModal from "@/components/invoice/ViewInvoiceModal";
import Swal from "sweetalert2";
import { Eye, FileText, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ProcessPaymentModal } from "@/components/invoice/ProcessPaymentModal";
import { RootState, AppDispatch } from "@/redux/store";
import { FaEuroSign } from "react-icons/fa";
import { PdfViewerModal } from "@/components/invoice/PdfViewerModal";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  PaginationState,
} from "@tanstack/react-table";

// --- Interface Definitions ---
interface RawInvoiceDetail {
  invoicePeriod?: string;
  shiftJson: string;
  dailyWagesRate?: number | null;
  overtimeHours?: number;
  totalAmount?: number | null;
}

interface RawInvoice {
  id: number;
  workerId: number;
  invoiceStatus: "UnPaid" | "Paid" | "Rejected";
  shiftIds?: string;
  totalHours?: number;
  totalAmount?: number | null;
  notes?: string;
  invoiceDetails?: RawInvoiceDetail[];
  invoicePeriod?: string;
  createdOn?: string;
  invoicePdfPath?: string;
}

interface ShiftDetail {
  shiftId: number;
  date?: string;
  checkIn?: string;
  endShift?: string;
  calculatedHours?: number;
  adjustedHours?: number;
  dailyWage?: number | null;
  payData?: {
    overtimeHours?: number;
    totalPay?: number | null;
  };
}

interface Totals {
  totalShifts: number;
  totalHours: number;
  totalPay?: number | null;
}

interface Worker {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
}

interface Invoice {
  id: number;
  workerId: number;
  workerName: string;
  email?: string;
  ShiftDetails?: ShiftDetail[];
  shiftIds?: number[];
  totals: Totals;
  internalNotes?: string;
  payPeriod?: string;
  createdOn?: string;
  Status: "UnPaid" | "Paid" | "Rejected";
  payment?: string;
  invoiceid?: number;
  totalPay?: number | null;
  invoicePdfPath?: string;
}

interface Filters {
  status?: string;
  payment?: string;
  worker?: string;
  search?: string;
  from?: string;
  to?: string;
}

interface InvoiceTableProps {
  filters?: Filters;
}

const columnHelper = createColumnHelper<Invoice>();

export default function InvoiceTable({ filters = {} , refreshInvoices}: InvoiceTableProps) {
  const dispatch = useDispatch<AppDispatch>();
  const invoicesState = useSelector((state: RootState) => state.masterInvoice);
  const { items: workers, loading: workersLoading } = useSelector((state: RootState) => state.workers);
  const invoicesLoading: boolean = !!invoicesState?.loading;

  const PDF_URL = process.env.NEXT_PUBLIC_FILE_URL;

  // Avatar initials
  const getWorkerAvatar = (workerName?: string) => {
    if (!workerName || workerName.startsWith("Unknown")) return "??";
    return workerName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // --- Data Transformation ---
  const invoices = useMemo(() => {
    const rawInvoices: RawInvoice[] = invoicesState?.data ?? [];
    if (!rawInvoices || rawInvoices.length === 0 || workers.length === 0) return [];

    const workerMap = new Map(workers.map((w) => [w.id, w]));
    return rawInvoices.map((rawInvoice): Invoice => {
      const worker = workerMap.get(rawInvoice.workerId);
      const workerName = worker
        ? `${worker.firstName} ${worker.lastName}`
        : `Unknown Worker #${rawInvoice.workerId}`;
      const email = worker ? worker.email : undefined;

      return {
        id: rawInvoice.id,
        invoiceid: rawInvoice.id,
        workerId: rawInvoice.workerId,
        workerName,
        email,
        shiftIds: rawInvoice.shiftIds?.split(",").map(Number) || [],
        totals: {
          totalShifts: rawInvoice.invoiceDetails?.length || 0,
          totalHours: rawInvoice.totalHours || 0,
          totalPay: rawInvoice.totalAmount,
        },
        internalNotes: rawInvoice.notes,
        payPeriod: rawInvoice.invoicePeriod || "N/A",
        createdOn: rawInvoice.createdOn,
        Status: rawInvoice.invoiceStatus,
        payment: rawInvoice.invoiceStatus === "Paid" ? "Paid" : "UnPaid",
        totalPay: rawInvoice.totalAmount,
        invoicePdfPath: rawInvoice.invoicePdfPath,
        ShiftDetails:
          rawInvoice.invoiceDetails?.map((detail: RawInvoiceDetail) => {
            try {
              const shiftJson = JSON.parse(detail.shiftJson);
              return {
                shiftId: shiftJson.ShiftId,
                date: shiftJson.Date,
                checkIn: shiftJson.CheckIn,
                endShift: shiftJson.CheckOut,
                calculatedHours: shiftJson.TotalHours,
                adjustedHours: shiftJson.AdjustedHours,
                dailyWage: detail.dailyWagesRate,
                payData: {
                  overtimeHours: detail.overtimeHours,
                  totalPay: detail.totalAmount,
                },
              };
            } catch (error) {
              console.error("Failed to parse shiftJson:", error);
              return null;
            }
          }).filter((item): item is ShiftDetail => item !== null) ?? [],
      };
    });
  }, [invoicesState?.data, workers]);

  // --- Filtered Invoices ---
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (filters?.worker && !invoice.workerName.toLowerCase().includes((filters.worker ?? "").toLowerCase()))
        return false;

      if (filters?.search) {
        const searchTerm = (filters.search ?? "").toLowerCase();
        const matches =
          invoice.workerName.toLowerCase().includes(searchTerm) ||
          invoice.workerId.toString().includes(searchTerm) ||
          invoice.id.toString().includes(searchTerm) ||
          (invoice.email ?? "").toLowerCase().includes(searchTerm);
        if (!matches) return false;
      }

      if (filters?.status && invoice.Status !== filters.status) return false;
      if (filters?.payment && invoice.payment !== filters.payment) return false;

      if (filters?.from || filters?.to) {
        const createdOn = invoice.createdOn;
        if (!createdOn) return false;
        const invoiceDate = createdOn.split("T")[0];
        if (!invoiceDate || !/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) return false;
        if (filters.from && invoiceDate < filters.from) return false;
        if (filters.to && invoiceDate > filters.to) return false;
      }

      return true;
    });
  }, [invoices, filters]);

  // --- Filter Summary Text ---
  const filterSummaryText = useMemo(() => {
    const count = filteredInvoices.length;
    if (count === 0) return "No invoices found";

    const parts: string[] = [`Showing ${count} invoice${count !== 1 ? "s" : ""}`];

    if (filters?.from && filters?.to) parts.push(`from ${filters.from} to ${filters.to}`);
    else if (filters?.from) parts.push(`from ${filters.from}`);
    else if (filters?.to) parts.push(`up to ${filters.to}`);

    if (filters?.status) parts.push(`• ${filters.status}`);
    if (filters?.payment) parts.push(`• ${filters.payment}`);
    if (filters?.worker) parts.push(`• ${filters.worker}`);
    if (filters?.search) parts.push(`• "${filters.search}"`);

    return parts.join(" ");
  }, [filteredInvoices.length, filters]);

  // --- State ---
  const [selected, setSelected] = useState<number[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrlToShow, setPdfUrlToShow] = useState<string | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "Status", desc: true } 
  ]);

  useEffect(() => {
    dispatch(fetchMasterInvoices());
    dispatch(fetchWorkers());
  }, [dispatch]);

  // --- Handlers ---
  const handleDelete = (id: number) => {
    Swal.fire({
      icon: "warning",
      title: "Delete Invoice?",
      text: "This action cannot be undone!",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteMasterInvoice(id))
          .unwrap()
          .then(() => Swal.fire("Deleted!", "The invoice has been deleted.", "success"))
          .catch((error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : "Could not delete the invoice.";
            Swal.fire("Failed!", errorMessage, "error");
          });
        refreshInvoices();
      }
    });
  };

  const handlePdfView = (invoice: Invoice) => {
    if (!invoice.invoicePdfPath) {
      Swal.fire({ icon: "error", title: "PDF Missing", text: "No PDF file path is available." });
      return;
    }
    const fullUrl = `${PDF_URL?.replace(/\/$/, "")}/${invoice.invoicePdfPath.replace(/^\//, "")}`;
    setPdfUrlToShow(fullUrl);
    setShowPdfModal(true);
  };

  const firstSelectedWorkerId = useMemo(() => {
    if (selected.length === 0) return null;
    const firstInvoice = invoices.find((inv) => inv.id === selected[0]);
    return firstInvoice?.workerId ?? null;
  }, [selected, invoices]);

  const toggleSelect = (id: number, workerId: number) => {
    setSelected((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) return prev.filter((s) => s !== id);
      if (prev.length === 0 || workerId === firstSelectedWorkerId) return [...prev, id];
      Swal.fire({
        icon: "warning",
        title: "Cannot Select",
        text: "Bulk payment requires selecting invoices for only one worker at a time.",
      });
      return prev;
    });
  };

  const clearSelection = () => setSelected([]);

  const handleBulkPayment = () => {
    if (!selected.length) {
      Swal.fire({ icon: "warning", title: "No Invoices Selected", text: "Please select at least one invoice." });
      return;
    }
    setShowBulkPaymentModal(true);
    refreshInvoices();
  };

  const selectedWorkerInfo = useMemo(() => {
    if (selected.length === 0) return null;
    const firstInvoice = invoices.find((inv) => inv.id === selected[0]);
    return firstInvoice ? { name: firstInvoice.workerName, id: firstInvoice.workerId } : null;
  }, [selected, invoices]);

  // --- Columns ---
  const columns: ColumnDef<Invoice>[] = useMemo(
    () => [
      // Select
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={
              selected.length === filteredInvoices.length &&
              filteredInvoices.length > 0 &&
              !!firstSelectedWorkerId
            }
            onChange={(e) => {
              if (e.target.checked) {
                const firstRowWorkerId = filteredInvoices[0]?.workerId;
                if (firstRowWorkerId) {
                  const selectableRows = filteredInvoices.filter((inv) => inv.workerId === firstRowWorkerId);
                  setSelected(selectableRows.map((inv) => inv.id));
                }
              } else {
                clearSelection();
              }
            }}
            disabled={
              filteredInvoices.length > 0 &&
              new Set(filteredInvoices.map((inv) => inv.workerId)).size > 1 &&
              selected.length === 0
            }
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800"
          />
        ),
        cell: ({ row }) => {
          const rowWorkerId = row.original.workerId;
          const isSelected = selected.includes(row.original.id);
          const isSelectable = selected.length === 0 || rowWorkerId === firstSelectedWorkerId;

          return (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                toggleSelect(row.original.id, rowWorkerId);
              }}
              disabled={!isSelectable && selected.length > 0}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                !isSelectable && selected.length > 0
                  ? `Invoices for Worker #${firstSelectedWorkerId} are already selected.`
                  : undefined
              }
            />
          );
        },
        size: 50,
      }),

      // ID
      columnHelper.accessor("invoiceid", {
        header: ({ column }) => (
          <button onClick={column.getToggleSortingHandler()} className="flex items-center space-x-1">
            <span>ID</span>
            <SortIcon sort={column.getIsSorted()} />
          </button>
        ),
        cell: (info) => (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{info.getValue()}</span>
        ),
        size: 70,
      }),

      // Worker
      columnHelper.accessor("workerName", {
        header: ({ column }) => (
          <button onClick={column.getToggleSortingHandler()} className="flex items-center space-x-1">
            <span>Worker</span>
            <SortIcon sort={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => {
          const worker = workers.find((w) => w.id === row.original.workerId);
          const hasImage = worker?.profilePictureUrl && worker.profilePictureUrl.trim() !== "";
          const avatarText = getWorkerAvatar(row.original.workerName);

          return (
            <div className="flex items-center space-x-2.5">
              <div className="relative w-10 h-10 flex-shrink-0">
                {hasImage && (
                  <img
                    src={worker.profilePictureUrl}
                    alt={row.original.workerName}
                    className="w-full h-full rounded-full object-cover shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      (target.nextElementSibling as HTMLElement).style.display = "flex";
                    }}
                  />
                )}
                <div
                  className={`absolute inset-0 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-blue-200/50 dark:ring-blue-700/50 backdrop-blur-sm transition-opacity ${
                    hasImage ? "hidden" : "flex"
                  } bg-blue-500 dark:bg-blue-600`}
                >
                  {avatarText}
                </div>
              </div>
              <div className="min-w-0 ms-1 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {row.original.workerName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {row.original.email || "—"}
                </p>
              </div>
            </div>
          );
        },
        size: 230,
      }),

      // Status
      columnHelper.accessor("Status", {
        header: ({ column }) => (
          <button onClick={column.getToggleSortingHandler()} className="flex items-center space-x-1 mx-auto">
            <span>Status</span>
            <SortIcon sort={column.getIsSorted()} />
          </button>
        ),
        cell: (info) => {
          const status = info.getValue();
          return (
            <div className="flex justify-center">
              <span
                className={`
                  px-2.5 py-0.5 text-xs font-semibold rounded-full
                  ${
                    status === "Paid"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                      : status === "UnPaid"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"
                  }
                `}
              >
                {status}
              </span>
            </div>
          );
        },
        size: 100,
      }),

      // Amount
      columnHelper.accessor("totalPay", {
        header: ({ column }) => (
          <button onClick={column.getToggleSortingHandler()} className="flex items-center space-x-1 mx-auto">
            <span>Amount</span>
            <SortIcon sort={column.getIsSorted()} />
          </button>
        ),
        cell: (info) => (
          <div className="font-bold text-green-700 dark:text-green-400 text-sm text-center flex items-center justify-center gap-1">
            <FaEuroSign className="w-3.5 h-3.5" />
            {info.getValue()?.toFixed(2) ?? "0.00"}
          </div>
        ),
        size: 110,
      }),

      // Actions
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const inv = row.original;
          return (
            <div className="flex gap-1.5 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedInvoice(inv);
                  setShowViewModal(true);
                }}
                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 dark:hover:bg-blue-800/50 transition-colors"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </button>

              {inv.invoicePdfPath && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePdfView(inv);
                  }}
                  className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/40 dark:text-purple-400 dark:hover:bg-purple-800/50 transition-colors"
                  title="View PDF"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(inv.id);
                }}
                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-800/50 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedInvoice(inv);
                  setShowPaymentModal(true);
                }}
                className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-800/50 transition-colors"
                title="Pay"
              >
                <FaEuroSign className="w-4 h-4" />
              </button>
            </div>
          );
        },
        size: 150,
      }),
    ],
    [selected, firstSelectedWorkerId, filteredInvoices.length, handleDelete, handlePdfView, PDF_URL, workers]
  );

  const SortIcon = ({ sort }: { sort: false | "asc" | "desc" }) => {
    if (sort === "asc") return <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
    if (sort === "desc") return <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
    return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 opacity-60 group-hover:opacity-100 transition-opacity" />;
  };

  const table = useReactTable({
    data: filteredInvoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  });

  // --- Render ---
  return (
    <div className="w-full mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl shadow-sm">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Invoice Records</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredInvoices.length} {filteredInvoices.length === 1 ? "invoice" : "invoices"} found
            </p>
          </div>
        </div>

        {/* Filter Summary Bar */}
        {(filters?.from || filters?.to || filters?.status || filters?.payment || filters?.worker || filters?.search) && (
          <div className="mt-3 px-2">
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1.5 rounded-full">
              {filterSummaryText}
            </span>
          </div>
        )}
      </div>

      {/* Selected Bar */}
      {selected.length > 0 && (
        <div className="p-3 flex flex-wrap gap-3 border-b bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-blue-800 dark:text-blue-200">
              {selected.length} invoice{selected.length > 1 ? "s" : ""} selected
              {selectedWorkerInfo && (
                <span className="ml-1.5 text-sm font-medium text-blue-600 dark:text-blue-300">
                  — {selectedWorkerInfo.name}
                </span>
              )}
            </span>
            <button
              onClick={clearSelection}
              className="px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/50 transition"
            >
              Clear
            </button>
          </div>
          <button
            onClick={handleBulkPayment}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <FaEuroSign className="w-4 h-4" />
            Pay Selected ({selected.length})
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider group"
                    style={{ width: header.getSize() === 0 ? "auto" : header.getSize() }}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {invoicesLoading || workersLoading ? (
              <tr>
                <td colSpan={table.getAllColumns().length} className="py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading invoices...</p>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getAllColumns().length} className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No invoices found</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filters.</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`
                    hover:bg-blue-50/70 dark:hover:bg-blue-950/50 transition-all duration-150 cursor-pointer
                    ${selected.includes(row.original.id) ? "bg-blue-50 dark:bg-blue-950/70 ring-1 ring-blue-500 ring-inset" : ""}
                  `}
                  onClick={() => {
                    const rowWorkerId = row.original.workerId;
                    const isSelectable = selected.length === 0 || rowWorkerId === firstSelectedWorkerId;
                    if (isSelectable || selected.includes(row.original.id)) {
                      toggleSelect(row.original.id, rowWorkerId);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
          Showing <strong>{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</strong> to{" "}
          <strong>
            {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredInvoices.length)}
          </strong>{" "}
          of <strong>{filteredInvoices.length}</strong> invoices
        </div>

        <div className="flex items-center gap-2">
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
          >
            {[10, 20, 30, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
              const page = Math.max(0, Math.min(table.getPageCount() - 1, table.getState().pagination.pageIndex - 2 + i));
              if (page < 0) return null;
              return (
                <button
                  key={page}
                  onClick={() => table.setPageIndex(page)}
                  className={`px-2.5 py-1 text-xs font-medium rounded border transition ${
                    page === table.getState().pagination.pageIndex
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
                >
                  {page + 1}
                </button>
              );
            })}

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedInvoice && (
        <>
          <ViewInvoiceModal
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false);
              setSelectedInvoice(null);
            }}
            invoice={selectedInvoice}
            worker={{ name: selectedInvoice.workerName, id: selectedInvoice.workerId }}
          />
          <ProcessPaymentModal
            isOpen={showPaymentModal}
            refreshInvoices={refreshInvoices}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedInvoice(null);
            }}
            invoice={selectedInvoice}
            worker={{ name: selectedInvoice.workerName, id: selectedInvoice.workerId }}
          />
        </>
      )}
      {selectedWorkerInfo && (
        <BulkPaymentModal
          isOpen={showBulkPaymentModal}
          refreshInvoices={refreshInvoices}
          onClose={() => {
            setShowBulkPaymentModal(false);
            clearSelection();
          }}
          invoices={invoices.filter((inv) => selected.includes(inv.id))}
          worker={selectedWorkerInfo}
        />
      )}
      {pdfUrlToShow && (
        <PdfViewerModal
          isOpen={showPdfModal}
          onClose={() => {
            setShowPdfModal(false);
            setPdfUrlToShow(null);
          }}
          pdfUrl={pdfUrlToShow}
        />
      )}
    </div>
  );
}