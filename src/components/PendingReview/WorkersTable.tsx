"use client";

import React, { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  PaginationState,
  ColumnDef,
} from "@tanstack/react-table";
import { Eye, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, User } from "lucide-react";
import { FaEuroSign } from "react-icons/fa";

interface ShiftDetail {
  ShiftId?: number;
  Date?: string;
  TotalHours?: number;
}

interface JsonWorker {
  WorkerID?: string | number;
  Worker?: string;
  Email?: string;
  TotalHours?: number;
  Overtime?: number;
  TotalPay?: number | null;
  Status?: string;
  Shifts?: number;
  PayPeriod?: string;
  ShiftDetails?: ShiftDetail[];
  HourlyRate?: number | null;
  DailyWagesRate?: number | null;
  Actions?: string[];
  ProfilePictureUrl?: string; // Optional profile image
}

interface WorkersTableProps {
  workers: JsonWorker[];
  fromDate: string;
  toDate: string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  viewDetails: (workerId: string) => void;
}

/* ------------------- Helper: Avatar ------------------- */
const getAvatar = (name?: string, picture?: string) => {
  if (picture?.trim()) return picture;
  if (!name || name.trim() === "" || name.toLowerCase().includes("unknown")) return "UN";
  return name
    .trim()
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

/* ------------------- Column Helper ------------------- */
const columnHelper = createColumnHelper<any>();

export default function WorkersTable({
  workers,
  fromDate,
  toDate,
  getStatusColor,
  getStatusText,
  viewDetails,
}: WorkersTableProps) {
  /* ------------------- Date Filtering ------------------- */
  const getFilteredShiftDetails = (shiftDetails: ShiftDetail[] = []) => {
    if (!Array.isArray(shiftDetails)) return [];
    if (!fromDate) return shiftDetails;

    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = toDate && toDate !== fromDate ? new Date(toDate) : new Date(fromDate);
    end.setHours(23, 59, 59, 999);

    return shiftDetails.filter((s) => {
      if (!s?.Date) return false;
      const d = new Date(s.Date);
      d.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
  };

  /* ------------------- Format Data ------------------- */
  const formattedData = useMemo(() => {
    return workers.map((w) => {
      const filtered = getFilteredShiftDetails(w.ShiftDetails);
      const totalHours = filtered.reduce((s, sh) => s + (sh.TotalHours ?? 0), 0);
      const overtime = filtered.reduce((s, sh) => {
        const h = sh.TotalHours ?? 0;
        return s + (h > 8 ? h - 8 : 0);
      }, 0);
      const totalPay = filtered.reduce((s, sh) => {
        const h = sh.TotalHours ?? 0;
        const reg = Math.min(h, 8);
        const ot = h > 8 ? h - 8 : 0;
        const rate = w.HourlyRate ?? 0;
        return s + reg * rate + ot * rate * 1.5;
      }, 0);

      return {
        ...w,
        _id: w.WorkerID?.toString() || "unknown",
        _name: w.Worker?.trim() || "Unknown",
        _email: w.Email || "No email",
        _filteredShifts: filtered.length,
        _totalHours: totalHours,
        _overtime: overtime,
        _totalPay: totalPay,
        _status: (w.Status ?? "").toLowerCase().replace(/\s+/g, ""),
        _avatarImg: w.ProfilePictureUrl?.trim() || null,
        _avatarText: getAvatar(w.Worker, w.ProfilePictureUrl),
      };
    });
  }, [workers, fromDate, toDate]);

  const filteredWorkers = useMemo(() => {
    return formattedData.filter((w) => w._filteredShifts > 0);
  }, [formattedData]);

  /* ------------------- Table State ------------------- */
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  /* ------------------- Columns ------------------- */
  const columns: ColumnDef<any>[] = useMemo(
    () => [
      // Worker
      columnHelper.accessor("_name", {
        id: "worker",
        header: ({ column }) => (
          <button onClick={column.getToggleSortingHandler()} className="flex items-center gap-1">
            Worker
            <SortIcon sort={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => {
          const name = row.original._name;
          const email = row.original._email;
          const id = row.original._id;
          const avatarImg = row.original._avatarImg;
          const avatarTxt = row.original._avatarText;

          return (
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                {avatarImg && (
                  <img
                    src={avatarImg}
                    alt={name}
                    className="w-full h-full rounded-full object-cover shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      ((e.target as HTMLImageElement).nextElementSibling as HTMLElement).style.display = "flex";
                    }}
                  />
                )}
                <div
                  className={`absolute inset-0 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-blue-200/50 dark:ring-blue-700/50 backdrop-blur-sm transition-opacity ${
                    avatarImg ? "hidden" : "flex"
                  } bg-gradient-to-br from-blue-500 to-blue-600`}
                >
                  {avatarTxt}
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  ID: #{id} • {email}
                </p>
              </div>
            </div>
          );
        },
        size: 280,
      }),

      // Shifts
      columnHelper.accessor("_filteredShifts", {
        header: ({ column }) => (
          <button onClick={column.getToggleSortingHandler()} className="flex items-center gap-1 mx-auto">
            Shifts
            <SortIcon sort={column.getIsSorted()} />
          </button>
        ),
        cell: (info) => <span className="text-center block">{info.getValue()}</span>,
        size: 80,
      }),

      // Hours
      columnHelper.accessor("_totalHours", {
        header: ({ column }) => (
          <button onClick={column.getToggleSortingHandler()} className="flex items-center gap-1 mx-auto">
            Hours
            <SortIcon sort={column.getIsSorted()} />
          </button>
        ),
        cell: (info) => <span className="text-center block">{info.getValue().toFixed(2)}h</span>,
        size: 90,
      }),

      // Overtime
      columnHelper.accessor("_overtime", {
        header: ({ column }) => (
          <button onClick={column.getToggleSortingHandler()} className="flex items-center gap-1 mx-auto">
            Overtime
            <SortIcon sort={column.getIsSorted()} />
          </button>
        ),
        cell: (info) => (
          <span className="text-center block text-orange-600 dark:text-orange-400">
            {info.getValue().toFixed(1)}h
          </span>
        ),
        size: 100,
      }),

      // Total Pay
      columnHelper.accessor("_totalPay", {
        header: ({ column }) => (
          <button onClick={column.getToggleSortingHandler()} className="flex items-center gap-1 mx-auto">
            Total Pay
            <SortIcon sort={column.getIsSorted()} />
          </button>
        ),
        cell: (info) => (
          <div className="flex items-center justify-center gap-1 text-green-700 dark:text-green-400 font-bold">
            <FaEuroSign className="w-3.5 h-3.5" />
            {info.getValue()?.toFixed(2) ?? "0.00"}
          </div>
        ),
        size: 110,
      }),

      // Status
      columnHelper.accessor("_status", {
        header: ({ column }) => (
          <button onClick={column.getToggleSortingHandler()} className="flex items-center gap-1 mx-auto">
            Status
            <SortIcon sort={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => {
          const status = row.original._status;
          const displayStatus = status === "pendingreview" ? "pending" : status;
          return (
            <div className="flex justify-center">
              <span className={`${getStatusColor(displayStatus)} text-white text-xs px-4 py-1 rounded-full`}>
                {getStatusText(displayStatus)}
              </span>
            </div>
          );
        },
        size: 120,
      }),

      // Action
      columnHelper.display({
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <button
              onClick={() => viewDetails(row.original._id)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              Details
            </button>
          </div>
        ),
        size: 120,
      }),
    ],
    [getStatusColor, getStatusText, viewDetails]
  );

  const table = useReactTable({
    data: filteredWorkers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  /* ------------------- No Data UI ------------------- */
  if (filteredWorkers.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No workers found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          No workers have shifts in the selected date range.
        </p>
      </div>
    );
  }

  /* ------------------- Render ------------------- */
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-5 py-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl shadow-sm">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Worker Summary</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredWorkers.length} worker{filteredWorkers.length !== 1 ? "s" : ""} in range
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider group"
                    style={{ width: header.getSize() === 0 ? "auto" : header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-blue-50/70 dark:hover:bg-slate-800 transition-all duration-150"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden p-4 space-y-4">
        {table.getRowModel().rows.map((row) => {
          const w = row.original;
          const status = w._status === "pendingreview" ? "pending" : w._status;

          return (
            <div
              key={w._id}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow border dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    {w._avatarImg && (
                      <img
                        src={w._avatarImg}
                        alt={w._name}
                        className="w-full h-full rounded-full object-cover shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          ((e.target as HTMLImageElement).nextElementSibling as HTMLElement).style.display = "flex";
                        }}
                      />
                    )}
                    <div
                      className={`absolute inset-0 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-blue-200/50 dark:ring-blue-700/50 ${
                        w._avatarImg ? "hidden" : "flex"
                      } bg-gradient-to-br from-blue-500 to-blue-600`}
                    >
                      {w._avatarText}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{w._name}</div>
                    <div className="text-sm text-gray-500">#{w._id}</div>
                  </div>
                </div>
                <span className={`${getStatusColor(status)} text-white text-xs px-2 py-1 rounded-full`}>
                  {getStatusText(status)}
                </span>
              </div>

              <div className="text-blue-600 dark:text-blue-400 mb-3">{w._email}</div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                <div>
                  <div className="text-xs text-gray-500">Hours</div>
                  <div className="font-bold">{w._totalHours.toFixed(1)}h</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Overtime</div>
                  <div className="font-bold text-orange-500">{w._overtime.toFixed(1)}h</div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center space-x-1 text-green-600 font-bold text-lg">
                  <FaEuroSign />
                  <span>{w._totalPay?.toFixed(2) ?? "N/A"}</span>
                </div>
                <button
                  onClick={() => viewDetails(w._id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-gray-800">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
          Showing{" "}
          <strong>
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          </strong>{" "}
          to{" "}
          <strong>
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredWorkers.length
            )}
          </strong>{" "}
          of <strong>{filteredWorkers.length}</strong> workers
        </div>

        <div className="flex items-center gap-2">
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
          >
            {[10, 20, 30, 50].map((s) => (
              <option key={s} value={s}>
                {s} / page
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
              const page = Math.max(
                0,
                Math.min(table.getPageCount() - 1, table.getState().pagination.pageIndex - 2 + i)
              );
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
    </div>
  );
}

/* ------------------- Sort Icon ------------------- */
function SortIcon({ sort }: { sort: false | "asc" | "desc" }) {
  if (sort === "asc") return <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
  if (sort === "desc") return <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
  return (
    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 opacity-60 group-hover:opacity-100 transition-opacity" />
  );
}   