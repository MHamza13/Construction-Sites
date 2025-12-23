"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMasterInvoices,
} from "@/redux/invoiceMaster/invoiceMasterSlice";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { RootState, AppDispatch } from "@/redux/store";
import { FaEuroSign } from "react-icons/fa";
import { formatDateOnlyUK } from "@/utils/date";
import { FileText } from "lucide-react";

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
}

interface Totals {
  totalShifts: number;
  totalHours: number;
  totalPay?: number | null;
}

interface Invoice {
  id: number;
  workerId: number;
  workerName: string;
  email?: string;
  profilePictureUrl?: string;
  initials: string;
  shiftIds?: number[];
  totals: Totals;
  internalNotes?: string;
  payPeriod?: string;
  Status?: string;
  totalPay?: number | null;
}

/* --------------------------------------------------------------- */
/*                     TANSTACK TABLE SETUP                        */
/* --------------------------------------------------------------- */
const columnHelper = createColumnHelper<Invoice>();

const IMAGE_BASE_URL = "https://salmanfarooq1-001-site1.jtempurl.com";

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("workerName", {
    header: "Worker",
    cell: (info) => {
      const row = info.row.original;
      const name = row.workerName;
      const email = row.email ?? "";
      const profileImageUrl = row.profilePictureUrl
        ? row.profilePictureUrl
        : null;
      const initials = row.initials;

      return (
        <div className="flex items-center space-x-3">
          {/* Avatar with Real Image + Fallback */}
          <div className="relative w-10 h-10 flex-shrink-0">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={name}
                className="w-full h-full rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}

            {/* Initials Fallback */}
            <div
              className={`absolute inset-0 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-blue-200/50 dark:ring-blue-700/50 backdrop-blur-sm transition-opacity ${
                profileImageUrl ? "hidden" : "flex"
              } bg-gradient-to-br from-blue-500 to-blue-600`}
            >
              {initials}
            </div>
          </div>

          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {name}
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-xs">
              {email}
            </div>
          </div>
        </div>
      );
    },
  }),

  columnHelper.accessor("totalPay", {
    header: "Amount",
    cell: (info) => (
      <div className="font-bold text-green-700 dark:text-green-400 text-sm text-center">
        {info.getValue() != null ? (
          <>
            <FaEuroSign className="inline w-3 h-3 mr-1" />
            {info.getValue()?.toFixed(2)}
          </>
        ) : (
          "N/A"
        )}
      </div>
    ),
  }),

  columnHelper.accessor("payPeriod", {
    header: "Pay Period",
    cell: (info) => {
      const period = info.getValue() ?? "N/A";
      return (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {period === "N/A" ? period : formatDateOnlyUK(period.split(" - ")[0])}
        </span>
      );
    },
  }),

  columnHelper.accessor("Status", {
    header: "Status",
    cell: (info) => (
      <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
        {info.getValue() ?? "Pending"}
      </span>
    ),
  }),
];

/* --------------------------------------------------------------- */
/*                         COMPONENT                               */
/* --------------------------------------------------------------- */
export default function PendingInvoices() {
  const dispatch = useDispatch<AppDispatch>();

  const invoicesState = useSelector((state: RootState) => state.masterInvoice);
  const { items: workers, loading: workersLoading } = useSelector(
    (state: RootState) => state.workers
  );
  const invoicesLoading = !!invoicesState?.loading;

  /* ------------------- Transform raw data ------------------- */
  const invoices = useMemo(() => {
    const rawInvoices: RawInvoice[] = invoicesState?.data ?? [];
    if (!rawInvoices.length || !workers.length) return [];

    const workerMap = new Map(workers.map((w) => [w.id, w]));

    const getInitials = (firstName: string, lastName: string): string => {
      const first = firstName?.[0]?.toUpperCase() || "?";
      const last = lastName?.[0]?.toUpperCase() || "";
      return first + last;
    };

    return rawInvoices
      .filter((inv) => inv.invoiceStatus === "UnPaid")
      .map((raw): Invoice => {
        const worker = workerMap.get(raw.workerId);
        const workerName = worker
          ? `${worker.firstName} ${worker.lastName}`
          : `Unknown #${raw.workerId}`;
        const email = worker?.email;
        const initials = worker
          ? getInitials(worker.firstName, worker.lastName)
          : "??";

        return {
          id: raw.id,
          workerId: raw.workerId,
          workerName,
          email,
          profilePictureUrl: worker?.profilePictureUrl || null,
          initials,
          shiftIds: raw.shiftIds?.split(",").map(Number) || [],
          totals: {
            totalShifts: raw.invoiceDetails?.length || 0,
            totalHours: raw.totalHours || 0,
            totalPay: raw.totalAmount,
          },
          internalNotes: raw.notes,
          payPeriod: raw.invoiceDetails?.[0]?.invoicePeriod || "N/A",
          Status: raw.invoiceStatus,
          totalPay: raw.totalAmount,
        };
      });
  }, [invoicesState?.data, workers]);

  /* ------------------- Table state ------------------- */
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data: invoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: { pagination: { pageSize: 5 } },
  });

  /* ------------------- Fetch data ------------------- */
  useEffect(() => {
    dispatch(fetchMasterInvoices());
    dispatch(fetchWorkers());
  }, [dispatch]);

  /* --------------------------------------------------------------- */
  return (
    <div className="w-full mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-gray-900 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Pending Invoices
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {invoices.length} pending{" "}
                {invoices.length === 1 ? "invoice" : "invoices"}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100 text-sm uppercase cursor-pointer"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {/* Sorting indicator */}
                      {{
                        asc: " Ascending",
                        desc: " Descending",
                      }[header.column.getIsSorted() as string] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoicesLoading || workersLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-300"
                  >
                    Loading data...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center"
                  >
                    <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      No Pending Invoices
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      All invoices are paid or rejected.
                    </p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {invoices.length > 5 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}