"use client";

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import {
  formatDateOnlyUK,
  formatTimeOnlyUK,
  calculateShiftDuration,
} from "@/utils/date";

interface ProjectShift {
  id: number;
  checkIn: string;
  endShift: string | null;
  createdByRole?: string;
  createdByName?: string;
}

interface ShiftLogTableProps {
  shifts: ProjectShift[];
}

const ShiftLogTable: React.FC<ShiftLogTableProps> = ({ shifts }) => {
  const [globalFilter, setGlobalFilter] = useState("");

  // ✅ Sort by checkIn (latest first)
  const sortedShifts = useMemo(
    () =>
      [...shifts].sort(
        (a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
      ),
    [shifts]
  );

  // ✅ Columns
  const columns = useMemo<ColumnDef<ProjectShift>[]>(
    () => [
      {
        accessorKey: "checkIn",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Date
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {formatDateOnlyUK(row.original.checkIn)}
          </span>
        ),
      },
      {
        accessorKey: "checkInTime",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Time In
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
          </button>
        ),
        cell: ({ row }) => (
          <span>{formatTimeOnlyUK(row.original.checkIn)}</span>
        ),
      },
      {
        accessorKey: "endShift",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Time Out
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
          </button>
        ),
        cell: ({ row }) => {
          const endShift = row.original.endShift;
          const text = endShift ? formatTimeOnlyUK(endShift) : "Working...";
          return (
            <span
              className={
                endShift
                  ? "text-gray-700 dark:text-gray-300"
                  : "text-green-600 font-medium dark:text-green-400"
              }
            >
              {text}
            </span>
          );
        },
      },
      {
        accessorKey: "hours",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Hours
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {calculateShiftDuration(row.original.checkIn, row.original.endShift)}
          </span>
        ),
      },
    {
        header: "Manual",
        accessorKey: "createdByRole",
        cell: ({ row }) => {
          const shift = row.original;
          const role = shift.createdByRole || "";
          const name = shift.createdByName || "";

          const isAdmin = role === "Admin";
          const label = isAdmin ? "Manual" : "Own";
          const bgColor = isAdmin
            ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800"
            : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800";
          const dotColor = isAdmin ? "bg-orange-500 dark:bg-orange-400" : "bg-teal-500 dark:bg-teal-400";

          return (
            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border ${bgColor}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor}`} />
              {label}: <br />
              ({name})
            </span>
          );
        },
      },  
    ],
    []
  );

  const table = useReactTable({
    data: sortedShifts,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 5 } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="mb-6">
      {/* Header + Search */}
      <div className="w-full mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Check-In / Check-Out Logs
          </h2>
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search shifts..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-3 border-b border-gray-200 dark:border-gray-700 font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-2 text-md text-gray-700 dark:text-gray-300"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-4 text-center text-gray-500 dark:text-gray-400"
                >
                  No shifts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <div className="text-gray-600 dark:text-gray-300">
          Page{" "}
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded-md disabled:opacity-50 dark:border-gray-700 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded-md disabled:opacity-50 dark:border-gray-700 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftLogTable;
