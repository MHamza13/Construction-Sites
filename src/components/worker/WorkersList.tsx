"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Phone,
  Edit,
  Eye,
  Mail,
  Clock,
  Timer,
  CheckCircle,
} from "lucide-react";
import EditWorkerModal from "@/components/worker/EditWorkerModal";
import type { Worker } from "@/redux/worker/workerSlice";
import { FaEuroSign } from "react-icons/fa";

interface WorkersListProps {
  workers: Worker[];
  onEdit: (worker: Worker) => void;
  onApprove: (workerId: string) => void;
  approvingWorkerId: string | null;
  authLoading: boolean;
}

export default function WorkersList({
  workers,
  onEdit,
  onApprove,
  approvingWorkerId,
  authLoading,
}: WorkersListProps) {
  const router = useRouter();

  const sortedWorkers = useMemo(() => {
    return [...workers].sort((a, b) => {
      if (a.isApprovedByAdmin === b.isApprovedByAdmin) return 0;
      return a.isApprovedByAdmin ? 1 : -1;
    });
  }, [workers]);

  const getAvatarUrl = (worker: Worker) => {
    if (worker.profilePictureUrl) return worker.profilePictureUrl;
    const name = `${worker.firstName || ""} ${worker.lastName || ""}`.trim() || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
  };

  const columns = useMemo<ColumnDef<Worker>[]>(
    () => [
      {
        header: "Profile",
        cell: ({ row }) => {
          const worker = row.original;
          return (
            <div className="flex items-center gap-3">
              <img
                src={getAvatarUrl(worker)}
                alt={worker.firstName || "Worker"}
                width={40}
                height={40}
                className="rounded-full object-cover border border-gray-200 dark:border-gray-700"
              />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {worker.firstName} {worker.lastName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">ID: {worker.id}</div>
              </div>
            </div>
          );
        },
      },
      {
        header: "Contact",
        cell: ({ row }) => (
          <div className="space-y-1 text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Phone className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
              {row.original.phoneNumber || "N/A"}
            </div>
            <div className="flex items-center text-gray-600 truncate max-w-[200px] dark:text-gray-300">
              <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
              {row.original.email || "N/A"}
            </div>
          </div>
        ),
      },
      {
        header: "Experience",
        cell: ({ row }) => (
          <div className="flex items-center my-3 text-sm text-gray-700 dark:text-gray-300">
            <Clock className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
            {row.original.experience} yrs
          </div>
        ),
      },
      {
        header: "Daily Wage",
        cell: ({ row }) => (
          <div className="flex items-center my-3 text-sm text-gray-700 dark:text-gray-300">
            <FaEuroSign className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
            €{row.original.dailyWages}
          </div>
        ),
      },
      {
        header: "Per Hour",
        cell: ({ row }) => (
          <div className="flex items-center my-3 text-sm text-gray-700 dark:text-gray-300">
            <Timer className="w-4 h-4 mr-1 text-gray-500" />
            €{row.original.perHourSalary}
          </div>
        ),
      },
      {
        header: "Status",
        cell: ({ row }) => (
          <div className="flex items-center my-3">
            <span
              className={`inline-flex items-center justify-center min-w-[80px] px-3 py-1 text-xs font-medium rounded-full border ${
                row.original.isActive
                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700"
              }`}
            >
              {row.original.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        ),
      },
      {
        header: "Approved",
        cell: ({ row }) => (
          <div className="flex items-center my-3">
            <span
              className={`inline-flex items-center justify-center min-w-[80px] px-3 py-1 text-xs font-medium rounded-full border ${
                row.original.isApprovedByAdmin
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700"
              }`}
            >
              {row.original.isApprovedByAdmin ? "Approved" : "Pending"}
            </span>
          </div>
        ),
      },
      {
        header: "Actions",
        id: "actions",
        cell: ({ row }) => {
          const worker = row.original;
          const isApproving = approvingWorkerId === worker.id;

          return (
            <div className="flex justify-center items-center gap-2 px-4 py-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(worker);
                }}
                className="p-2 rounded-md bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 dark:bg-green-900 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-800"
                title="Edit"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/worker-management/${worker.id}`);
                }}
                className="p-2 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800"
                title="View"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

              {!worker.isApprovedByAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(worker.id);
                  }}
                  disabled={isApproving || authLoading}
                  className={`p-2 rounded-md bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700 dark:hover:bg-purple-800 ${
                    isApproving || authLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  title="Approve"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [router, onEdit, onApprove, approvingWorkerId, authLoading]
  );

  const table = useReactTable({
    data: sortedWorkers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  if (!workers.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-8 text-center border border-gray-200 dark:border-gray-700">
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No workers found</h3>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-700 dark:to-blue-900/30">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">All Workers</h2>
        <span className="text-sm text-gray-500 dark:text-gray-300">{workers.length} total</span>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 border-b dark:border-gray-600">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="even:bg-gray-50 dark:even:bg-gray-800 hover:bg-blue-50/40 dark:hover:bg-blue-900/30 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t flex flex-wrap items-center justify-between bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
              table.getCanPreviousPage()
                ? "bg-white hover:bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600"
                : "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-700/50 dark:text-gray-500 dark:border-gray-600 cursor-not-allowed"
            }`}
          >
            Prev
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
              table.getCanNextPage()
                ? "bg-white hover:bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600"
                : "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-700/50 dark:text-gray-500 dark:border-gray-600 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of {table.getPageCount()}
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded-md text-sm px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}